'use client';
import { useState, useEffect, Suspense } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { usePagination } from '@/lib/hooks/usePagination';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, StatCardSkeleton, ChartSkeleton, PieChartSkeleton } from '@/components/ui/skeletons';

const shipmentVolume = [
  { date: 'Apr 07', value: 140 },
  { date: 'Apr 08', value: 155 },
  { date: 'Apr 09', value: 148 },
  { date: 'Apr 10', value: 162 },
  { date: 'Apr 11', value: 150 },
  { date: 'Apr 12', value: 158 },
  { date: 'Apr 13', value: 168 },
];

const statusDist = [
  { name: 'On-Time', value: 523, color: '#16a34a' },
  { name: 'In Transit', value: 167, color: '#3b82f6' },
  { name: 'Delayed', value: 42, color: '#ef4444' },
];

const shipments = [
  { awb: 'AWB-109281', originCode: 'JFK', originName: 'New York, US', originColor: 'green', destCode: 'LHR', destName: 'London, UK', destColor: 'blue', flight: 'BA-178', status: 'ON-TIME', statusClass: 'sl-badge-ontime', weight: '2,340 kg', ts: '2026-04-13 08:45', indicatorColor: '#10b981' },
  { awb: 'AWB-216581', originCode: 'LAX', originName: 'Los Angeles, US', originColor: 'blue', destCode: 'NRT', destName: 'Tokyo, JP', destColor: 'blue', flight: 'JL-061', status: 'DEPARTED', statusClass: 'sl-badge-departed', weight: '1,875 kg', ts: '2026-04-13 09:12', indicatorColor: '#3b82f6' },
  { awb: 'AWB-154351', originCode: 'ORD', originName: 'Chicago, US', originColor: 'purple', destCode: 'FRA', destName: 'Frankfurt, DE', destColor: 'purple', flight: 'LH-430', status: 'ON-TIME', statusClass: 'sl-badge-ontime', weight: '3,120 kg', ts: '2026-04-13 09:30', indicatorColor: '#10b981' },
  { awb: 'AWB-735198', originCode: 'DXB', originName: 'Dubai, AE', originColor: 'red', destCode: 'SYD', destName: 'Sydney, AU', destColor: 'red', flight: 'EK-413', status: 'DELAYED', statusClass: 'sl-badge-delayed', weight: '2,650 kg', ts: '2026-04-13 10:05', indicatorColor: '#ef4444' },
  { awb: 'AWB-308123', originCode: 'CDG', originName: 'Paris, FR', originColor: 'orange', destCode: 'JFK', destName: 'New York, US', destCode2: 'green', flight: 'AF-022', status: 'DEPARTED', statusClass: 'sl-badge-departed', weight: '1,920 kg', ts: '2026-04-13 10:22', indicatorColor: '#3b82f6' },
  { awb: 'AWB-476289', originCode: 'AMS', originName: 'Amsterdam, NL', originColor: 'blue', destCode: 'DXB', destName: 'Dubai, AE', destColor: 'red', flight: 'KL-781', status: 'DELAYED', statusClass: 'sl-badge-delayed', weight: '1,540 kg', ts: '2026-04-13 10:48', indicatorColor: '#ef4444' },
  { awb: 'AWB-890158', originCode: 'AMS', originName: 'Amsterdam, NL', originColor: 'blue', destCode: 'DXB', destName: 'Dubai, AE', destColor: 'red', flight: 'KL-781', status: 'DELAYED', statusClass: 'sl-badge-delayed', weight: '1,540 kg', ts: '2026-04-13 10:48', indicatorColor: '#ef4444' },
  { awb: 'AWB-234567', originCode: 'SIN', originName: 'Singapore, SG', originColor: 'orange', destCode: 'MEL', destName: 'Melbourne, AU', destColor: 'green', flight: 'SQ-237', status: 'ON-TIME', statusClass: 'sl-badge-ontime', weight: '2,100 kg', ts: '2026-04-13 11:15', indicatorColor: '#10b981' },
  { awb: 'AWB-345678', originCode: 'ICN', originName: 'Seoul, KR', originColor: 'purple', destCode: 'LAX', destName: 'Los Angeles, US', destColor: 'blue', flight: 'KE-012', status: 'DEPARTED', statusClass: 'sl-badge-departed', weight: '2,890 kg', ts: '2026-04-13 11:45', indicatorColor: '#3b82f6' },
  { awb: 'AWB-456789', originCode: 'BKK', originName: 'Bangkok, TH', originColor: 'orange', destCode: 'LHR', destName: 'London, UK', destColor: 'blue', flight: 'TG-910', status: 'ON-TIME', statusClass: 'sl-badge-ontime', weight: '1,650 kg', ts: '2026-04-13 12:20', indicatorColor: '#10b981' },
  { awb: 'AWB-567890', originCode: 'MNL', originName: 'Manila, PH', originColor: 'red', destCode: 'SFO', destName: 'San Francisco, US', destColor: 'green', flight: 'PR-104', status: 'DELAYED', statusClass: 'sl-badge-delayed', weight: '1,980 kg', ts: '2026-04-13 13:00', indicatorColor: '#ef4444' },
  { awb: 'AWB-678901', originCode: 'DEL', originName: 'Delhi, IN', originColor: 'orange', destCode: 'JFK', destName: 'New York, US', destColor: 'green', flight: 'AI-101', status: 'DEPARTED', statusClass: 'sl-badge-departed', weight: '3,200 kg', ts: '2026-04-13 13:35', indicatorColor: '#3b82f6' },
];

