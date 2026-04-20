'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/reports', label: 'Reports' },
];

export default function Topbar() {
  const pathname = usePathname();

  return (
    <header className="sl-topbar">
      {/* Nav Links */}
      <nav className="sl-topbar-nav">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sl-topbar-link ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Search */}
      <div className="sl-topbar-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="Search analytics..." className="sl-search-input" />
      </div>

      {/* Right Actions */}
      <div className="sl-topbar-actions">
        {/* Bell */}
        <button className="sl-icon-btn" aria-label="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        {/* Help */}
        <button className="sl-icon-btn" aria-label="Help">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        {/* User */}
        <div className="sl-user-profile">
          <div className="sl-user-info">
            <span className="sl-user-name">Alex Rivera</span>
            <span className="sl-user-role">LOGISTICS OPS</span>
          </div>
          <div className="sl-avatar">
            <span>AR</span>
          </div>
        </div>
      </div>
    </header>
  );
}
