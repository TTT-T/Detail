import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PORTAL_COOKIE, verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(PORTAL_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  if (payload.portalRole !== 'SUPER_ADMIN' && payload.portalRole !== 'PORTAL_ADMIN') return null;
  return payload;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: { projectAccess: true },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, name, password, portalRole, avatarColor, projectAccess } = await request.json();

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'อีเมลนี้ถูกใช้แล้ว' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name,
      password: hashed,
      avatarColor: avatarColor ?? '#6366f1',
      portalRole: portalRole ?? 'USER',
      projectAccess: projectAccess?.length
        ? {
            create: projectAccess.map((a: { projectId: string; role: string }) => ({
              projectId: a.projectId,
              role: a.role,
              grantedBy: admin.sub,
            })),
          }
        : undefined,
    },
    include: { projectAccess: true },
  });

  const { password: _, ...safeUser } = user;
  return NextResponse.json(safeUser, { status: 201 });
}
