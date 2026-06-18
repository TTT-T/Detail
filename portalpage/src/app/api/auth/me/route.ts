import { NextRequest, NextResponse } from 'next/server';
import { PORTAL_COOKIE, verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(PORTAL_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { projectAccess: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const projectRoles: Record<string, string> = {};
  for (const access of user.projectAccess) {
    projectRoles[access.projectId] = access.role;
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarColor: user.avatarColor,
    portalRole: user.portalRole,
    projectRoles,
  });
}
