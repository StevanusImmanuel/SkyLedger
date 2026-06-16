'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePagination } from '@/lib/hooks/usePagination';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, StatCardSkeleton } from '@/components/ui/skeletons';
import { exportToCSV, exportToPDF } from '@/lib/utils/export';
import { PageTitle } from '@/components/ui/page-title';

type Shipment = {
  id: string;
  awbNumber: string;
  originAirport: { iataCode: string; name: string; city: string; country: string } | null;
  destAirport: { iataCode: string; name: string; city: string; country: string } | null;
  flight: { airplane: { airplaneId: number; flightNumber: string } | null } | null;
  priority: 'standard' | 'express' | 'critical';
  status: 'pending' | 'processing' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled' | 'closed';
  deliveryStatus: 'booked' | 'received_at_warehouse' | 'security_cleared' | 'manifested' | 'departed' | 'transshipment' | 'arrived_at_destination' | 'out_for_delivery' | 'ready_for_pickup' | 'delivered' | null;
  weightKg: string;
  productType: string | null;
  createdAt: string;
  actualDelivery?: string | null;
  notes: string | null;
};

const statusIndicatorMap: Record<string, string> = {
  delayed: '#ef4444',
  in_transit: '#0ea5e9',
  pending: '#8b5cf6',
  processing: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
  closed: '#94a3b8',
  // Delivery status colors
  booked: '#8b5cf6',
  received_at_warehouse: '#8b5cf6',
  security_cleared: '#8b5cf6',
  manifested: '#8b5cf6',
  departed: '#0ea5e9',
  transshipment: '#0ea5e9',
  arrived_at_destination: '#10b981',
  out_for_delivery: '#10b981',
  ready_for_pickup: '#10b981',
};

const statusClassMap: Record<string, string> = {
  delayed: 'sl-badge-delayed',
  in_transit: 'sl-badge-intransit',
  pending: 'sl-badge-manifested',
  processing: 'sl-badge-manifested',
  delivered: 'sl-badge-ontime',
  cancelled: 'sl-badge-delayed',
  closed: 'sl-badge-closed',
  // Delivery status classes
  booked: 'sl-badge-manifested',
  received_at_warehouse: 'sl-badge-manifested',
  security_cleared: 'sl-badge-manifested',
  manifested: 'sl-badge-manifested',
  departed: 'sl-badge-intransit',
  transshipment: 'sl-badge-intransit',
  arrived_at_destination: 'sl-badge-ontime',
  out_for_delivery: 'sl-badge-ontime',
  ready_for_pickup: 'sl-badge-ontime',
};

const airportColorMap: Record<string, string> = {
  LHR: 'blue', JFK: 'green', SIN: 'orange', NRT: 'purple',
  CDG: 'orange', FRA: 'purple', DXB: 'red', SYD: 'green',
  HKG: 'blue', LAX: 'purple',
};


