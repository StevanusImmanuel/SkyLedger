'use client';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') || 'light') as 'light' | 'dark';
    setTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
          System Administration
        </div>
        <h1 className="sl-page-title" style={{ marginBottom: 0 }}>Account Settings</h1>
      </div>

      {/* Header Actions */}
      <div className="sl-settings-header-actions">
        <button className="sl-btn-cancel">Cancel</button>
        <button className="sl-btn-save">Save Changes</button>
      </div>

      <div className="sl-settings-grid">
        {/* Left Column */}
        <div>
          {/* User Profile */}
          <div className="sl-settings-card">
            <div className="sl-settings-section-title">
              <span>User Profile</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>

            <div className="sl-profile-area">
              {/* Avatar */}
              <div className="sl-profile-avatar">
                <span style={{ fontSize: 28 }}>👤</span>
                <div className="sl-avatar-edit">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
              </div>

              {/* Fields */}
              <div className="sl-profile-fields">
                <div>
                  <label className="sl-field-label">Full Name</label>
                  <input className="sl-field-input" defaultValue="Alexander Sterling" />
                </div>
                <div className="sl-fields-row">
                  <div>
                    <label className="sl-field-label">Role</label>
                    <input className="sl-field-input" defaultValue="Operator" />
                  </div>
                  <div>
                    <label className="sl-field-label">Employee ID</label>
                    <input className="sl-field-input" defaultValue="CL-98429-PX" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="sl-field-label">Email Address</label>
              <input className="sl-field-input" defaultValue="a.sterling@skyledger.com" type="email" style={{ maxWidth: 360 }} />
            </div>
          </div>

          {/* Security & Authentication */}
          <div className="sl-settings-card">
            <div className="sl-settings-section-title">
              <span>Security &amp; Authentication</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>

            {/* 2FA */}
            <div className="sl-tfa-row">
              <div className="sl-tfa-info">
                <div className="sl-tfa-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/></svg>
                </div>
                <div>
                  <div className="sl-tfa-label">Two-Factor Authentication</div>
                  <div className="sl-tfa-desc">Add an extra layer of security to your account.</div>
                </div>
              </div>
              <button className="sl-toggle" aria-label="Toggle 2FA" />
            </div>

            {/* Active Sessions */}
            <div className="sl-sessions-title">Active Sessions</div>
            <div className="sl-session-item">
              <div className="sl-session-info">
                <svg className="sl-session-device-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <div>
                  <div className="sl-session-name">London, UK • Chrome on macOS</div>
                  <div className="sl-session-sub">Current Session</div>
                </div>
              </div>
              <button className="sl-terminate-btn">Terminate</button>
            </div>
            <div className="sl-session-item">
              <div className="sl-session-info">
                <svg className="sl-session-device-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                <div>
                  <div className="sl-session-name">Berlin, DE • SkyLedger Mobile (iOS)</div>
                  <div className="sl-session-sub inactive">Last active: 2 hours ago</div>
                </div>
              </div>
              <button className="sl-terminate-btn">Terminate</button>
            </div>
          </div>
        </div>

        {/* Right Column - Preferences */}
        <div>
          <div className="sl-settings-card">
            <div className="sl-settings-section-title">
              <span>Preferences</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
            </div>

            {/* Interface Theme */}
            <label className="sl-pref-label">Interface Theme</label>
            <div className="sl-theme-options">
              <button
                onClick={() => handleThemeChange('light')}
                className="sl-theme-option"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div className={`sl-theme-preview sl-theme-light ${theme === 'light' ? 'selected' : ''}`}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f0f4f8 40%, #dbeafe 100%)' }} />
                </div>
                <span className="sl-theme-label" style={{ color: theme === 'light' ? '#1a2d5a' : '#94a3b8', fontWeight: theme === 'light' ? 700 : 600 }}>Light Blue</span>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className="sl-theme-option"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div className={`sl-theme-preview sl-theme-dark ${theme === 'dark' ? 'selected' : ''}`}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b 40%, #0f172a 100%)' }} />
                </div>
                <span className="sl-theme-label" style={{ color: theme === 'dark' ? '#1a2d5a' : '#94a3b8', fontWeight: theme === 'dark' ? 700 : 600 }}>Deep Navy</span>
              </button>
            </div>

            {/* Notifications */}
            <label className="sl-pref-label" style={{ marginTop: 16, display: 'block' }}>Notifications</label>
            <div className="sl-notif-row">
              <span className="sl-notif-label">Email Alerts</span>
              <input type="checkbox" className="sl-checkbox" defaultChecked />
            </div>
            <div className="sl-notif-row">
              <span className="sl-notif-label">SMS Critical Updates</span>
              <input type="checkbox" className="sl-checkbox" />
            </div>

            {/* Timezone */}
            <label className="sl-pref-label" style={{ marginTop: 16, display: 'block' }}>Timezone</label>
            <select className="sl-tz-select">
              <option>(GMT+00:00) London, Lisbon, Casablanca</option>
              <option>(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
              <option>(GMT-05:00) New York, Toronto</option>
              <option>(GMT+08:00) Singapore, Kuala Lumpur</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
