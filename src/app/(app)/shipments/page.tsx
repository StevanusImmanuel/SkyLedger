'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Pagination } from '@/components/ui/Pagination';
import { ShipmentTableSkeleton, StatCardSkeleton } from '@/components/ui/skeletons';
import { MenuItem, MenuContainer } from '@/components/ui/fluid-menu';
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/utils/export';
import { useNotifications } from '@/components/ui/notification-provider';

type Shipment = {
  id: string;
  awbNumber: string;
  originAirport: { iataCode: string; name: string; city: string; country: string } | null;
  destAirport: { iataCode: string; name: string; city: string; country: string } | null;
  flight: { flightId: string } | null;
  priority: 'standard' | 'express' | 'critical';
  status: 'pending' | 'processing' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  deliveryStatus: 'booked' | 'received_at_warehouse' | 'security_cleared' | 'manifested' | 'departed' | 'transshipment' | 'arrived_at_destination' | 'out_for_delivery' | 'ready_for_pickup' | 'delivered' | null;
  weightKg: string;
  productType: string | null;
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

const statusIndicatorMap: Record<string, string> = {
  delayed: '#ef4444',
  in_transit: '#0ea5e9',
  pending: '#8b5cf6',
  processing: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
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

function ShipmentsContent() {
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    active: 0,
    activePercentage: 0,
    arrived: 0,
    arrivedPercentage: 0,
    totalWeight: 0,
  });
  const itemsPerPage = 6;
  const debouncedSearch = useDebounce(search, 800);
  const router = useRouter();
  const { addNotification } = useNotifications();

  const handleDelete = async (shipmentId: string) => {
    if (!confirm('Are you sure you want to delete this shipment?')) {
      return;
    }

    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        addNotification({
          variant: 'success',
          title: 'Shipment deleted successfully!',
          description: 'The shipment has been removed from the system.',
        });
        // Refresh the shipments list
        window.location.reload();
      } else {
        addNotification({
          variant: 'destructive',
          title: 'Failed to delete shipment',
          description: data.error || 'An error occurred while deleting the shipment.',
        });
      }
    } catch (error) {
      console.error('Failed to delete shipment:', error);
      addNotification({
        variant: 'destructive',
        title: 'Failed to delete shipment',
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };

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

          // Calculate stats from all shipments (not just current page)
          const allShipmentsRes = await fetch('/api/shipments?limit=1000');
          const allShipmentsJson = await allShipmentsRes.json();

          if (allShipmentsJson.success) {
            const allShipments = allShipmentsJson.data;

            // Active: before Post-Flight (pending, processing, in_transit)
            const activeShipments = allShipments.filter((s: Shipment) =>
              ['pending', 'processing', 'in_transit'].includes(s.status)
            );
            const activeCount = activeShipments.length;

            // Arrived: Post-Flight statuses (arrived_at_destination, out_for_delivery, ready_for_pickup, delivered)
            const arrivedShipments = allShipments.filter((s: Shipment) =>
              s.deliveryStatus && ['arrived_at_destination', 'out_for_delivery', 'ready_for_pickup', 'delivered'].includes(s.deliveryStatus)
            );
            const arrivedCount = arrivedShipments.length;

            // Total weight of active shipments
            const totalWeight = activeShipments.reduce((sum: number, s: Shipment) =>
              sum + Number(s.weightKg), 0
            );

            // Calculate percentages (compare to total)
            const totalCount = allShipments.length;
            const activePercentage = totalCount > 0 ? ((activeCount / totalCount) * 100) : 0;
            const arrivedPercentage = totalCount > 0 ? ((arrivedCount / totalCount) * 100) : 0;

            setStats({
              active: activeCount,
              activePercentage: Math.round(activePercentage),
              arrived: arrivedCount,
              arrivedPercentage: Math.round(arrivedPercentage),
              totalWeight: Math.round(totalWeight),
            });
          }
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
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 className="sl-page-title">Active Manifests</h1>
        <p className="sl-page-subtitle">Monitoring 24/7 active live-shipments across global routes.</p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Active</span>
            </div>
            <div className="sl-stat-value" style={{ fontSize: 32 }}>{stats.active}</div>
            <div className="sl-stat-meta up">↑ +{stats.activePercentage}%</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Arrived</span>
            </div>
            <div className="sl-stat-value" style={{ fontSize: 32 }}>{stats.arrived.toString().padStart(2, '0')}</div>
            <div className="sl-stat-meta up">↑ +{stats.arrivedPercentage}%</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-header">
              <span className="sl-stat-label">Product Weight</span>
            </div>
            <div className="sl-stat-value" style={{ fontSize: 32 }}>{(stats.totalWeight / 1000).toFixed(1)}<span className="unit">T</span></div>
            <div className="sl-stat-meta neutral">— Active Total</div>
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
                <th>Product Type</th>
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
                const statusKey = s.deliveryStatus || s.status;
                const statusClass = statusClassMap[statusKey] || 'sl-badge-manifested';
                const indicatorColor = statusIndicatorMap[statusKey] || '#8b5cf6';
                const destColor = airportColorMap[s.destAirport?.iataCode || ''] || 'blue';

                // Format delivery status for display
                const displayStatus = s.deliveryStatus
                  ? s.deliveryStatus.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                  : s.status.replace('_', '-').toUpperCase();

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
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>{s.productType || 'N/A'}</span>
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
                        <span className={`sl-status-badge ${statusClass}`}>{displayStatus}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <MenuContainer>
                          <MenuItem
                            icon={<MoreVertical size={18} strokeWidth={1.5} />}
                          />
                          <MenuItem
                            icon={<Edit size={18} strokeWidth={1.5} />}
                            onClick={() => router.push(`/shipments/${s.id}/edit`)}
                          />
                          <MenuItem
                            icon={<Trash2 size={18} strokeWidth={1.5} />}
                            onClick={() => handleDelete(s.id)}
                          />
                        </MenuContainer>
                      </div>
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
    <Suspense fallback={<ShipmentTableSkeleton rows={10} />}>
      <ShipmentsContent />
    </Suspense>
  );
}
