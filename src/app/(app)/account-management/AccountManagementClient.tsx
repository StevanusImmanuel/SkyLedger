'use client';

import { useEffect, useState } from 'react';
import { Edit, MoreVertical, Power, Plus, X } from 'lucide-react';
import { MenuContainer, MenuItem } from '@/components/ui/fluid-menu';

type UserRole = 'admin' | 'operator' | 'viewer';

type ManagedUser = {
  id: string;
  skyledgerId: string;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  isActive: boolean;
  createdAt: string;
};

type CurrentUser = {
  id: string;
  role: UserRole;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'operator',
  department: '',
  isActive: true,
};

const accountFieldClassName = 'w-full mt-[5px] rounded-lg border border-[#cbd5e1] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#0f172a] placeholder:text-[#64748b] outline-none transition-colors focus:border-[#1a2d5a] focus:ring-2 focus:ring-[#1a2d5a]/10';
const accountSelectClassName = 'w-full mt-[5px] rounded-lg border border-[#cbd5e1] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#0f172a] outline-none transition-colors focus:border-[#1a2d5a] focus:ring-2 focus:ring-[#1a2d5a]/10';

function getRoleClass(role: UserRole) {
  if (role === 'admin') return 'sl-badge-critical';
  if (role === 'operator') return 'sl-badge-intransit';
  return 'sl-badge-manifested';
}

function getApiMessage(json: { error?: string }, fallback: string) {
  return json.error || fallback;
}

