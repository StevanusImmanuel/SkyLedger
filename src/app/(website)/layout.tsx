import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Shared Sidebar Component */}
      <Sidebar />
      
      {/* Main Content Area: Offset by 80px (collapsed sidebar width) */}
      <main className="flex-1 ml-20 bg-slate-50 min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}