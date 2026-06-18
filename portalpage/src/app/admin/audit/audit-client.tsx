'use client';

import { useState, useEffect, useCallback } from 'react';

interface AuditEvent {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  projectId: string | null;
  action: string;
  resource: string | null;
  detail: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const PROJECT_LABELS: Record<string, string> = {
  account_a_team: '📊 Account A-Team',
  management_tracking: '📋 Management Tracking',
  team_performance: '📈 Track B',
  portal: '🌐 Portal',
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: '#10b981',
  LOGOUT: '#64748b',
  SSO_LOGIN: '#6366f1',
  SSO_LAUNCH: '#8b5cf6',
  CREATE: '#3b82f6',
  UPDATE: '#f59e0b',
  DELETE: '#ef4444',
  VIEW: '#94a3b8',
  EXPORT: '#06b6d4',
  IMPORT: '#ec4899',
};

export default function AuditClient() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (projectFilter) params.set('project', projectFilter);
    const res = await fetch(`/api/audit?${params}`);
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
      setTotal(data.total);
    }
    setLoading(false);
  }, [projectFilter, offset]);

  useEffect(() => { setOffset(0); }, [projectFilter]);
  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem',
          height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a href="/admin/users" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← Users</a>
            <span style={{ color: '#334155' }}>/</span>
            <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>Audit Log</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              style={{
                background: '#1e293b', color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.8rem',
              }}
            >
              <option value="">ทุกโปรเจกค์</option>
              {Object.entries(PROJECT_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
            <button
              onClick={load}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
          รวม {total.toLocaleString()} events · แสดง {offset + 1}–{Math.min(offset + limit, total)}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>กำลังโหลด...</div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['เวลา', 'ผู้ใช้', 'โปรเจกค์', 'Action', 'Resource', 'IP'].map((h) => (
                    <th key={h} style={{
                      padding: '0.75rem 1rem', textAlign: 'left',
                      color: '#64748b', fontSize: '0.75rem', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(e.createdAt).toLocaleDateString('th-TH', {
                        day: '2-digit', month: 'short', year: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <div style={{ color: '#f1f5f9', fontSize: '0.8rem' }}>{e.userName || '-'}</div>
                      <div style={{ color: '#475569', fontSize: '0.72rem' }}>{e.userEmail || e.userId || '-'}</div>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                      {e.projectId ? PROJECT_LABELS[e.projectId] ?? e.projectId : '-'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem', borderRadius: '5px',
                        background: `${ACTION_COLORS[e.action] ?? '#6366f1'}20`,
                        color: ACTION_COLORS[e.action] ?? '#a5b4fc',
                        fontSize: '0.72rem', fontWeight: 600,
                      }}>
                        {e.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: '#64748b', fontSize: '0.78rem' }}>
                      {e.resource || '-'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', color: '#475569', fontSize: '0.75rem' }}>
                      {e.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            style={{
              padding: '0.4rem 1rem', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: offset === 0 ? '#334155' : '#94a3b8',
              cursor: offset === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
            }}
          >← ก่อนหน้า</button>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            style={{
              padding: '0.4rem 1rem', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: offset + limit >= total ? '#334155' : '#94a3b8',
              cursor: offset + limit >= total ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
            }}
          >ถัดไป →</button>
        </div>
      </main>
    </div>
  );
}
