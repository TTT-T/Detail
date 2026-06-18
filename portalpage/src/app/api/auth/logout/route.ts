import { NextRequest, NextResponse } from 'next/server';
import { PORTAL_COOKIE, verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(PORTAL_COOKIE)?.value;

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.blacklistedToken.upsert({
        where: { token },
        create: { token, userId: payload.sub, expiresAt: exp },
        update: {},
      }).catch(() => {});
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(PORTAL_COOKIE);
  return response;
}
