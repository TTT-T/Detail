import { NextRequest, NextResponse } from 'next/server';
import { PORTAL_COOKIE, verifyToken, signSSOToken } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { getProjectUrl, getProjectSSOUrl, PROJECTS } from '@/lib/projects';

/**
 * GET /api/auth/sso?project=account_a_team
 * ออก short-lived SSO token (5 นาที) แล้ว redirect ไปยัง sub-project
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(PORTAL_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const projectId = request.nextUrl.searchParams.get('project');
  const project = PROJECTS.find((p) => p.id === projectId);

  if (!project) {
    return NextResponse.json({ error: 'Unknown project' }, { status: 400 });
  }

  // ตรวจสอบว่า user มีสิทธิ์เข้า project นี้
  const access = await prisma.projectAccess.findUnique({
    where: { userId_projectId: { userId: payload.sub, projectId: project.id } },
  });

  if (!access) {
    return NextResponse.redirect(new URL('/?error=no_access', request.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { projectAccess: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const projectRoles: Record<string, string> = {};
  for (const a of user.projectAccess) {
    projectRoles[a.projectId] = a.role;
  }

  // Log SSO launch event
  await prisma.auditEvent.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      projectId: 'portal',
      action: 'SSO_LAUNCH',
      resource: project.id,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    },
  }).catch(() => {});

  const ssoToken = await signSSOToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    portalRole: user.portalRole,
    projectRoles,
  });

  const redirectUrl = `${getProjectSSOUrl(project)}?token=${ssoToken}`;

  return NextResponse.redirect(redirectUrl);
}
