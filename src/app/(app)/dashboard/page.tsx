'use client';

import { Suspense, useCallback, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ShipmentMap } from '@/components/dashboard/ShipmentMap';
import { RouteTableSkeleton, ChartSkeleton } from '@/components/ui/skeletons';
import { PageTitle } from '@/components/ui/page-title';

type ShipmentMapData = {
  id: string;
  awbNumber: string;
  originLat: number;
  originLng: number;
  originIata: string;
  destLat: number;
  destLng: number;
  destIata: string;
  status: string;
};

type DashboardData = {
  shipmentMapData: ShipmentMapData[];
  topRoutes: Array<{
    destination: string;
    destinationDetail: string;
    planeId: string;
    totalWeight: string;
  }>;
  deliveredWeightByDate: Array<{
    date: string;
    weightKg: number;
    weightMt?: number;
  }>;
  activeShipmentsByPriority: Array<{
    priority: string;
    count: number;
  }>;
};

type DashboardApiResponse = {
  success?: boolean;
  data?: DashboardData;
  error?: string;
};

const DASHBOARD_ERROR_MESSAGE = 'Dashboard data is temporarily unavailable.';

function formatPriorityLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function DeliveredWeightChart({ data }: { data: DashboardData['deliveredWeightByDate'] }) {
  if (data.length === 0) {
    return (
      <div className="sl-chart-card">
        <div className="sl-chart-header">
          <div>
            <p className="sl-chart-title">Late-Stage Cargo Weight</p>
            <p className="sl-chart-subtitle">Total shipment weight for delivered, arrived, and out-for-delivery cargo by date</p>
          </div>
        </div>
        <div className="sl-chart-empty">No late-stage cargo weight data available yet.</div>
      </div>
    );
  }

  return (
    <div className="sl-chart-card">
      <div className="sl-chart-header">
        <div>
          <p className="sl-chart-title">Late-Stage Cargo Weight</p>
          <p className="sl-chart-subtitle">Total shipment weight for delivered, arrived, and out-for-delivery cargo by date</p>
        </div>
      </div>
      <div className="sl-dashboard-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="deliveredWeightFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a2d5a" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#1a2d5a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e8edf4" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()} kg`, 'Weight']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="weightKg"
              stroke="#1a2d5a"
              strokeWidth={2}
              fill="url(#deliveredWeightFill)"
              dot={{ r: 3, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ActivePriorityChart({ data }: { data: DashboardData['activeShipmentsByPriority'] }) {
  const visiblePriorityData = data.filter((item) => item.priority !== 'other');
  const totalActive = visiblePriorityData.reduce((sum, item) => sum + item.count, 0);

  if (visiblePriorityData.length === 0 || totalActive === 0) {
    return (
      <div className="sl-chart-card">
        <div className="sl-chart-header">
          <div>
            <p className="sl-chart-title">Active Shipments by Priority</p>
            <p className="sl-chart-subtitle">Current active cargo workload grouped by shipment priority</p>
          </div>
        </div>
        <div className="sl-chart-empty">No active priority shipment data available.</div>
      </div>
    );
  }

  const chartData = visiblePriorityData.map((item) => ({
    ...item,
    label: formatPriorityLabel(item.priority),
  }));

  return (
    <div className="sl-chart-card">
      <div className="sl-chart-header">
        <div>
          <p className="sl-chart-title">Active Shipments by Priority</p>
          <p className="sl-chart-subtitle">Current active cargo workload grouped by shipment priority</p>
        </div>
      </div>
      <div className="sl-dashboard-chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e8edf4" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
            <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Shipments']} />
            <Bar dataKey="count" fill="#1a2d5a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const hasDataRef = useRef(false);

  const shipments = data?.shipmentMapData || [];
  const deliveredWeightByDate = data?.deliveredWeightByDate || [];
  const activeShipmentsByPriority = data?.activeShipmentsByPriority || [];

  const fetchDashboard = useCallback(async () => {
    if (!hasDataRef.current) setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/analytics', {
        headers: { Accept: 'application/json' },
      });
      const contentType = res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        await res.text();
        throw new Error(DASHBOARD_ERROR_MESSAGE);
      }

      const json = (await res.json()) as DashboardApiResponse;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || DASHBOARD_ERROR_MESSAGE);
      }

      setData(json.data);
      hasDataRef.current = true;
      setError('');
    } catch {
      setError(DASHBOARD_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchDashboard();

    // Poll every 30 seconds to keep data fresh
    const interval = setInterval(() => {
      fetchDashboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (!data && !isLoading) {
    return (
      <div>
        <PageTitle title="Dashboard" />
        <div className="sl-page-header">
          <h1 className="sl-page-title">Operations Analytics</h1>
          <p className="sl-page-subtitle">{error || DASHBOARD_ERROR_MESSAGE}</p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#1a2d5a] px-4 py-2 text-xs font-bold uppercase tracking-[0.4px] text-white"
          >
            Retry Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle title="Dashboard" />
      {/* Page Header */}
      <div className="sl-page-header">
        <h1 className="sl-page-title">Operations Analytics</h1>
        <p className="sl-page-subtitle">Real-time performance metrics for Global Hub A-42</p>
        {error && (
          <p className="mt-2 text-xs font-semibold text-[#b45309]">
            {error} Showing the last available dashboard snapshot.
          </p>
        )}
      </div>

      {/* Shipment Map */}
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <ShipmentMap shipments={shipments} />
      )}

      {isLoading ? (
        <div className="sl-charts-grid">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="sl-charts-grid">
          <DeliveredWeightChart data={deliveredWeightByDate} />
          <ActivePriorityChart data={activeShipmentsByPriority} />
        </div>
      )}

      {/* Top Operational Routes Table */}
      {isLoading ? (
        <RouteTableSkeleton rows={5} />
      ) : (
        <div className="sl-routes-section">
          <div className="sl-routes-header">
            <div>
              <p className="sl-routes-title">Top Operational Routes</p>
              <p className="sl-routes-subtitle">Top 5 Routes by Total Shipment Weight</p>
            </div>
            <Link href="/shipments" className="sl-view-all-link">View All Routes</Link>
          </div>
          <table className="sl-table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Plane ID</th>
                <th>Total Cargo Weight</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topRoutes || []).map((route, idx) => (
                <tr key={idx}>
                  <td>
                    <div>
                      <div className="sl-route-main">{route.destination}</div>
                      <div className="sl-route-sub">{route.destinationDetail}</div>
                    </div>
                  </td>
                  <td>
                    <div className="sl-flight-id">{route.planeId}</div>
                  </td>
                  <td><span className="sl-cargo-weight">{route.totalWeight}</span></td>
                </tr>
              ))}
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
        <ChartSkeleton />
        <RouteTableSkeleton rows={5} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
