'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Pagination } from '@/components/ui/Pagination';
import { ShipmentTableSkeleton, StatCardSkeleton } from '@/components/ui/skeletons';
import { MenuItem, MenuContainer } from '@/components/ui/fluid-menu';
import { MoreVertical, Eye, Edit, Trash2, X } from 'lucide-react';
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
  notes: string | null;
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

function formatShipmentStatus(shipment: Shipment) {
  return shipment.deliveryStatus
    ? shipment.deliveryStatus.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : shipment.status.replace('_', '-').toUpperCase();
}

function formatShipmentDate(date: string) {
  return new Date(date).toLocaleString();
}

function getShipmentPartyName(notes: string | null, label: 'Sender' | 'Receiver') {
  if (!notes) return 'N/A';

  const match = notes.match(
    new RegExp(`(?:^|,\\s*)${label}:\\s*([\\s\\S]*?)(?=,\\s*(?:Sender|Receiver|Tel|Origin|Dest|Delivery|Fee|Weight Unit):|$)`, 'i')
  );

  return match?.[1]?.trim() || 'N/A';
}

function ShipmentsContent() {
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
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
  const selectedStatusKey = selectedShipment ? selectedShipment.deliveryStatus || selectedShipment.status : '';
  const selectedStatusClass = selectedStatusKey ? statusClassMap[selectedStatusKey] || 'sl-badge-manifested' : '';
  const selectedIndicatorColor = selectedStatusKey ? statusIndicatorMap[selectedStatusKey] || '#8b5cf6' : '#8b5cf6';
  const selectedPriorityKey = selectedShipment?.priority.toUpperCase() || '';
  const selectedPriorityBg = priorityColor[selectedPriorityKey] || '#f1f5f9';
  const selectedPriorityText = priorityColor[`${selectedPriorityKey}TEXT`] || '#475569';

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
        <div className="sl-awb-table-container" style={{ overflowX: 'auto' }}>
          <table className="sl-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>AWB Number</th>
                <th>Sender Name</th>
                <th>Receiver Name</th>
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
                const senderName = getShipmentPartyName(s.notes, 'Sender');
                const receiverName = getShipmentPartyName(s.notes, 'Receiver');

                const displayStatus = formatShipmentStatus(s);

                return (
                  <tr
                    key={s.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedShipment(s)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedShipment(s);
                      }
                    }}
                  >
                    <td style={{ paddingLeft: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 3, height: 34, borderRadius: 2, background: indicatorColor, flexShrink: 0 }} />
                        <Link
                          href={`/shipments/${s.id}`}
                          className="sl-awb-number"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {s.awbNumber}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <span
                        title={senderName}
                        style={{ display: 'block', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12.5, fontWeight: 600, color: '#475569' }}
                      >
                        {senderName}
                      </span>
                    </td>
                    <td>
                      <span
                        title={receiverName}
                        style={{ display: 'block', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12.5, fontWeight: 600, color: '#475569' }}
                      >
                        {receiverName}
                      </span>
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
                      <div
                        style={{ display: 'flex', justifyContent: 'center' }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MenuContainer>
                          <MenuItem
                            icon={<MoreVertical size={18} strokeWidth={1.5} />}
                          />
                          <MenuItem
                            icon={<Eye size={18} strokeWidth={1.5} />}
                            onClick={() => setSelectedShipment(s)}
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

      {selectedShipment && (
        <div
          role="presentation"
          onClick={() => setSelectedShipment(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(15, 23, 42, 0.38)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shipment-detail-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(760px, 100%)',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#fff',
              border: '1px solid #e8edf4',
              borderRadius: 14,
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.24)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                padding: '20px 22px',
                borderBottom: '1px solid #f0f4f8',
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                  Shipment Detail
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 4, height: 38, borderRadius: 4, background: selectedIndicatorColor }} />
                  <div>
                    <h2 id="shipment-detail-title" style={{ margin: 0, fontSize: 22, lineHeight: 1.1, color: '#1a2d5a', fontWeight: 800 }}>
                      {selectedShipment.awbNumber}
                    </h2>
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className={`sl-status-badge ${selectedStatusClass}`}>{formatShipmentStatus(selectedShipment)}</span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 9px',
                        borderRadius: 20,
                        fontSize: 10.5,
                        fontWeight: 700,
                        background: selectedPriorityBg,
                        color: selectedPriorityText,
                      }}>
                        {selectedShipment.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close shipment detail"
                onClick={() => setSelectedShipment(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#f8fafc',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <X size={17} strokeWidth={2.2} />
              </button>
            </div>

            <div style={{ padding: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
                <div style={{ border: '1px solid #e8edf4', borderRadius: 10, padding: 14, background: '#f8fafc' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Origin</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`sl-airport-badge ${airportColorMap[selectedShipment.originAirport?.iataCode || ''] || 'blue'}`}>
                      {selectedShipment.originAirport?.iataCode || 'N/A'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      {selectedShipment.originAirport?.city || 'Unknown'}, {selectedShipment.originAirport?.country || 'N/A'}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>{selectedShipment.originAirport?.name || 'No airport data'}</div>
                </div>

                <div style={{ border: '1px solid #e8edf4', borderRadius: 10, padding: 14, background: '#f8fafc' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Destination</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`sl-airport-badge ${airportColorMap[selectedShipment.destAirport?.iataCode || ''] || 'blue'}`}>
                      {selectedShipment.destAirport?.iataCode || 'N/A'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      {selectedShipment.destAirport?.city || 'Unknown'}, {selectedShipment.destAirport?.country || 'N/A'}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>{selectedShipment.destAirport?.name || 'No airport data'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Product</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{selectedShipment.productType || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Weight</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{Number(selectedShipment.weightKg).toFixed(0)} kg</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Flight</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{selectedShipment.flight?.flightId || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Created</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{formatShipmentDate(selectedShipment.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
