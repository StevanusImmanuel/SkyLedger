'use client';

import dynamic from 'next/dynamic';
import Dashboardview from '@/components/dashboard/Dashboardview';

// Safe to use ssr: false here because we are inside a 'use client' file
const CapacityTrendChart = dynamic(
  () => import('@/components/dashboard/dashboardcharts').then(mod => mod.CapacityTrendChart),
  { ssr: false }
);

const SLADonutChart = dynamic(
  () => import('@/components/dashboard/dashboardcharts').then(mod => mod.SLADonutChart),
  { ssr: false }
);

const LiveTimestamp = dynamic(
  () => import('@/components/dashboard/livestamp'),
  { ssr: false }
);

export default function DashboardClientContent() {
  return (
    <>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2d5a]">Operations Analytics</h1>
          <p className="text-sm text-slate-500">Global Hub A-42 Real-time Metrics</p>
        </div>
        <div className="text-right">
          <LiveTimestamp />
          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-bold text-emerald-500">
            <span className="animate-pulse">●</span> LIVE SYSTEM PROCESSING
          </div>
        </div>
      </div>

      {/* Filter Bar with Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <button className="px-4 py-1.5 text-[11px] font-bold bg-[#1a2d5a] text-white">WEEK</button>
          <button className="px-4 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50">MONTH</button>
          <button className="px-4 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50">YEAR</button>
        </div>

        {/* Terminal Dropdown */}
        <div className="relative bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-1.5">
          <label htmlFor="terminal-select" className="text-[11px] font-semibold text-slate-500 mr-1">Terminal:</label>
          <select 
            id="terminal-select"
            className="text-[11px] font-bold text-[#1a2d5a] bg-transparent outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="all">All</option>
            <option value="t1">Terminal 1</option>
            <option value="t2">Terminal 2</option>
            <option value="cargo">Cargo West</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#1a2d5a]">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>

        {/* Flight Type Dropdown */}
        <div className="relative bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-1.5">
          <label htmlFor="flight-type-select" className="text-[11px] font-semibold text-slate-500 mr-1">Flight Type:</label>
          <select 
            id="flight-type-select"
            className="text-[11px] font-bold text-[#1a2d5a] bg-transparent outline-none cursor-pointer appearance-none pr-4"
          >
            <option value="heavy">Heavy</option>
            <option value="medium">Medium</option>
            <option value="light">Light</option>
            <option value="emergency">Emergency</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#1a2d5a]">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          <button className="px-3 py-1.5 border border-slate-200 rounded text-[11px] font-bold bg-white text-slate-400 hover:bg-slate-50">CSV</button>
          <button className="px-3 py-1.5 bg-[#1a2d5a] text-white rounded text-[11px] font-bold hover:opacity-90">PDF Report</button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8 min-h-[350px]">
          <CapacityTrendChart />
        </div>
        <div className="lg:col-span-4 min-h-[350px]">
          <SLADonutChart />
        </div>
      </div>

      {/* Tables Section */}
      <Dashboardview />
    </>
  );
}