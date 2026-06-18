'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProjectDef } from '@/lib/projects';

interface ProjectAccess {
  projectId: string;
  role: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  portalRole: string;
  isActive: boolean;
  lastLogin: string | null;
  projectAccess: ProjectAccess[];
}

const PORTAL_ROLES = ['USER', 'PORTAL_ADMIN', 'SUPER_ADMIN'];
const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Props {
  currentUserId: string;
  projects: ProjectDef[];
}

export default function AdminUsersClient({ currentUserId, projects }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    portalRole: 'USER',
    avatarColor: '#6366f1',
    isActive: true,
    projectAccess: [] as ProjectAccess[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function openCreate() {
    setEditUser(null);
    setForm({ email: '', name: '', password: '', portalRole: 'USER', avatarColor: '#6366f1', isActive: true, projectAccess: [] });
    setError('');
    setShowModal(true);
  }

  function openEdit(u: UserRow) {
    setEditUser(u);
    setForm({
      email: u.email,
      name: u.name,
      password: '',
      portalRole: u.portalRole,
      avatarColor: u.avatarColor,
      isActive: u.isActive,
      projectAccess: u.projectAccess,
    });
    setError('');
    setShowModal(true);
  }

  function setProjectRole(projectId: string, role: string) {
    setForm((prev) => {
      const existing = prev.projectAccess.find((a) => a.projectId === projectId);
      if (!role) {
        return { ...prev, projectAccess: prev.projectAccess.filter((a) => a.projectId !== projectId) };
      }
      if (existing) {
        return { ...prev, projectAccess: prev.projectAccess.map((a) => a.projectId === projectId ? { ...a, role } : a) };
      }
      return { ...prev, projectAccess: [...prev.projectAccess, { projectId, role }] };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        name: form.name,
        portalRole: form.portalRole,
        avatarColor: form.avatarColor,
        isActive: form.isActive,
        projectAccess: form.projectAccess,
      };

      if (!editUser) {
        body.email = form.email;
        body.password = form.password;
      } else if (form.password) {
        body.password = form.password;
      }

      const url = editUser ? `/api/admin/users/${editUser.id}` : '/api/admin/users';
      const method = editUser ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); return; }

      setShowModal(false);
      loadUsers();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ต้องการลบผู้ใช้ "${name}" ใช่หรือไม่?`)) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    loadUsers();
  }

  async function toggleActive(u: UserRow) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    loadUsers();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      {/* Header */}
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
            <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.85rem' }}>← Portal</a>
            <span style={{ color: '#334155' }}>/</span>
            <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>จัดการผู้ใช้</span>
          </div>
          <button
            onClick={openCreate}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + เพิ่มผู้ใช้
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>กำลังโหลด...</div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['ผู้ใช้', 'Portal Role', 'โปรเจกค์', 'เข้าสู่ระบบล่าสุด', 'สถานะ', ''].map((h) => (
                    <th key={h} style={{
                      padding: '0.85rem 1rem',
                      textAlign: 'left',
                      color: '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: u.avatarColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                        }}>
                          {u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '0.875rem' }}>{u.name}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '6px',
                        background: 'rgba(99,102,241,0.15)',
                        color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        {u.portalRole}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {u.projectAccess.map((a) => (
                          <span key={a.projectId} style={{
                            padding: '0.15rem 0.5rem', borderRadius: '4px',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#94a3b8', fontSize: '0.7rem',
                          }}>
                            {a.projectId.replace(/_/g, ' ')} · {a.role}
                          </span>
                        ))}
                        {u.projectAccess.length === 0 && (
                          <span style={{ color: '#475569', fontSize: '0.75rem' }}>ไม่มีโปรเจกค์</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('th-TH', {
                        day: 'numeric', month: 'short', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      }) : 'ยังไม่เคย'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button
                        onClick={() => toggleActive(u)}
                        style={{
                          padding: '0.2rem 0.65rem', borderRadius: '6px',
                          border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                          background: u.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: u.isActive ? '#34d399' : '#f87171',
                        }}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEdit(u)} style={{
                          padding: '0.3rem 0.75rem', borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'transparent', color: '#94a3b8',
                          fontSize: '0.75rem', cursor: 'pointer',
                        }}>
                          แก้ไข
                        </button>
                        {u.id !== currentUserId && (
                          <button onClick={() => handleDelete(u.id, u.name)} style={{
                            padding: '0.3rem 0.75rem', borderRadius: '6px',
                            border: '1px solid rgba(239,68,68,0.2)',
                            background: 'transparent', color: '#f87171',
                            fontSize: '0.75rem', cursor: 'pointer',
                          }}>
                            ลบ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: '560px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              {editUser ? `แก้ไข: ${editUser.name}` : 'เพิ่มผู้ใช้ใหม่'}
            </h2>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '1rem',
                color: '#fca5a5', fontSize: '0.85rem',
              }}>{error}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!editUser && (
                <Field label="อีเมล">
                  <input type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="user@ww.co.th" style={inputStyle} />
                </Field>
              )}

              <Field label="ชื่อ-นามสกุล">
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ชื่อ นามสกุล" style={inputStyle} />
              </Field>

              <Field label={editUser ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'}>
                <input type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" style={inputStyle} />
              </Field>

              <Field label="Portal Role">
                <select value={form.portalRole}
                  onChange={(e) => setForm({ ...form, portalRole: e.target.value })}
                  style={inputStyle}>
                  {PORTAL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              <Field label="Avatar Color">
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {AVATAR_COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, avatarColor: c })}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: c, border: form.avatarColor === c ? '3px solid #fff' : '3px solid transparent',
                        cursor: 'pointer',
                      }} />
                  ))}
                </div>
              </Field>

              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.75rem' }}>
                  สิทธิ์โปรเจกค์
                </div>
                {projects.map((project) => {
                  const access = form.projectAccess.find((a) => a.projectId === project.id);
                  return (
                    <div key={project.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)', marginBottom: '0.4rem',
                    }}>
                      <span style={{ color: '#f1f5f9', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{project.icon}</span> {project.name}
                      </span>
                      <select
                        value={access?.role ?? ''}
                        onChange={(e) => setProjectRole(project.id, e.target.value)}
                        style={{
                          background: '#0f172a', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.8rem',
                        }}
                      >
                        <option value="">ไม่มีสิทธิ์</option>
                        {project.roles.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>

              {editUser && (
                <Field label="สถานะ">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      style={{ accentColor: '#6366f1', width: '16px', height: '16px' }} />
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Active</span>
                  </label>
                </Field>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: '0.6rem 1.25rem', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem',
              }}>ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.06)',
  color: '#f1f5f9',
  fontSize: '0.875rem',
  outline: 'none',
};
