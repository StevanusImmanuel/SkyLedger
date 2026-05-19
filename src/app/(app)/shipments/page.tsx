'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Pagination } from '@/components/ui/Pagination';
import { ShipmentTableSkeleton, StatCardSkeleton } from '@/components/ui/skeletons';

type Shipment = {
  id: string;
  awbNumber: string;
  originAirport: { iataCode: string; name: string; city: string; country: string } | null;
  destAirport: { iataCode: string; name: string; city: string; country: string } | null;
  flight: { flightId: string } | null;
  priority: 'standard' | 'express' | 'critical';
  status: 'pending' | 'processing' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  weightKg: string;
  createdAt: string;
};

const priorityColor: Record<string, string> = {
  CRITICAL: '#fee2e2',
  CRITICALTEXT: '#b91c1c',
  EXPRESS: '#fef3c7',
  EXPRESSTEXT: '#b45309',
  STANDARD: '#dbeafe',
  STANDARDTEXT: '#1d4ed8',
};

const statusClassMap: Record<string, string> = {
  delayed: 'sl-badge-delayed',
  in_transit: 'sl-badge-intransit',
  pending: 'sl-badge-manifested',
  processing: 'sl-badge-manifested',
  delivered: 'sl-badge-ontime',
  cancelled: 'sl-badge-delayed',
};

const statusIndicatorMap: Record<string, string> = {
  delayed: '#ef4444',
  in_transit: '#0ea5e9',
  pending: '#8b5cf6',
  processing: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const airportColorMap: Record<string, string> = {
  LHR: 'blue', JFK: 'green', SIN: 'orange', NRT: 'purple',
  CDG: 'orange', FRA: 'purple', DXB: 'red', SYD: 'green',
  HKG: 'blue', LAX: 'purple',
};

function ShipmentsContent() {
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const debouncedSearch = useDebounce(search, 800); // Increased from 500ms to 800ms

  useEffect(() => {
    async function fetchShipments() {
      setIsLoading(true);
      try {
        const offset = (currentPage - 1) * itemsPerPage;
        const params = new URLSearchParams({
          limit: String(itemsPerPage),
          offset: String(offset),
        });
        if (debouncedSearch) {
          params.set('search', debouncedSearch);
        }
        const res = await fetch(`/api/shipments?${params}`);
        const json = await res.json();
        console.log('Shipments API response:', json);
        if (json.success) {
          setShipments(json.data);
          setTotal(json.total);
        } else {
          console.error('Shipments API error:', json.error);
        }
      } catch (err) {
        console.error('Failed to fetch shipments:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchShipments();
  }, [currentPage, debouncedSearch]);

  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div>
      {/* Search + Flight Status Nav */}
      <div className="sl-shipment-nav">
        <div className="sl-awb-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Track AWB Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sl-flight-status-tab">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
          Flight Status
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            Filter
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 className="sl-page-title">Active Manifests</h1>
        <p className="sl-page-subtitle">Monitoring 248 active live-shipments across global routes.</p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Active</span>
            </div>
            <div className="sl-stat-value" style={{ fontSize: 32 }}>{shipments.filter(s => s.status === 'in_transit').length}</div>
            <div className="sl-stat-meta up">↑ +18%</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Delayed</span>
            </div>
            <div className="sl-stat-value" style={{ fontSize: 32, color: '#ef4444' }}>{shipments.filter(s => s.status === 'delayed').length.toString().padStart(2, '0')}</div>
            <div className="sl-stat-meta" style={{ color: '#ef4444', fontWeight: 600 }}>↓ -4%</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Priority Weight</span>
            </div>
            <div className="sl-stat-value" style={{ fontSize: 32 }}>{shipments.filter(s => s.priority === 'critical' || s.priority === 'express').length}</div>
            <div className="sl-stat-meta neutral">— Planned</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Total Tonnage</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
            </div>
            <div className="sl-stat-value" style={{ fontSize: 32 }}>{Math.round(shipments.reduce((sum, s) => sum + Number(s.weightKg), 0) / 1000)}<span className="unit">T</span></div>
          </div>
        </div>
      )}

      {/* Shipments Table */}
      {isLoading ? (
        <ShipmentTableSkeleton rows={6} />
      ) : (
        <div className="sl-awb-table-container">
          <table className="sl-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>AWB Number</th>
                <th>Destination</th>
                <th>Flight ID</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => {
                const pKey = s.priority.toUpperCase();
                const bgColor = priorityColor[pKey] || '#f1f5f9';
                const textColor = priorityColor[`${pKey}TEXT`] || '#475569';
                const statusClass = statusClassMap[s.status] || 'sl-badge-manifested';
                const indicatorColor = statusIndicatorMap[s.status] || '#8b5cf6';
                const destColor = airportColorMap[s.destAirport?.iataCode || ''] || 'blue';

                return (
                  <tr key={s.id} style={{ cursor: 'pointer' }}>
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 3, height: 34, borderRadius: 2, background: indicatorColor, flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: 12, color: '#1a2d5a' }}>{s.awbNumber}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`sl-airport-badge ${destColor}`}>{s.destAirport?.iataCode || 'N/A'}</span>
                        <span style={{ fontSize: 12, color: '#475569' }}>{s.destAirport?.city || 'Unknown'}, {s.destAirport?.country || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>{s.flight?.flightId || 'N/A'}</span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
                        borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                        background: bgColor, color: textColor,
                      }}>
                        {s.priority.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: indicatorColor }} />
                        <span className={`sl-status-badge ${statusClass}`}>{s.status.replace('_', '-').toUpperCase()}</span>
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/shipments/${s.id}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, color: '#94a3b8', borderRadius: 6,
                          border: '1px solid #e2e8f0', background: '#fff', textDecoration: 'none',
                        }}
                        title="View Detail"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={total}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
          />
        </div>
      )}

      {/* Bottom Cards (Manifest Loading) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Manifest Loading', time: 'Bay 01 • 11:30 AM', color: '#dbeafe', icon: '📦' },
          { label: 'Manifest Loading', time: 'Bay 04 • 12:15 AM', color: '#dcfce7', icon: '📦' },
          { label: 'Manifest Loading', time: 'Bay 07 • 01:00 PM', color: '#fef3c7', icon: '📦' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: card.color, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{card.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{card.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* New Shipment Button */}
      <Link
        href="/shipments/new"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#1a2d5a', color: '#fff', border: 'none', borderRadius: 8,
          padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          textDecoration: 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        New Shipment
      </Link>
    </div>
  );
}

export default function ShipmentsPage() {
  return (
    <Suspense fallback={<ShipmentTableSkeleton rows={6} />}>
      <ShipmentsContent />
    </Suspense>
  );
}
