'use client';

import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ShipmentMap } from '@/components/dashboard/ShipmentMap';
import { RouteTableSkeleton, ChartSkeleton } from '@/components/ui/skeletons';
import { PageTitle } from '@/components/ui/page-title';

type ShipmentMapData = {
  id: string;
  awbNumber: string;
  originLat: number;
  originLng: number;
  originIata: string;
  originName: string;
  originCountry: string;
  destLat: number;
  destLng: number;
  destIata: string;
  destName: string;
  destCountry: string;
  status: string;
  deliveryStatus: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  estimatedDelivery: string | null;
  weightKg: number;
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function DashboardContent() {
  // Use SWR for fetching and caching dashboard analytics
  const { data: rawResponse, error, mutate } = useSWR('/api/dashboard/analytics', fetcher, {
    refreshInterval: 15000, // Fallback polling every 15s if SSE is closed/unavailable
    revalidateOnFocus: false,
  });

  const isLoading = !rawResponse && !error;
  const data: DashboardData | null = rawResponse?.success ? rawResponse.data : null;

  // Memoize active shipments to prevent unnecessary rerenders
  const memoizedShipments = useMemo(() => {
    return data?.shipmentMapData || [];
  }, [data?.shipmentMapData]);

  // Subscribe to SSE realtime telemetry stream
  useEffect(() => {
    console.log('[Dashboard] Opening Server-Sent Events stream for telemetry sync');
    const eventSource = new EventSource('/api/dashboard/realtime');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.shipmentMapData) {
          console.log('[Dashboard SSE] Received telemetry payload, active flights:', payload.shipmentMapData.length);
          // Update SWR cache locally with the fresh active shipments telemetry data
          mutate(
            (current: any) => {
              if (!current) return current;
              return {
                ...current,
                data: {
                  ...current.data,
                  shipmentMapData: payload.shipmentMapData,
                },
              };
            },
            false // Don't trigger a network fetch on mutation
          );
        }
      } catch (err) {
        console.error('[Dashboard SSE] Failed to parse telemetry update:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[Dashboard SSE] connection interrupted, fallback polling is active.', err);
    };

    return () => {
      console.log('[Dashboard] Closing Server-Sent Events stream');
      eventSource.close();
    };
  }, [mutate]);

  // Dynamically calculate Statistics Panel from the live active shipments
  const stats = useMemo(() => {
    const counts = {
      total: memoizedShipments.length,
      booked: 0,
      received_at_warehouse: 0,
      security_cleared: 0,
      manifested: 0,
      departed: 0,
      transshipment: 0,
    };

    memoizedShipments.forEach((s) => {
      const status = s.deliveryStatus;
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });

    return counts;
  }, [memoizedShipments]);

  if (error) {
    return (
      <div>
        <div className="sl-page-header">
          <h1 className="sl-page-title">Operations Analytics</h1>
          <p className="sl-page-subtitle" style={{ color: '#ef4444' }}>
            Failed to load operations control board. Check database connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle title="Dashboard" />
      {/* Page Header */}
      <div className="sl-page-header" style={{ marginBottom: 16 }}>
        <h1 className="sl-page-title">Operations Control Board</h1>
        <p className="sl-page-subtitle">Real-time global cargo tracking & aircraft telemetry</p>
      </div>

      {/* Real-time Statistics Panel Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 20 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="sl-stat-card" style={{ height: 90, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>Loading...</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="sl-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 20 }}>
          {/* Total card */}
          <div className="sl-stat-card active-total" style={{ border: '1px solid rgba(14, 165, 233, 0.25)', background: 'linear-gradient(135deg, #090e1a, #0c1830)' }}>
            <div className="sl-stat-header">
              <span className="sl-stat-label" style={{ color: '#0ea5e9', fontWeight: 800 }}>ACTIVE PLANES</span>
            </div>
            <div className="sl-stat-value" style={{ color: '#ffffff', fontSize: 26, fontWeight: 900 }}>
              {stats.total.toString().padStart(2, '0')}
            </div>
            <div className="sl-stat-meta" style={{ color: '#64748b', fontSize: 9.5 }}>Global Operations</div>
          </div>

          {/* Booked */}
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Booked</span>
            </div>
            <div className="sl-stat-value">{stats.booked}</div>
            <div className="sl-stat-meta">— Scheduled</div>
          </div>

          {/* Received Whse */}
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Recv Whse</span>
            </div>
            <div className="sl-stat-value">{stats.received_at_warehouse}</div>
            <div className="sl-stat-meta">— Warehouse</div>
          </div>

          {/* Security Cleared */}
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Sec Cleared</span>
            </div>
            <div className="sl-stat-value">{stats.security_cleared}</div>
            <div className="sl-stat-meta">— Cleared</div>
          </div>

          {/* Manifested */}
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Manifested</span>
            </div>
            <div className="sl-stat-value">{stats.manifested}</div>
            <div className="sl-stat-meta">— Loaded</div>
          </div>

          {/* Departed */}
          <div className="sl-stat-card" style={{ border: '1px solid rgba(14, 165, 233, 0.1)' }}>
            <div className="sl-stat-header">
              <span className="sl-stat-label" style={{ color: '#0ea5e9' }}>Departed</span>
            </div>
            <div className="sl-stat-value" style={{ color: '#0ea5e9' }}>{stats.departed}</div>
            <div className="sl-stat-meta" style={{ color: '#38bdf8' }}>In Transit</div>
          </div>

          {/* Transshipment */}
          <div className="sl-stat-card" style={{ border: '1px solid rgba(14, 165, 233, 0.1)' }}>
            <div className="sl-stat-header">
              <span className="sl-stat-label" style={{ color: '#0ea5e9' }}>Transship</span>
            </div>
            <div className="sl-stat-value" style={{ color: '#0ea5e9' }}>{stats.transshipment}</div>
            <div className="sl-stat-meta" style={{ color: '#38bdf8' }}>Transfer</div>
          </div>
        </div>
      )}

      {/* Shipment Map */}
      {isLoading ? <ChartSkeleton /> : <ShipmentMap shipments={memoizedShipments} />}

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
            <Link href="/shipments" className="sl-view-all-link">
              View All Routes
            </Link>
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
                  <td>
                    <span className="sl-cargo-weight">{route.totalWeight}</span>
                  </td>
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
    <Suspense
      fallback={
        <div>
          <ChartSkeleton />
          <RouteTableSkeleton rows={5} />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
