'use client';

import { useEffect, useState } from 'react';
import { Edit, MoreVertical, Power, Plus, X, Trash2 } from 'lucide-react';
import { MenuContainer, MenuItem } from '@/components/ui/fluid-menu';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useNotifications } from '@/components/ui/notification-provider';
import { PageTitle } from '@/components/ui/page-title';
import { FormError } from '@/components/ui/form-error';
import { apiFetch } from '@/lib/api-client';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<ManagedUser | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { addNotification } = useNotifications();

  async function fetchUsers() {
    setIsLoading(true);
    setError(null);

    try {
      const [usersResponse, meResponse] = await Promise.all([
        apiFetch('/api/users'),
        apiFetch('/api/users?me=true'),
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
    } catch (error: any) {
      setError(error.message || 'Failed to load users');
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
    setIsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFormErrors({});

    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Invalid email address';
    }

    if (!editingUser && !form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password) {
      if (form.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(form.password)) {
        newErrors.password = 'Must contain at least one uppercase letter';
      } else if (!/[0-9]/.test(form.password)) {
        newErrors.password = 'Must contain at least one number';
      }
    }

    if (!form.role) {
      newErrors.role = 'Role is required';
    }

    // Role protection blocks
    if (editingUser && editingUser.id === currentUser?.id && form.role !== 'admin') {
      newErrors.role = 'You cannot demote yourself from Admin';
    }

    // Status protection blocks
    if (editingUser && editingUser.id === currentUser?.id && !form.isActive) {
      newErrors.isActive = 'You cannot deactivate your own account';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setError('Please fix validation errors');
      return;
    }

    // Show confirmation modal for editing
    if (editingUser) {
      setShowEditConfirmModal(true);
    } else {
      // For creating new user, proceed directly
      await confirmSubmit();
    }
  }

  async function confirmSubmit() {
    setIsSaving(true);
    setShowEditConfirmModal(false);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        department: form.department.trim() || undefined,
        isActive: form.isActive,
      };

      const response = await apiFetch(editingUser ? `/api/users?id=${editingUser.id}` : '/api/users', {
        method: editingUser ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser && !form.password ? { ...payload, password: undefined } : payload),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        const servErr = getApiMessage(json, 'Failed to save user');
        setError(servErr);
        // Map common errors back to fields
        if (servErr.toLowerCase().includes('email')) {
          setFormErrors(prev => ({ ...prev, email: servErr }));
        } else if (servErr.toLowerCase().includes('password')) {
          setFormErrors(prev => ({ ...prev, password: servErr }));
        } else if (servErr.toLowerCase().includes('admin') || servErr.toLowerCase().includes('role')) {
          setFormErrors(prev => ({ ...prev, role: servErr }));
        }
        return;
      }

      addNotification({
        title: editingUser ? 'User updated successfully' : 'User created successfully',
        variant: 'success',
      });
      setIsModalOpen(false);
      await fetchUsers();
    } catch (error: any) {
      setError(error.message || 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(user: ManagedUser) {
    setUserToDeactivate(user);
    setShowDeactivateModal(true);
  }

  async function confirmDeactivate() {
    if (!userToDeactivate) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/users?id=${userToDeactivate.id}`, { method: 'DELETE' });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(getApiMessage(json, 'Failed to deactivate user'));
        return;
      }

      addNotification({
        title: 'User deactivated successfully',
        variant: 'success',
      });
      setShowDeactivateModal(false);
      setUserToDeactivate(null);
      await fetchUsers();
    } catch (error: any) {
      setError(error.message || 'Failed to deactivate user');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(user: ManagedUser) {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!userToDelete) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/users?id=${userToDelete.id}&permanent=true`, {
        method: 'DELETE'
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(getApiMessage(json, 'Failed to delete user'));
        return;
      }

      addNotification({
        title: 'User deleted successfully',
        variant: 'success',
      });
      setShowDeleteModal(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (error: any) {
      setError(error.message || 'Failed to delete user');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <PageTitle title="Account Management" />
      <div className="sl-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="sl-page-title">Account Management</h1>
          <p className="sl-page-subtitle">Manage SkyLedger user access</p>
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
                        <MenuItem
                          icon={<Trash2 size={18} strokeWidth={1.5} />}
                          onClick={() => handleDelete(user)}
                          disabled={isSaving || user.id === currentUser?.id}
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
            noValidate
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
                  onChange={(event) => {
                    setForm((value) => ({ ...value, name: event.target.value }));
                    if (formErrors.name) {
                      setFormErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  className={`${accountFieldClassName} ${formErrors.name ? 'border-red-500' : ''}`}
                />
                <FormError message={formErrors.name || ""} />
              </label>

              <label>
                <span className="sl-filter-label">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    setForm((value) => ({ ...value, email: event.target.value }));
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className={`${accountFieldClassName} ${formErrors.email ? 'border-red-500' : ''}`}
                />
                <FormError message={formErrors.email || ""} />
              </label>

              <label>
                <span className="sl-filter-label">{editingUser ? 'New Password' : 'Password'}</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => {
                    setForm((value) => ({ ...value, password: event.target.value }));
                    if (formErrors.password) {
                      setFormErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Min. 8 chars, uppercase, number'}
                  className={`${accountFieldClassName} ${formErrors.password ? 'border-red-500' : ''}`}
                />
                <FormError message={formErrors.password || ""} />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>
                  <span className="sl-filter-label">Role</span>
                  <select
                    value={form.role}
                    onChange={(event) => {
                      setForm((value) => ({ ...value, role: event.target.value as UserRole }));
                      if (formErrors.role) setFormErrors(prev => ({ ...prev, role: '' }));
                    }}
                    className={accountSelectClassName}
                  >
                    <option value="admin">Admin</option>
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <FormError message={formErrors.role || ""} />
                </label>

                <label>
                  <span className="sl-filter-label">Status</span>
                  <select
                    value={form.isActive ? 'active' : 'inactive'}
                    onChange={(event) => {
                      setForm((value) => ({ ...value, isActive: event.target.value === 'active' }));
                      if (formErrors.isActive) setFormErrors(prev => ({ ...prev, isActive: '' }));
                    }}
                    className={accountSelectClassName}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <FormError message={formErrors.isActive || ""} />
                </label>
              </div>

              <label>
                <span className="sl-filter-label">Department</span>
                <input
                  value={form.department}
                  onChange={(event) => {
                    setForm((value) => ({ ...value, department: event.target.value }));
                    if (formErrors.department) setFormErrors(prev => ({ ...prev, department: '' }));
                  }}
                  className={accountFieldClassName}
                />
                <FormError message={formErrors.department || ""} />
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Permanently Delete User"
        description={`Are you sure you want to permanently delete ${userToDelete?.name}? This action cannot be undone and will remove all user data from the system.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="delete"
        isLoading={isSaving}
      />

      {/* Edit Confirmation Modal */}
      <ConfirmationModal
        isOpen={showEditConfirmModal}
        onClose={() => setShowEditConfirmModal(false)}
        onConfirm={confirmSubmit}
        title="Confirm User Update"
        description={`Are you sure you want to update ${editingUser?.name}'s account information?`}
        confirmText="Update User"
        cancelText="Cancel"
        variant="default"
        isLoading={isSaving}
      />

      {/* Deactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setUserToDeactivate(null);
        }}
        onConfirm={confirmDeactivate}
        title="Deactivate User"
        description={`Are you sure you want to deactivate ${userToDeactivate?.name}? The user will no longer be able to access the system.`}
        confirmText="Deactivate User"
        cancelText="Cancel"
        variant="deactivate"
        isLoading={isSaving}
      />
    </div>
  );
}
