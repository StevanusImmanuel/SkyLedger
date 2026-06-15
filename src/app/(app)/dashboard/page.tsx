'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { RouteTableSkeleton, ChartSkeleton, DashboardChartsSkeleton } from '@/components/ui/skeletons';
import { PageTitle } from '@/components/ui/page-title';

const ShipmentMap = dynamic(
  () => import('@/components/dashboard/ShipmentMap').then((mod) => mod.ShipmentMap),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const MapLibreDashboardWrapper = dynamic(
  () => import('@/components/maps/MapLibreDashboardWrapper'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

const DashboardCharts = dynamic(
  () => import('@/components/dashboard/DashboardCharts'),
  {
    ssr: false,
    loading: () => <DashboardChartsSkeleton />,
  }
);

const USE_MAPLIBRE_DASHBOARD_MAP = true;

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

type DashboardApiResponse =
  | { success: true; data: DashboardData }
  | { success?: false; error?: string };

type DashboardFetchResult =
  | { ok: true; data: DashboardData }
  | { ok: false; message: string; stopPolling?: boolean; redirectTo?: string };

type DashboardDebugInfo = {
  status?: number;
  contentType?: string;
  redirected?: boolean;
  url?: string;
  snippet?: string;
  reason: string;
};

function isJsonResponse(response: Response) {
  return response.headers.get('content-type')?.toLowerCase().includes('application/json') ?? false;
}

function createSnippet(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 120);
}

async function warnDashboardFetchOnce(
  warningKeyRef: MutableRefObject<string>,
  info: DashboardDebugInfo
) {
  const warningKey = [
    info.reason,
    info.status,
    info.contentType,
    info.redirected,
    info.url,
    info.snippet,
  ].join('|');

  if (warningKeyRef.current === warningKey) return;
  warningKeyRef.current = warningKey;

  console.warn('[Dashboard] Analytics fetch did not return usable JSON.', info);
}

async function readDashboardResponse(
  response: Response,
  warningKeyRef: MutableRefObject<string>
): Promise<DashboardFetchResult> {
  const contentType = response.headers.get('content-type') || '';
  const responseMeta = {
    status: response.status,
    contentType,
    redirected: response.redirected,
    url: response.url,
  };

  if (response.redirected && response.url.includes('/login/restricted')) {
    await warnDashboardFetchOnce(warningKeyRef, {
      ...responseMeta,
      reason: 'redirected-to-restricted',
    });

    return {
      ok: false,
      message: 'Dashboard data belum bisa dimuat. Silakan login ulang.',
      stopPolling: true,
      redirectTo: '/login/restricted',
    };
  }

  if (!isJsonResponse(response)) {
    const text = await response.text().catch(() => '');

    await warnDashboardFetchOnce(warningKeyRef, {
      ...responseMeta,
      reason: 'non-json-response',
      snippet: createSnippet(text),
    });

    return {
      ok: false,
      message: 'Dashboard data belum bisa dimuat. Silakan refresh atau login ulang.',
      stopPolling: response.status === 401 || response.status === 403 || response.redirected,
    };
  }

  let payload: DashboardApiResponse;
  try {
    payload = await response.json();
  } catch {
    await warnDashboardFetchOnce(warningKeyRef, {
      ...responseMeta,
      reason: 'invalid-json-body',
    });

    return {
      ok: false,
      message: 'Dashboard data belum bisa dimuat. Silakan refresh atau login ulang.',
      stopPolling: !response.ok,
    };
  }

  if (payload.success === true) {
    return { ok: true, data: payload.data };
  }

  if (!response.ok || payload.success === false) {
    await warnDashboardFetchOnce(warningKeyRef, {
      ...responseMeta,
      reason: 'json-error-response',
      snippet: payload.error,
    });

    return {
      ok: false,
      message: payload.error || 'Dashboard data belum bisa dimuat. Silakan refresh atau login ulang.',
      stopPolling: response.status === 401 || response.status === 403,
      redirectTo: response.status === 401 ? '/login/restricted' : undefined,
    };
  }

  return {
    ok: false,
    message: 'Dashboard data belum bisa dimuat. Silakan refresh atau login ulang.',
  };
}

function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState('');
  const shouldStopPollingRef = useRef(false);
  const dashboardWarningKeyRef = useRef('');

  const shipmentMapData = data?.shipmentMapData || [];

  useEffect(() => {
    async function fetchDashboard(showLoading = false) {
      if (shouldStopPollingRef.current) return;
      if (showLoading) setIsLoading(true);

      try {
        const res = await fetch('/api/dashboard/analytics', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        const result = await readDashboardResponse(res, dashboardWarningKeyRef);

        if (result.ok) {
          setData(result.data);
          setDashboardError('');
          dashboardWarningKeyRef.current = '';
        } else {
          setDashboardError(result.message);

          if (result.stopPolling) {
            shouldStopPollingRef.current = true;
          }

          if (result.redirectTo && typeof window !== 'undefined') {
            window.location.assign(result.redirectTo);
          }
        }
      } catch (err) {
        const message =
          err instanceof Error && err.name === 'AbortError'
            ? 'Dashboard request timed out. Please try again.'
            : 'Dashboard data belum bisa dimuat. Silakan refresh atau login ulang.';
        await warnDashboardFetchOnce(dashboardWarningKeyRef, {
          reason: err instanceof Error ? `fetch-error:${err.name}` : 'fetch-error',
          snippet: err instanceof Error ? createSnippet(err.message) : undefined,
        });
        setDashboardError(message);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    }

    // Initial fetch only — user refreshes manually
    fetchDashboard(true);

    return () => {};
  }, []);

  if (!data && !isLoading) {
    return (
      <div>
        <PageTitle title="Dashboard" />
        <div className="sl-page-header">
          <h1 className="sl-page-title">Operations Analytics</h1>
          <p className="sl-page-subtitle">
            {dashboardError || 'Dashboard data belum bisa dimuat. Silakan refresh atau login ulang.'}
          </p>
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
        <p className="sl-page-subtitle">
          {dashboardError || 'Real-time performance metrics for Global Hub A-42'}
        </p>
      </div>

      {/* Shipment Map */}
      {isLoading ? (
        <ChartSkeleton />
      ) : USE_MAPLIBRE_DASHBOARD_MAP ? (
        <MapLibreDashboardWrapper shipments={shipmentMapData} />
      ) : (
        <ShipmentMap shipments={shipmentMapData} />
      )}

      {/* Statistics Charts */}
      {isLoading ? (
        <DashboardChartsSkeleton />
      ) : (
        <DashboardCharts
          weightByDate={data?.deliveredWeightByDate || []}
          priorityCounts={data?.activeShipmentsByPriority || []}
        />
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
