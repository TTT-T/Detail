import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, PORTAL_COOKIE } from '@/lib/jwt';
import AdminUsersClient from './admin-users-client';
import { PROJECTS } from '@/lib/projects';

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE)?.value;

  if (!token) redirect('/login');

  const payload = await verifyToken(token);
  if (!payload) redirect('/login');

  if (payload.portalRole !== 'SUPER_ADMIN' && payload.portalRole !== 'PORTAL_ADMIN') {
    redirect('/');
  }

  return <AdminUsersClient currentUserId={payload.sub} projects={PROJECTS} />;
}