function ReportsContent() {
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 500);
  const { currentPage, setPage, getPaginatedData, getTotalPages, itemsPerPage } = usePagination(7);

  useEffect(() => {
    if (debouncedSearch.trim()) {
      console.log(`Searching... "${debouncedSearch}"`);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    console.log('Fetching reports data...');
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const filtered = shipments.filter(s =>
    s.awb.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    s.originName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    s.destName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    s.flight.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const paginatedShipments = getPaginatedData(filtered);
  const totalPages = getTotalPages(filtered.length);
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div>
      {/* Header */}
      <div className="sl-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="sl-page-title">Reports</h1>
          <p className="sl-page-subtitle">Operational Cargo Analytics</p>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="sl-reports-stats">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="sl-reports-stats">
          <div className="sl-rstat-card">
            <div className="sl-rstat-label">Total Shipments</div>
            <div className="sl-rstat-value-row">
              <span className="sl-rstat-value">732</span>
              <span className="sl-rstat-change up">+12,5%</span>
            </div>
          </div>
          <div className="sl-rstat-card">
            <div className="sl-rstat-label">On-Time Flights</div>
            <div className="sl-rstat-value-row">
              <span className="sl-rstat-value">523</span>
              <span className="sl-rstat-change up">+71,4%</span>
            </div>
          </div>
          <div className="sl-rstat-card">
            <div className="sl-rstat-label">Delayed Shipments</div>
            <div className="sl-rstat-value-row">
              <span className="sl-rstat-value" style={{ color: '#ef4444' }}>42</span>
              <span className="sl-rstat-change down">-3,2%</span>
            </div>
          </div>
          <div className="sl-rstat-card">
            <div className="sl-rstat-label">Total Tonnage</div>
            <div className="sl-rstat-value-row">
              <span className="sl-rstat-value">1,8 M</span>
              <span className="sl-rstat-unit" style={{ fontSize: 16 }}>KG</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="sl-report-filters">
        <div className="sl-filter-group">
          <span className="sl-filter-label">Search</span>
          <input
            type="text"
            placeholder="Search AWB, Origin, Destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 7,
              fontSize: 12,
              color: '#475569',
              background: '#fff',
              width: 250,
            }}
          />
        </div>
        <div className="sl-filter-group">
          <span className="sl-filter-label">Date Range</span>
          <select className="sl-filter-sel">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
        </div>
        <div className="sl-filter-group">
          <span className="sl-filter-label">Terminal</span>
          <select className="sl-filter-sel">
            <option>All Terminals</option>
            <option>Terminal A</option>
            <option>Terminal B</option>
          </select>
        </div>
        <div className="sl-filter-group">
          <span className="sl-filter-label">Status</span>
          <select className="sl-filter-sel">
            <option>All Status</option>
            <option>On-Time</option>
            <option>Delayed</option>
          </select>
        </div>
        <div className="sl-report-export-btns">
          <button className="sl-btn-export-csv">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button className="sl-btn-export-pdf">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* AWB Table */}
      {isLoading ? (
        <TableSkeleton rows={7} />
      ) : (
        <div className="sl-awb-table-container">
          <table className="sl-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>AWB Number</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Flight ID</th>
                <th>Status</th>
                <th>Weight</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paginatedShipments.map((s, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 3, height: 34, borderRadius: 2, background: s.indicatorColor, flexShrink: 0 }} />
                      <a href="#" className="sl-awb-number">{s.awb}</a>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`sl-airport-badge ${s.originColor}`}>{s.originCode}</span>
                      <span style={{ fontSize: 12, color: '#475569' }}>{s.originName}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`sl-airport-badge ${(s as any).destCode2 || s.destColor}`}>{s.destCode}</span>
                      <span style={{ fontSize: 12, color: '#475569' }}>{s.destName}</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>{s.flight}</span></td>
                  <td><span className={`sl-status-badge ${s.statusClass}`}>{s.status}</span></td>
                  <td><span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{s.weight}</span></td>
                  <td><span style={{ fontSize: 11.5, color: '#64748b' }}>{s.ts}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
          />
        </div>
      )}

      {/* Bottom Charts */}
      <div className="sl-bottom-charts">
        {/* Shipment Volume Over Time */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="sl-chart-card">
            <div className="sl-chart-header">
              <div>
                <p className="sl-chart-title">Shipment Volume Over Time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={shipmentVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 180]} ticks={[0, 45, 90, 135, 180]} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Distribution */}
        {isLoading ? (
          <PieChartSkeleton />
        ) : (
          <div className="sl-sla-card">
            <p className="sl-sla-title">Status Distribution</p>
            <div className="sl-donut-wrapper">
              <PieChart width={200} height={200}>
                <Pie data={statusDist} cx={95} cy={95} innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={2} stroke="#fff">
                  {statusDist.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="sl-sla-legend">
              {statusDist.map((item) => (
                <div key={item.name} className="sl-sla-legend-row">
                  <div className="sl-sla-legend-left">
                    <span className="sl-sla-legend-dot" style={{ background: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="sl-sla-legend-count">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={7} />}>
      <ReportsContent />
    </Suspense>
  );
}
