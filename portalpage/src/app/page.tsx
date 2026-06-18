import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, PORTAL_COOKIE } from '@/lib/jwt';
import { prisma } from '@/lib/db';
import { PROJECTS } from '@/lib/projects';
import DashboardClient from './dashboard-client';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE)?.value;

  if (!token) redirect('/login');

  const payload = await verifyToken(token);
  if (!payload) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { projectAccess: true },
  });

  if (!user || !user.isActive) redirect('/login');

  const projectRoles: Record<string, string> = {};
  for (const a of user.projectAccess) {
    projectRoles[a.projectId] = a.role;
  }

  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarColor: user.avatarColor,
    portalRole: user.portalRole as string,
    projectRoles,
  };

  return <DashboardClient user={userData} projects={PROJECTS} />;
}