export default function AccountManagementClient() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchUsers() {
    setIsLoading(true);
    setError(null);

    try {
      const [usersResponse, meResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/users?me=true'),
      ]);
      const usersJson = await usersResponse.json();
      const meJson = await meResponse.json();

      if (!usersResponse.ok || !usersJson.success) {
        setError(getApiMessage(usersJson, 'Failed to load users'));
        return;
      }

      if (meResponse.ok && meJson.success) {
        setCurrentUser({ id: meJson.data.id, role: meJson.data.role });
      }

      setUsers(usersJson.data);
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setError(null);
    setMessage(null);
    setIsModalOpen(true);
  }

  function openEditModal(user: ManagedUser) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || '',
      isActive: user.isActive,
    });
    setError(null);
    setMessage(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    if (!form.email.trim()) {
      setError('Email is required');
      setIsSaving(false);
      return;
    }

    if (!editingUser && !form.password) {
      setError('Password is required');
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        department: form.department.trim() || undefined,
        isActive: form.isActive,
      };

      const response = await fetch(editingUser ? `/api/users?id=${editingUser.id}` : '/api/users', {
        method: editingUser ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser && !form.password ? { ...payload, password: undefined } : payload),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(getApiMessage(json, 'Failed to save user'));
        return;
      }

      setMessage(editingUser ? 'User updated successfully' : 'User created successfully');
      setIsModalOpen(false);
      await fetchUsers();
    } catch {
      setError('Failed to save user');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(user: ManagedUser) {
    if (!confirm(`Deactivate ${user.name}?`)) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/users?id=${user.id}`, { method: 'DELETE' });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(getApiMessage(json, 'Failed to deactivate user'));
        return;
      }

      setMessage('User deactivated successfully');
      await fetchUsers();
    } catch {
      setError('Failed to deactivate user');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="sl-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="sl-page-title">Manajemen Akun</h1>
          <p className="sl-page-subtitle">Kelola akses pengguna SkyLedger</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: '#1a2d5a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 16px',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          <Plus size={15} strokeWidth={2.4} />
          New User
        </button>
      </div>

      {(message || error) && (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: 8,
            border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`,
            background: error ? '#fff5f5' : '#f0fdf4',
            color: error ? '#b91c1c' : '#15803d',
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          {error || message}
        </div>
      )}

      <div className="sl-reports-stats">
        <div className="sl-rstat-card">
          <div className="sl-rstat-label">Total Users</div>
          <div className="sl-rstat-value-row">
            <span className="sl-rstat-value">{users.length}</span>
          </div>
        </div>
        <div className="sl-rstat-card">
          <div className="sl-rstat-label">Active</div>
          <div className="sl-rstat-value-row">
            <span className="sl-rstat-value">{users.filter((user) => user.isActive).length}</span>
          </div>
        </div>
        <div className="sl-rstat-card">
          <div className="sl-rstat-label">Admins</div>
          <div className="sl-rstat-value-row">
            <span className="sl-rstat-value">{users.filter((user) => user.role === 'admin').length}</span>
          </div>
        </div>
        <div className="sl-rstat-card">
          <div className="sl-rstat-label">Operators</div>
          <div className="sl-rstat-value-row">
            <span className="sl-rstat-value">{users.filter((user) => user.role === 'operator').length}</span>
          </div>
        </div>
      </div>

      <div className="sl-awb-table-container">
        {isLoading ? (
          <div style={{ padding: 24, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
            Loading users...
          </div>
        ) : error && users.length === 0 ? (
          <div style={{ padding: 24, color: '#b91c1c', fontSize: 13, fontWeight: 700 }}>
            {error}
          </div>
        ) : (
          <table className="sl-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>SkyLedger ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ paddingLeft: 20 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#1a2d5a' }}>
                      {user.skyledgerId}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                      {user.name}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                      {user.email}
                    </span>
                  </td>
                  <td>
                    <span className={`sl-status-badge ${getRoleClass(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                      {user.department || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`sl-status-badge ${user.isActive ? 'sl-badge-ontime' : 'sl-badge-delayed'}`}>
                      {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 11.5, color: '#64748b' }}>
                      {new Date(user.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <MenuContainer>
                        <MenuItem
                          icon={<MoreVertical size={18} strokeWidth={1.5} />}
                        />
                        <MenuItem
                          icon={<Edit size={18} strokeWidth={1.5} />}
                          onClick={() => openEditModal(user)}
                          disabled={isSaving}
                        />
                        <MenuItem
                          icon={<Power size={18} strokeWidth={1.5} />}
                          onClick={() => handleDeactivate(user)}
                          disabled={isSaving || !user.isActive || user.id === currentUser?.id}
                        />
                      </MenuContainer>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div
          role="presentation"
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(15, 23, 42, 0.38)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <form
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-form-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(560px, 100%)',
              background: '#fff',
              border: '1px solid #e8edf4',
              borderRadius: 14,
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.24)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                borderBottom: '1px solid #f0f4f8',
              }}
            >
              <div>
                <h2 id="account-form-title" style={{ margin: 0, fontSize: 20, color: '#1a2d5a', fontWeight: 800 }}>
                  {editingUser ? 'Edit User' : 'Create User'}
                </h2>
                <div style={{ marginTop: 3, fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Admin account management
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close account form"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#f8fafc',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <X size={17} strokeWidth={2.2} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 14, padding: 20 }}>
              <label>
                <span className="sl-filter-label">Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                  required
                  minLength={2}
                  className={accountFieldClassName}
                />
              </label>

              <label>
                <span className="sl-filter-label">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
                  required
                  className={accountFieldClassName}
                />
              </label>

              <label>
                <span className="sl-filter-label">{editingUser ? 'New Password' : 'Password'}</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Min. 8 chars, uppercase, number'}
                  className={accountFieldClassName}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>
                  <span className="sl-filter-label">Role</span>
                  <select
                    value={form.role}
                    onChange={(event) => setForm((value) => ({ ...value, role: event.target.value as UserRole }))}
                    className={accountSelectClassName}
                  >
                    <option value="admin">Admin</option>
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </label>

                <label>
                  <span className="sl-filter-label">Status</span>
                  <select
                    value={form.isActive ? 'active' : 'inactive'}
                    onChange={(event) => setForm((value) => ({ ...value, isActive: event.target.value === 'active' }))}
                    className={accountSelectClassName}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <label>
                <span className="sl-filter-label">Department</span>
                <input
                  value={form.department}
                  onChange={(event) => setForm((value) => ({ ...value, department: event.target.value }))}
                  className={accountFieldClassName}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 20px 20px' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="sl-btn-export-pdf"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="sl-btn-export-csv"
              >
                {isSaving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
