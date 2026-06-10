'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/ui/page-title';
import { apiFetch } from '@/lib/api-client';

type UserRole = 'admin' | 'operator' | 'viewer';

type CurrentUser = {
  id: string;
  skyledgerId?: string | null;
  name?: string | null;
  email?: string | null;
  role?: UserRole | null;
  department?: string | null;
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  viewer: 'Viewer',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CU';
}

function formatRole(role?: UserRole | null) {
  if (!role) return 'Not assigned';
  return ROLE_LABELS[role] || role;
}

function SettingsSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div className="skeleton" style={{ width: 150, height: 10, borderRadius: 4, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 260, height: 32, borderRadius: 6 }} />
      </div>
      <div className="sl-settings-grid">
        <div className="sl-settings-card">
          <div className="sl-settings-section-title">
            <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 18, height: 18, borderRadius: 6 }} />
          </div>
          <div className="sl-profile-area">
            <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 12, flexShrink: 0 }} />
            <div className="sl-profile-fields">
              <div className="skeleton" style={{ width: '100%', height: 38, borderRadius: 7 }} />
              <div className="sl-fields-row">
                <div className="skeleton" style={{ height: 38, borderRadius: 7 }} />
                <div className="skeleton" style={{ height: 38, borderRadius: 7 }} />
              </div>
            </div>
          </div>
          <div className="skeleton" style={{ width: '70%', height: 38, borderRadius: 7 }} />
        </div>
        <div className="sl-settings-card">
          <div className="sl-settings-section-title">
            <div className="skeleton" style={{ width: 180, height: 14, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 18, height: 18, borderRadius: 6 }} />
          </div>
          <div className="skeleton" style={{ width: '100%', height: 74, borderRadius: 10, marginBottom: 18 }} />
          <div className="skeleton" style={{ width: '100%', height: 64, borderRadius: 10, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: '100%', height: 64, borderRadius: 10 }} />
        </div>
      </div>
      <div className="sl-settings-workspace">
        <div className="sl-settings-workspace-header">
          <div>
            <div className="skeleton" style={{ width: 150, height: 18, borderRadius: 4, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 'min(520px, 100%)', height: 12, borderRadius: 4 }} />
          </div>
        </div>
        <div className="sl-settings-workspace-grid">
          <div className="sl-settings-mini-card">
            <div className="skeleton" style={{ width: 130, height: 14, borderRadius: 4, marginBottom: 16 }} />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="sl-settings-summary-row">
                <div className="skeleton" style={{ width: 95, height: 11, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 110, height: 12, borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div className="sl-settings-mini-card">
            <div className="skeleton" style={{ width: 150, height: 14, borderRadius: 4, marginBottom: 16 }} />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="sl-settings-summary-row">
                <div className="skeleton" style={{ width: 105, height: 11, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 130, height: 12, borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div className="sl-settings-mini-card">
            <div className="skeleton" style={{ width: 180, height: 16, borderRadius: 4, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 6, marginBottom: 18 }} />
            <div className="skeleton" style={{ width: 96, height: 34, borderRadius: 8 }} />
          </div>
        </div>
      </div>
      <div className="sl-settings-workspace">
        <div className="sl-settings-workspace-header">
          <div>
            <div className="skeleton" style={{ width: 160, height: 18, borderRadius: 4, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 'min(560px, 100%)', height: 12, borderRadius: 4 }} />
          </div>
        </div>
        <div className="sl-settings-workspace-grid">
          {Array.from({ length: 3 }).map((_, cardIndex) => (
            <div key={cardIndex} className="sl-settings-mini-card">
              <div className="skeleton" style={{ width: 150, height: 14, borderRadius: 4, marginBottom: 16 }} />
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <div key={rowIndex} className="sl-settings-summary-row">
                  <div className="skeleton" style={{ width: 100, height: 11, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: 120, height: 12, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchCurrentUser() {
      setIsLoading(true);
      setError('');

      try {
        const response = await apiFetch('/api/users?me=true');
        const json = await response.json();

        if (!isMounted) return;

        if (!response.ok || !json.success) {
          setUser(null);
          setError('Unable to load account details right now. Fallback values are shown below.');
          return;
        }

        setUser(json.data);
      } catch (err: unknown) {
        if (!isMounted) return;
        void err;
        setUser(null);
        setError('Unable to load account details right now. Fallback values are shown below.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const profile = useMemo(() => {
    const fullName = user?.name?.trim() || 'Current User';
    return {
      fullName,
      initials: getInitials(fullName),
      role: formatRole(user?.role),
      employeeId: user?.skyledgerId?.trim() || 'Not assigned',
      email: user?.email?.trim() || 'Not available',
      department: user?.department?.trim() || 'Not assigned',
    };
  }, [user]);
  const permissionMode = user?.role === 'admin' ? 'Full operational access' : 'Limited operational access';

  return (
    <div>
      <PageTitle title="Settings" />

      <div className="sl-settings-page-header">
        <div>
          <div className="sl-settings-kicker">System Administration</div>
          <h1 className="sl-page-title" style={{ marginBottom: 0 }}>Account Settings</h1>
          <p className="sl-page-subtitle" style={{ marginTop: 4 }}>
            Session-linked operator profile and security preferences.
          </p>
        </div>
        <div className="sl-settings-readonly-badge">Read-only session profile</div>
      </div>

      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <>
          {error && (
            <div className="sl-settings-alert" role="status">
              {error}
            </div>
          )}

          <div className="sl-settings-grid">
            <div className="sl-settings-card">
              <div className="sl-settings-section-title">
                <span>User Profile</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>

              <div className="sl-profile-area">
                <div className="sl-profile-avatar" aria-hidden="true">
                  <span>{profile.initials}</span>
                </div>

                <div className="sl-profile-fields">
                  <div>
                    <label className="sl-field-label">Full Name</label>
                    <input className="sl-field-input" value={profile.fullName} readOnly />
                  </div>
                  <div className="sl-fields-row">
                    <div>
                      <label className="sl-field-label">Role</label>
                      <input className="sl-field-input" value={profile.role} readOnly />
                    </div>
                    <div>
                      <label className="sl-field-label">Employee ID</label>
                      <input className="sl-field-input" value={profile.employeeId} readOnly />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sl-fields-row">
                <div>
                  <label className="sl-field-label">Email Address</label>
                  <input className="sl-field-input" value={profile.email} type="email" readOnly />
                </div>
                <div>
                  <label className="sl-field-label">Department</label>
                  <input className="sl-field-input" value={profile.department} readOnly />
                </div>
              </div>
            </div>

            <div className="sl-settings-card">
              <div className="sl-settings-section-title">
                <span>Security &amp; Authentication</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>

              <div className="sl-tfa-row">
                <div className="sl-tfa-info">
                  <div className="sl-tfa-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/></svg>
                  </div>
                  <div>
                    <div className="sl-tfa-label">Authentication Status</div>
                    <div className="sl-tfa-desc">Profile data is loaded from the active SkyLedger session.</div>
                  </div>
                </div>
                <span className="sl-session-chip">Active</span>
              </div>

              <div className="sl-sessions-title">Security Notes</div>
              <div className="sl-session-item">
                <div className="sl-session-info">
                  <svg className="sl-session-device-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <div>
                    <div className="sl-session-name">Password Policy</div>
                    <div className="sl-session-sub">Minimum 8 characters with uppercase letter and number.</div>
                  </div>
                </div>
              </div>
              <div className="sl-session-item">
                <div className="sl-session-info">
                  <svg className="sl-session-device-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  <div>
                    <div className="sl-session-name">Session Management</div>
                    <div className="sl-session-sub">Protected by the active terminal session cookie.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="sl-settings-workspace">
            <div className="sl-settings-workspace-header">
              <div>
                <h2>Account Workspace</h2>
                <p>Operational preferences and support shortcuts for the active SkyLedger account.</p>
              </div>
            </div>

            <div className="sl-settings-workspace-grid">
              <div className="sl-settings-mini-card">
                <div className="sl-settings-mini-title">Account Summary</div>
                <div className="sl-settings-summary-row">
                  <span>Account Status</span>
                  <strong>Active</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Role Access</span>
                  <strong>{profile.role}</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Employee ID</span>
                  <strong>{profile.employeeId}</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Department</span>
                  <strong>{profile.department}</strong>
                </div>
              </div>

              <div className="sl-settings-mini-card">
                <div className="sl-settings-mini-title">System Preferences</div>
                <div className="sl-settings-summary-row">
                  <span>Interface Mode</span>
                  <strong>SkyLedger Default</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Notifications</span>
                  <strong>System alerts enabled</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Data Access</span>
                  <strong>Role-based permissions</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Workspace</span>
                  <strong>Operator Console</strong>
                </div>
              </div>

              <div className="sl-settings-mini-card sl-settings-help-card">
                <div>
                  <div className="sl-settings-mini-title">Need help using SkyLedger?</div>
                  <p>
                    Find guidance about AWB tracking, shipment statuses, account access, dashboard usage, logs, and reports.
                  </p>
                </div>
                <Link href="/faq" className="sl-settings-help-link">
                  Open FAQ
                </Link>
              </div>
            </div>
          </section>

          <section className="sl-settings-workspace">
            <div className="sl-settings-workspace-header">
              <div>
                <h2>Operational Control</h2>
                <p>Role-based access, alert preferences, and session visibility for airport cargo operations.</p>
              </div>
            </div>

            <div className="sl-settings-workspace-grid">
              <div className="sl-settings-mini-card">
                <div className="sl-settings-mini-title">Access Scope</div>
                <div className="sl-settings-summary-row">
                  <span>Current Role</span>
                  <strong>{profile.role}</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Module Access</span>
                  <strong>Dashboard, Shipments, Reports</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Data Visibility</span>
                  <strong>Role-based shipment records</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Permission Mode</span>
                  <strong>{permissionMode}</strong>
                </div>
              </div>

              <div className="sl-settings-mini-card">
                <div className="sl-settings-mini-title">Notification Preferences</div>
                <div className="sl-settings-summary-row">
                  <span>Shipment Updates</span>
                  <strong>Enabled</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Dashboard Alerts</span>
                  <strong>Enabled</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Security Notices</span>
                  <strong>Enabled</strong>
                </div>
                <div className="sl-settings-summary-row">
                  <span>Report Reminders</span>
                  <strong>Weekly summary</strong>
                </div>
              </div>

              <div className="sl-settings-mini-card sl-settings-help-card">
                <div>
                  <div className="sl-settings-mini-title">Session &amp; Audit</div>
                  <div className="sl-settings-summary-row">
                    <span>Session Status</span>
                    <strong>Active</strong>
                  </div>
                  <div className="sl-settings-summary-row">
                    <span>Last Synced</span>
                    <strong>Recently synced</strong>
                  </div>
                  <div className="sl-settings-summary-row">
                    <span>Audit Logging</span>
                    <strong>Enabled</strong>
                  </div>
                  <div className="sl-settings-summary-row">
                    <span>Support Channel</span>
                    <strong>FAQ Center</strong>
                  </div>
                </div>
                <div className="sl-settings-action-row">
                  <Link href="/activity-logs" className="sl-settings-help-link">
                    Open Activity Logs
                  </Link>
                  <Link href="/faq" className="sl-settings-help-link secondary">
                    Open FAQ
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
