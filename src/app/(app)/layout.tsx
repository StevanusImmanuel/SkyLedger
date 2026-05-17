import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import { PageTransition } from '@/components/ui/PageTransition';
import '@/app/dashboard.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sl-app">
      <Sidebar />
      <div className="sl-main">
        <Topbar />
        <main className="sl-content">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        {/* Status Bar */}
        <footer className="sl-statusbar">
          <span className="sl-status-timestamp">DATA TIMESTAMP: 2023-10-24 14:30:00 UTC</span>
          <div className="sl-status-indicators">
            <span className="sl-indicator live">● LIVE PROCESSING</span>
            <span className="sl-indicator synced">● DATABASE SYNCED</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
