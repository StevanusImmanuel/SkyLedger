'use client';

import { Suspense, useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { StatCardSkeleton, ChartSkeleton, RouteTableSkeleton, TableSkeleton, PieChartSkeleton } from '@/components/ui/skeletons';
import { ClientTimestamp } from '@/components/ui/ClientTimestamp';

type DashboardData = {
  stats: {
    totalCargoTonnage: string;
    activeShipments: number;
    delayedShipments: number;
    slaCompletion: string;
    totalShipments: number;
  };
  capacityData: Array<{ day: string; inbound: number; outbound: number }>;
  slaData: Array<{ name: string; value: number; color: string }>;
  topRoutes: Array<{
    id: string;
    sector: string;
    desc: string;
    flightId: string;
    weight: string;
    shipmentCount: number;
  }>;
  cargoFlights: Array<{
    awb: string;
    origin: string;
    dest: string;
    flight: string;
    status: string;
    weight: string;
    timestamp: string;
  }>;
};

const statusIndicatorColor: Record<string, string> = {
  'in_transit': '#0ea5e9',
  'delivered': '#10b981',
  'delayed': '#ef4444',
  'pending': '#8b5cf6',
  'processing': '#8b5cf6',
  'cancelled': '#ef4444',
};

const statusClassMap: Record<string, string> = {
  'in_transit': 'sl-badge-intransit',
  'delivered': 'sl-badge-ontime',
  'delayed': 'sl-badge-delayed',
  'pending': 'sl-badge-manifested',
  'processing': 'sl-badge-departed',
  'cancelled': 'sl-badge-delayed',
};

const airportColorMap: Record<string, string> = {
  LHR: 'blue', JFK: 'green', SIN: 'orange', NRT: 'purple',
  CDG: 'orange', FRA: 'purple', DXB: 'red', SYD: 'green',
  HKG: 'blue', LAX: 'purple',
};

function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard/analytics');
        const json = await res.json();
        console.log('Dashboard API response:', json);
        if (json.success) {
          setData(json.data);
        } else {
          console.error('Dashboard API error:', json.error);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (!data && !isLoading) {
    return (
      <div>
        <div className="sl-page-header">
          <h1 className="sl-page-title">Operations Analytics</h1>
          <p className="sl-page-subtitle">Unable to load dashboard data. Please check your connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="sl-page-header">
        <h1 className="sl-page-title">Operations Analytics</h1>
        <p className="sl-page-subtitle">Real-time performance metrics for Global Hub A-42</p>
      </div>

      {/* Filters */}
      <div className="sl-filters-row">
        <div className="sl-period-tabs">
          <button className="sl-period-tab active">WEEK</button>
          <button className="sl-period-tab">MONTH</button>
          <button className="sl-period-tab">YEAR</button>
        </div>
        <select className="sl-filter-select" style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 11.5, color: '#475569', background: '#fff', cursor: 'pointer' }}>
          <option>Terminal: All</option>
          <option>Terminal: A</option>
          <option>Terminal: B</option>
        </select>
        <select className="sl-filter-select" style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 11.5, color: '#475569', background: '#fff', cursor: 'pointer' }}>
          <option>Flight Type: Heavy</option>
          <option>Flight Type: Medium</option>
          <option>Flight Type: Light</option>
        </select>
      </div>

      {/* Export Buttons */}
      <div className="sl-export-btns">
        <button className="sl-btn-export sl-btn-csv">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          CSV
        </button>
        <button className="sl-btn-export sl-btn-pdf">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          PDF Report
        </button>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="sl-stats-grid">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="sl-stats-grid">
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Total Cargo Tonnage</span>
              <span className="sl-stat-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </span>
            </div>
            <div className="sl-stat-value">{data?.stats.totalCargoTonnage || '0'}<span className="unit">MT</span></div>
            <div className="sl-stat-meta up">↑ 12.5% vs Last Week</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Avg. Processing Time</span>
              <span className="sl-stat-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
            </div>
            <div className="sl-stat-value">4.2<span className="unit">HRS</span></div>
            <div className="sl-stat-meta neutral">— Stable Performance</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">SLA Completion</span>
              <span className="sl-stat-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </span>
            </div>
            <div className="sl-stat-value">{data?.stats.slaCompletion || '0'}<span className="unit">%</span></div>
            <div className="sl-stat-meta up">↑ 0.8% Target Gain</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Active Fleet Capacity</span>
              <span className="sl-stat-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
              </span>
            </div>
            <div className="sl-stat-value">82<span className="unit">%</span></div>
            <div className="sl-stat-bar"><div className="sl-stat-bar-fill" style={{ width: '82%' }} /></div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="sl-charts-grid">
        {/* Capacity Utilization Trend */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="sl-chart-card">
            <div className="sl-chart-header">
              <div>
                <p className="sl-chart-title">Capacity Utilization Trend</p>
                <p className="sl-chart-subtitle">Cargo volume past 7 days</p>
              </div>
              <div className="sl-chart-legend">
                <span className="sl-legend-item">
                  <span className="sl-legend-dot" style={{ background: '#1a2d5a' }} />
                  Inbound
                </span>
                <span className="sl-legend-item">
                  <span className="sl-legend-dot" style={{ background: '#60a5fa' }} />
                  Outbound
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.capacityData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a2d5a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1a2d5a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="inbound" stroke="#1a2d5a" strokeWidth={2} fill="url(#colorInbound)" />
                <Area type="monotone" dataKey="outbound" stroke="#60a5fa" strokeWidth={2} fill="url(#colorOutbound)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* SLA Performance Index */}
        {isLoading ? (
          <PieChartSkeleton />
        ) : (
          <div className="sl-sla-card">
            <p className="sl-sla-title">SLA Performance Index</p>
            <p className="sl-sla-subtitle">Service Level Targets</p>

            <div className="sl-donut-wrapper" style={{ position: 'relative' }}>
              <PieChart width={160} height={160}>
                <Pie
                  data={data?.slaData || []}
                  cx={75}
                  cy={75}
                  innerRadius={52}
                  outerRadius={72}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {(data?.slaData || []).map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{data?.stats.slaCompletion || '0'}%</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compliant</div>
              </div>
            </div>

            <div className="sl-sla-legend">
              {(data?.slaData || []).map((item) => (
                <div key={item.name} className="sl-sla-legend-row">
                  <div className="sl-sla-legend-left">
                    <span className="sl-sla-legend-dot" style={{ background: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="sl-sla-legend-count">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Operational Routes Table */}
      {isLoading ? (
        <RouteTableSkeleton rows={5} />
      ) : (
        <div className="sl-routes-section">
          <div className="sl-routes-header">
            <div>
              <p className="sl-routes-title">Top Operational Routes</p>
              <p className="sl-routes-subtitle">Volume by Sector (Weekly)</p>
            </div>
            <a href="#" className="sl-view-all-link">View All Routes</a>
          </div>
          <table className="sl-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Flight ID</th>
                <th>Cargo Weight</th>
                <th>Utiliz.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topRoutes || []).map((route) => {
                const util = Math.min(Math.round((route.shipmentCount / 10) * 100), 100);
                const utilColor = util >= 75 ? '#1a2d5a' : '#b45309';
                const status = util >= 75 ? 'OPTIMAL' : 'MODERATE';
                const statusClass = util >= 75 ? 'sl-badge-optimal' : 'sl-badge-moderate';

                return (
                  <tr key={route.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span className="sl-sector-badge">{route.id}</span>
                        <div>
                          <div className="sl-route-main">{route.sector}</div>
                          <div className="sl-route-sub">{route.desc}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="sl-flight-id" style={{ whiteSpace: 'pre-line' }}>{route.flightId}</div>
                    </td>
                    <td><span className="sl-cargo-weight">{route.weight}</span></td>
                    <td>
                      <div className="sl-util-bar">
                        <div className="sl-util-track">
                          <div className="sl-util-fill" style={{ width: `${util}%`, background: utilColor }} />
                        </div>
                      </div>
                    </td>
                    <td><span className={`sl-status-badge ${statusClass}`}>{status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cargo Flights Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <div className="sl-cargo-table-section">
          <div className="sl-cargo-table-header">
            <div>
              <p className="sl-cargo-table-title">Cargo Flight Status</p>
              <p className="sl-cargo-table-subtitle">Real-time shipment tracking</p>
            </div>
          </div>
          <table className="sl-table" style={{ padding: '0 4px' }}>
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
              {(data?.cargoFlights || []).map((flight, i) => {
                const statusKey = flight.status.toLowerCase();
                const statusClass = statusClassMap[statusKey] || 'sl-badge-manifested';
                const indicatorColor = statusIndicatorColor[statusKey] || '#8b5cf6';
                const originColor = airportColorMap[flight.origin] || 'blue';
                const destColor = airportColorMap[flight.dest] || 'green';

                return (
                  <tr key={i}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="sl-cargo-row-indicator" style={{ background: indicatorColor }} />
                        <span style={{ fontWeight: 700, fontSize: 12, color: '#1a2d5a' }}>{flight.awb}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sl-airport-badge ${originColor}`}>{flight.origin}</span>
                      {' '}
                      <span style={{ fontSize: 11.5, color: '#64748b' }}></span>
                    </td>
                    <td>
                      <span className={`sl-airport-badge ${destColor}`}>{flight.dest}</span>
                    </td>
                    <td><span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{flight.flight}</span></td>
                    <td><span className={`sl-status-badge ${statusClass}`}>{flight.status.toUpperCase().replace('_', '-')}</span></td>
                    <td><span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{flight.weight}</span></td>
                    <td>
                      <ClientTimestamp
                        timestamp={flight.timestamp}
                        style={{ fontSize: 11.5, color: '#64748b' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div>
        <div className="sl-stats-grid">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="sl-charts-grid">
          <ChartSkeleton />
          <PieChartSkeleton />
        </div>
        <RouteTableSkeleton rows={5} />
        <TableSkeleton rows={6} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
