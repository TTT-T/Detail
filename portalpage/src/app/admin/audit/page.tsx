import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, PORTAL_COOKIE } from '@/lib/jwt';
import AuditClient from './audit-client';

export default async function AuditPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE)?.value;
  if (!token) redirect('/login');

  const payload = await verifyToken(token);
  if (!payload || payload.portalRole === 'USER') redirect('/');

  return <AuditClient />;
}
