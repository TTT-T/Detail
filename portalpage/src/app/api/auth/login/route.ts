import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signPortalToken, PORTAL_COOKIE } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอก email และ password' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { projectAccess: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // Build project roles map
    const projectRoles: Record<string, string> = {};
    for (const access of user.projectAccess) {
      projectRoles[access.projectId] = access.role;
    }

    const token = await signPortalToken(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        portalRole: user.portalRole,
        projectRoles,
      },
      rememberMe ?? false
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log login event
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        projectId: 'portal',
        action: 'LOGIN',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    }).catch(() => {});

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarColor: user.avatarColor,
        portalRole: user.portalRole,
        projectRoles,
      },
    });

    response.cookies.set(PORTAL_COOKIE, token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