function ReportsContent() {
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [airports, setAirports] = useState<Array<{ id: number; iataCode: string; name: string }>>([]);
  const [selectedAirport, setSelectedAirport] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all_final');
  const [stats, setStats] = useState({
    total: 0,
    inFlight: 0,
    arrived: 0,
    totalWeight: 0,
  });
  const debouncedSearch = useDebounce(search, 500);
  const { currentPage, setPage, getPaginatedData, getTotalPages, itemsPerPage } = usePagination(10);

  // Fetch airports
  useEffect(() => {
    async function fetchAirports() {
      try {
        const res = await fetch('/api/airports');
        const json = await res.json();
        if (json.success) {
          setAirports(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch airports:', err);
      }
    }
    fetchAirports();
  }, []);

  // Fetch shipments and statistics with filters
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // 1. Fetch shipments matching criteria
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (selectedAirport !== 'all') params.set('airport', selectedAirport);
        
        if (selectedStatus === 'all_final') {
          params.set('status', 'delivered,closed,cancelled');
        } else {
          params.set('status', selectedStatus);
        }
        
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        params.set('limit', '1000'); // Get all for reports

        const shipmentsRes = await fetch(`/api/shipments?${params}`);
        const shipmentsJson = await shipmentsRes.json();
        if (shipmentsJson.success) {
          setShipments(shipmentsJson.data);
        }

        // 2. Fetch synchronized summary statistics from reports API
        const statsParams = new URLSearchParams();
        if (debouncedSearch) statsParams.set('search', debouncedSearch);
        if (selectedAirport !== 'all') statsParams.set('airport', selectedAirport);
        if (dateFrom) statsParams.set('dateFrom', dateFrom);
        if (dateTo) statsParams.set('dateTo', dateTo);

        const statsRes = await fetch(`/api/reports?${statsParams}`);
        const statsJson = await statsRes.json();
        if (statsJson.success) {
          setStats({
            total: statsJson.data.summary.total,
            inFlight: statsJson.data.summary.inFlight,
            arrived: statsJson.data.summary.arrived,
            totalWeight: Number(statsJson.data.summary.totalWeightKg),
          });
        }
      } catch (err) {
        console.error('Failed to fetch reports data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [debouncedSearch, selectedAirport, dateFrom, dateTo, selectedStatus]);

  const paginatedShipments = getPaginatedData(shipments);
  const totalPages = getTotalPages(shipments.length);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const handlePageChange = (page: number) => {
    setIsTableLoading(true);
    setPage(page);
    setTimeout(() => setIsTableLoading(false), 250);
  };

  return (
    <div>
      <PageTitle title="Reports" />
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
              <span className="sl-rstat-value">{stats.total}</span>
            </div>
          </div>
          <div className="sl-rstat-card">
            <div className="sl-rstat-label">In-Flight</div>
            <div className="sl-rstat-value-row">
              <span className="sl-rstat-value">{stats.inFlight}</span>
            </div>
          </div>
          <div className="sl-rstat-card">
            <div className="sl-rstat-label">Arrived</div>
            <div className="sl-rstat-value-row">
              <span className="sl-rstat-value">{stats.arrived}</span>
            </div>
          </div>
          <div className="sl-rstat-card">
            <div className="sl-rstat-label">Total Tonnage</div>
            <div className="sl-rstat-value-row">
              <span className="sl-rstat-value">{(stats.totalWeight / 1000).toFixed(1)}</span>
              <span className="sl-rstat-unit" style={{ fontSize: 16 }}>T</span>
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
            placeholder="Search AWB, Sender, Receiver..."
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
          <span className="sl-filter-label">Date From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 7,
              fontSize: 12,
              color: '#475569',
              background: '#fff',
              cursor: 'pointer',
            }}
          />
        </div>
        <div className="sl-filter-group">
          <span className="sl-filter-label">Date To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 7,
              fontSize: 12,
              color: '#475569',
              background: '#fff',
              cursor: 'pointer',
            }}
          />
        </div>
        <div className="sl-filter-group">
          <span className="sl-filter-label">Airport</span>
          <select
            className="sl-filter-sel"
            value={selectedAirport}
            onChange={(e) => setSelectedAirport(e.target.value)}
          >
            <option value="all">All Airports</option>
            {airports.map(airport => (
              <option key={airport.id} value={airport.iataCode}>
                {airport.iataCode} - {airport.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sl-filter-group">
          <span className="sl-filter-label">Status</span>
          <select
            className="sl-filter-sel"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Report delivery status filter"
          >
            <option value="all_final">All Reports</option>
            <option value="delivered">Completed</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="sl-report-export-btns">
          <button
            className="sl-btn-export-csv"
            onClick={() => {
              const exportData = shipments.map(s => ({
                AWB: s.awbNumber,
                Origin: `${s.originAirport?.iataCode} - ${s.originAirport?.city}`,
                Destination: `${s.destAirport?.iataCode} - ${s.destAirport?.city}`,
                PlaneID: s.flight?.airplane?.flightNumber || 'N/A',
                ProductType: s.productType || 'N/A',
                DeliveryStatus: s.deliveryStatus?.toUpperCase() || 'N/A',
                Weight: `${s.weightKg} kg`,
                Timestamp: new Date(s.actualDelivery || s.createdAt).toLocaleString(),
              }));
              exportToCSV(exportData, 'reports');
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button
            className="sl-btn-export-pdf"
            onClick={() => {
              const exportData = shipments.map(s => ({
                AWB: s.awbNumber,
                Origin: `${s.originAirport?.iataCode} - ${s.originAirport?.city}`,
                Destination: `${s.destAirport?.iataCode} - ${s.destAirport?.city}`,
                PlaneID: s.flight?.airplane?.flightNumber || 'N/A',
                ProductType: s.productType || 'N/A',
                DeliveryStatus: s.deliveryStatus?.toUpperCase() || 'N/A',
                Weight: `${s.weightKg} kg`,
                Timestamp: new Date(s.actualDelivery || s.createdAt).toLocaleString(),
              }));
              exportToPDF(exportData, 'reports', 'Reports - Shipments');
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* AWB Table */}
      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : isTableLoading ? (
        <TableSkeleton rows={10} />
      ) : (
        <div className="sl-awb-table-container">
          <table className="sl-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>AWB Number</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Plane ID</th>
                <th>Status</th>
                <th>Weight</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {paginatedShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '28px 20px', textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                    No reportable shipments found.
                  </td>
                </tr>
              ) : paginatedShipments.map((s) => {
                const statusKey = s.status === 'closed' ? 'closed' : (s.deliveryStatus || s.status);
                const statusClass = statusClassMap[statusKey] || 'sl-badge-manifested';
                const indicatorColor = statusIndicatorMap[statusKey] || '#8b5cf6';
                const originColor = airportColorMap[s.originAirport?.iataCode || ''] || 'blue';
                const destColor = airportColorMap[s.destAirport?.iataCode || ''] || 'blue';

                const displayStatus = s.status === 'closed' ? 'Closed'
                  : s.status === 'cancelled' ? 'Canceled'
                  : s.deliveryStatus
                  ? s.deliveryStatus.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                  : s.status.replace('_', '-').toUpperCase();

                return (
                  <tr key={s.id}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 3, height: 34, borderRadius: 2, background: indicatorColor, flexShrink: 0 }} />
                        <Link href={`/shipments/${s.id}`} className="sl-awb-number">
                          {s.awbNumber}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`sl-airport-badge ${originColor}`}>{s.originAirport?.iataCode || 'N/A'}</span>
                        <span style={{ fontSize: 12, color: '#475569' }}>{s.originAirport?.city || 'Unknown'}, {s.originAirport?.country || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`sl-airport-badge ${destColor}`}>{s.destAirport?.iataCode || 'N/A'}</span>
                        <span style={{ fontSize: 12, color: '#475569' }}>{s.destAirport?.city || 'Unknown'}, {s.destAirport?.country || 'N/A'}</span>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>{s.flight?.airplane?.flightNumber || 'N/A'}</span></td>
                    <td><span className={`sl-status-badge ${statusClass}`}>{displayStatus}</span></td>
                    <td><span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{Number(s.weightKg).toFixed(0)} kg</span></td>
                    <td><span style={{ fontSize: 11.5, color: '#64748b' }}>{new Date(s.actualDelivery || s.createdAt).toLocaleString()}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shipments.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={shipments.length}
              itemsPerPage={itemsPerPage}
              startIndex={startIndex}
            />
          )}
        </div>
      )}
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
