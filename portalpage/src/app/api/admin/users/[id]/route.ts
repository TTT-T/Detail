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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { name, portalRole, isActive, password, avatarColor, projectAccess } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (portalRole !== undefined) updates.portalRole = portalRole;
  if (isActive !== undefined) updates.isActive = isActive;
  if (avatarColor !== undefined) updates.avatarColor = avatarColor;
  if (password) updates.password = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...updates,
      ...(projectAccess !== undefined
        ? {
            projectAccess: {
              deleteMany: {},
              create: projectAccess.map((a: { projectId: string; role: string }) => ({
                projectId: a.projectId,
                role: a.role,
                grantedBy: admin.sub,
              })),
            },
          }
        : {}),
    },
    include: { projectAccess: true },
  });

  const { password: _, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  if (id === admin.sub) {
    return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
