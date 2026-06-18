import { NextRequest, NextResponse } from 'next/server';
import { PORTAL_COOKIE, verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';

/**
 * POST /api/audit
 * รับ audit event จาก sub-projects
 * Body: { projectId, action, resource?, detail?, userEmail?, userName? }
 * Authorization: Bearer <portal_token> หรือ cookie
 */
export async function POST(request: NextRequest) {
  let userId: string | undefined;
  let userEmail: string | undefined;
  let userName: string | undefined;

  // ลอง authenticate จาก cookie ก่อน
  const cookie = request.cookies.get(PORTAL_COOKIE)?.value;
  if (cookie) {
    const payload = await verifyToken(cookie);
    if (payload) {
      userId = payload.sub;
      userEmail = payload.email;
      userName = payload.name;
    }
  }

  // ลอง authenticate จาก Bearer token
  if (!userId) {
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '');
    if (bearer) {
      const payload = await verifyToken(bearer);
      if (payload) {
        userId = payload.sub;
        userEmail = payload.email;
        userName = payload.name;
      }
    }
  }

  const body = await request.json().catch(() => ({}));
  const { projectId, action, resource, detail } = body;

  // ถ้า body ส่ง userEmail/userName มาด้วย (สำหรับ sub-projects ที่ยังไม่มี portal token)
  const finalUserEmail = userEmail || body.userEmail;
  const finalUserName = userName || body.userName;

  if (!action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || undefined;

  await prisma.auditEvent.create({
    data: {
      userId,
      userEmail: finalUserEmail,
      userName: finalUserName,
      projectId,
      action,
      resource,
      detail,
      ipAddress: ip,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}

/**
 * GET /api/audit?project=...&userId=...&limit=100&offset=0
 * ดู audit events (admin only)
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(PORTAL_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.portalRole === 'USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get('project') || undefined;
  const filterUserId = searchParams.get('userId') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const offset = parseInt(searchParams.get('offset') || '0');

  const events = await prisma.auditEvent.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(filterUserId && { userId: filterUserId }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  const total = await prisma.auditEvent.count({
    where: {
      ...(projectId && { projectId }),
      ...(filterUserId && { userId: filterUserId }),
    },
  });

  return NextResponse.json({ events, total });
}
