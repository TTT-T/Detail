'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectDef } from '@/lib/projects';

interface User {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  portalRole: string;
  projectRoles: Record<string, string>;
}

const PORTAL_ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PORTAL_ADMIN: 'Portal Admin',
  USER: 'User',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#f59e0b',
  PORTAL_ADMIN: '#6366f1',
  USER: '#64748b',
  ADMIN: '#ef4444',
  PM: '#8b5cf6',
  SUPERVISOR: '#3b82f6',
  TECHNICIAN: '#10b981',
  OUTSOURCED: '#f97316',
  MANAGER: '#06b6d4',
  VIEWER: '#64748b',
};

export default function DashboardClient({ user, projects }: { user: User; projects: ProjectDef[] }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function handleLaunch(projectId: string) {
    window.open(`/api/auth/sso?project=${projectId}`, '_blank');
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>
              🌐
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem', lineHeight: 1.2 }}>
                Wire &amp; Wireless
              </div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Internal Portal</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {(user.portalRole === 'SUPER_ADMIN' || user.portalRole === 'PORTAL_ADMIN') && (
              <>
                <a href="/admin/users" style={{
                  padding: '0.4rem 0.85rem', borderRadius: '8px',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none',
                }}>👥 Users</a>
                <a href="/admin/audit" style={{
                  padding: '0.4rem 0.85rem', borderRadius: '8px',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none',
                }}>📋 Audit</a>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '50%',
                background: user.avatarColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}>
                {initials}
              </div>
              <div style={{ display: 'none' }}>
                <div style={{ color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 500 }}>{user.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{user.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loggingOut ? '...' : 'ออกจากระบบ'}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>
            สวัสดี, {user.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            คุณมีสิทธิ์เข้าถึง {Object.keys(user.projectRoles).length} โปรเจกค์ ·{' '}
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              background: `${ROLE_COLORS[user.portalRole] ?? '#6366f1'}22`,
              color: ROLE_COLORS[user.portalRole] ?? '#6366f1',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}>
              {PORTAL_ROLE_LABEL[user.portalRole] ?? user.portalRole}
            </span>
          </p>
        </div>

        {/* Project Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}>
          {projects.map((project) => {
            const role = user.projectRoles[project.id];
            const hasAccess = Boolean(role);

            return (
              <div
                key={project.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${hasAccess ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  opacity: hasAccess ? 1 : 0.5,
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '48px', height: '48px',
                      borderRadius: '12px',
                      background: `${project.color}22`,
                      border: `1px solid ${project.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px',
                    }}>
                      {project.icon}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>
                        {project.name}
                      </h3>
                      {hasAccess ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: `${ROLE_COLORS[role] ?? project.color}22`,
                          color: ROLE_COLORS[role] ?? project.color,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          marginTop: '0.2rem',
                        }}>
                          {role}
                        </span>
                      ) : (
                        <span style={{ color: '#475569', fontSize: '0.75rem' }}>ไม่มีสิทธิ์เข้าถึง</span>
                      )}
                    </div>
                  </div>
                </div>

                <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  {project.description}
                </p>

                <button
                  onClick={() => hasAccess && handleLaunch(project.id)}
                  disabled={!hasAccess}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    border: hasAccess ? `1px solid ${project.color}44` : '1px solid rgba(255,255,255,0.05)',
                    background: hasAccess ? `${project.color}15` : 'transparent',
                    color: hasAccess ? project.color : '#334155',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: hasAccess ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  {hasAccess ? '🚀 เปิดใช้งาน' : '🔒 ไม่มีสิทธิ์'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '3rem', textAlign: 'center', color: '#334155', fontSize: '0.78rem' }}>
          Wire &amp; Wireless Internal Portal · SSO v1.0 · Login once, access everywhere
        </div>
      </main>
    </div>
  );
}
