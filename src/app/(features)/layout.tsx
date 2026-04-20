import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import LiveTimestamp from '@/components/dashboard/livestamp'; // Use the client component
import '@/app/dashboard.css';

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sl-app flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      
      {/* sl-main needs flex-1 to grow/shrink with the sidebar */}
      <div className="sl-main flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Topbar />
        
        <main className="sl-content flex-1 p-6 overflow-y-auto">
          {children}
        </main>
        
        <footer className="sl-statusbar bg-white border-t border-slate-200 p-2 px-4 flex justify-between items-center">
          <LiveTimestamp /> {/* Fixed: Use the client component here to prevent errors */}
          
          <div className="sl-status-indicators flex gap-4">
            <span className="sl-indicator live text-[10px] font-bold text-emerald-500">
              <span className="animate-pulse">●</span> LIVE OPERATIONS
            </span>
            <span className="sl-indicator synced text-[10px] font-bold text-blue-500">
              ● DB SYNCED
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}