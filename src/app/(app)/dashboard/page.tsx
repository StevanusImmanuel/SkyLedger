'use client';

import { Suspense, useCallback, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
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
};

type DashboardApiResponse = {
  success?: boolean;
  data?: DashboardData;
  error?: string;
};

const DASHBOARD_ERROR_MESSAGE = 'Dashboard data is temporarily unavailable.';

function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const hasDataRef = useRef(false);

  const shipments = data?.shipmentMapData || [];

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
