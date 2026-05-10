'use client';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  email: string;
}

export default function Topbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users?me=true');
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'ADMINISTRATOR',
      operator: 'OPERATOR',
      viewer: 'VIEWER',
    };
    return roleMap[role] || role.toUpperCase();
  };

  return (
    <header className="sl-topbar">
      {/* Search */}
      <div className="sl-topbar-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="Search shipments, routes..." className="sl-search-input" />
      </div>

      {/* Right Actions */}
      <div className="sl-topbar-actions">
        {/* Notification Bell */}
        <button className="sl-icon-btn" aria-label="Notifications" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Support/Help */}
        <button className="sl-icon-btn" aria-label="Support" title="Support">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        {/* User Profile */}
        {!loading && user ? (
          <div className="sl-user-profile">
            <div className="sl-user-info">
              <span className="sl-user-name">{user.name}</span>
              <span className="sl-user-role">{getRoleDisplay(user.role)}</span>
            </div>
            <div className="sl-avatar">
              <span>{getInitials(user.name)}</span>
            </div>
          </div>
        ) : (
          <div className="sl-user-profile">
            <div className="sl-user-info">
              <span className="sl-user-name">Loading...</span>
              <span className="sl-user-role">--</span>
            </div>
            <div className="sl-avatar">
              <span>--</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
