'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
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

function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  // Memoize shipments to prevent unnecessary re-renders
  const memoizedShipments = useMemo(() => {
    return data?.shipmentMapData || [];
  }, [data?.shipmentMapData?.map(s => s.id).join(',')]);

  useEffect(() => {
    async function fetchDashboard() {
      setIsLoading(true);
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

    // Initial fetch
    fetchDashboard();

    // Poll every 30 seconds to keep data fresh
    const interval = setInterval(() => {
      fetchDashboard();
    }, 30000);

    return () => clearInterval(interval);
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
      <PageTitle title="Dashboard" />
      {/* Page Header */}
      <div className="sl-page-header">
        <h1 className="sl-page-title">Operations Analytics</h1>
        <p className="sl-page-subtitle">Real-time performance metrics for Global Hub A-42</p>
      </div>

      {/* Shipment Map */}
      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <ShipmentMap shipments={memoizedShipments} />
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
