import { ClientSidebar } from '@/components/ui/ClientSidebar';
import { PageTransition } from '@/components/ui/PageTransition';
import '@/app/dashboard.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sl-app" suppressHydrationWarning>
      <ClientSidebar />
      <div
        className="sl-main"
        style={{
          marginLeft: 'var(--sl-sidebar-width, 3.5rem)',
          transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        suppressHydrationWarning
      >
        <main className="sl-content" suppressHydrationWarning>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        {/* Status Bar */}
        <footer className="sl-statusbar">
          <span className="sl-status-timestamp">DATA TIMESTAMP: 2026-05-19 15:18:00 UTC</span>
          <div className="sl-status-indicators">
            <span className="sl-indicator live">● LIVE PROCESSING</span>
            <span className="sl-indicator synced">● DATABASE SYNCED</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
