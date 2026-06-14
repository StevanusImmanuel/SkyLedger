'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Plane, ScrollText, Calendar, Box, User, AlertTriangle, X } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/skeletons';
import { apiFetch } from '@/lib/api-client';
import { useNotifications } from '@/components/ui/notification-provider';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { FormError } from '@/components/ui/form-error';

type Flight = {
  id: string;
  airlineId: number;
  airplaneId: number;
  originAirportId: number;
  destAirportId: number;
  departureTime: string | null;
  arrivalTime: string | null;
  status: 'scheduled' | 'departed' | 'arrived' | 'cancelled' | 'diverted';
  originAirport?: { iataCode: string; city: string } | null;
  destAirport?: { iataCode: string; city: string } | null;
};

type AssignedShipment = {
  id: string;
  awbNumber: string;
  weightKg: string;
  status: string;
  deliveryStatus: string | null;
  productType: string | null;
};

type AirplaneDetail = {
  airplaneId: number;
  flightNumber: string;
  model: string;
  capacity: number;
  maxWeightKg: string | null;
  maxVolumeM3: string | null;
  airlineId: number;
  airlineName: string;
  airlineCode: string;
  utilizedWeight: number;
  flights: Flight[];
  assignedShipments: AssignedShipment[];
};

type Airline = {
  airlineId: number;
  airlineName: string;
  airlineCode: string;
};

function getUtilizationStatus(percentage: number) {
  if (percentage <= 50) return { label: 'Low Utilization', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' };
  if (percentage <= 80) return { label: 'Normal', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' };
  if (percentage <= 95) return { label: 'High Utilization', color: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' };
  if (percentage <= 100) return { label: 'Near Capacity', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' };
  return { label: 'Over Capacity', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' };
}

export default function AirplaneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addNotification } = useNotifications();
  const airplaneId = params.id as string;

  const [airplane, setAirplane] = useState<AirplaneDetail | null>(null);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form edit states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    flightNumber: '',
    model: '',
    capacity: '',
    maxWeightKg: '',
    maxVolumeM3: '',
    airlineId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch airlines
  useEffect(() => {
    async function fetchAirlines() {
      try {
        const res = await fetch('/api/airlines');
        const json = await res.json();
        if (json.success) {
          setAirlines(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch airlines:', err);
      }
    }
    fetchAirlines();
  }, []);

  // Fetch airplane details
  useEffect(() => {
    async function fetchAirplaneDetails() {
      setIsLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/airplanes/${airplaneId}`);
        const json = await res.json();
        if (json.success) {
          setAirplane(json.data);
        } else {
          setError(json.error || 'Unable to load airplane details.');
        }
      } catch (err: any) {
        console.error('Failed to fetch airplane:', err);
        setError(err.message || 'Unable to load airplane details.');
      } finally {
        setIsLoading(false);
      }
    }

    if (airplaneId) {
      fetchAirplaneDetails();
    }
  }, [airplaneId, isSubmitting]);

  // Open edit modal
  const handleOpenEdit = () => {
    if (!airplane) return;
    setFormErrors({});
    setFormData({
      flightNumber: airplane.flightNumber,
      model: airplane.model,
      capacity: airplane.capacity.toString(),
      maxWeightKg: airplane.maxWeightKg || '',
      maxVolumeM3: airplane.maxVolumeM3 || '',
      airlineId: airplane.airlineId.toString(),
    });
    setIsEditOpen(true);
  };

  // Validate edit form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.flightNumber.trim()) errors.flightNumber = 'Flight identifier is required';
    if (!formData.model.trim()) errors.model = 'Model is required';
    
    const capacityVal = Number(formData.capacity);
    if (!formData.capacity || isNaN(capacityVal) || capacityVal <= 0) {
      errors.capacity = 'Capacity must be a positive integer';
    }

    const weightVal = Number(formData.maxWeightKg);
    if (!formData.maxWeightKg || isNaN(weightVal) || weightVal <= 0) {
      errors.maxWeightKg = 'Max weight capacity must be a positive number';
    }

    if (formData.maxVolumeM3) {
      const volVal = Number(formData.maxVolumeM3);
      if (isNaN(volVal) || volVal <= 0) {
        errors.maxVolumeM3 = 'Max volume must be a positive number';
      }
    }

    if (!formData.airlineId) errors.airlineId = 'Please select an airline';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit edits
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/airplanes/${airplaneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsEditOpen(false);
        addNotification({
          variant: 'success',
          title: 'Aircraft updated!',
          description: `All changes have been successfully applied.`,
        });
      } else {
        addNotification({
          variant: 'destructive',
          title: 'Update failed',
          description: data.error || 'An error occurred.',
        });
      }
    } catch (err: any) {
      console.error(err);
      addNotification({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete airplane
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/airplanes/${airplaneId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteOpen(false);
        addNotification({
          variant: 'success',
          title: 'Aircraft deleted!',
          description: 'Redirecting to fleet...',
        });
        router.push('/airplanes');
      } else {
        addNotification({
          variant: 'destructive',
          title: 'Deletion failed',
          description: data.error || 'An error occurred.',
        });
      }
    } catch (err: any) {
      console.error(err);
      addNotification({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6 md:p-10">
        <StatCardSkeleton />
        <div style={{ marginTop: 24 }}>
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (error || !airplane) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6 md:p-10 animate-in fade-in duration-300">
        <div className="rounded-xl border border-[#e8edf4] bg-white p-8">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', marginBottom: 16 }}>
            <AlertTriangle size={28} />
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1a2d5a' }}>Airplane details unavailable</h2>
          </div>
          <p className="mb-5 text-sm font-semibold text-[#64748b]">{error || 'Airplane details not found.'}</p>
          <Link href="/airplanes" className="inline-flex items-center gap-2 text-sm font-bold text-[#1a2d5a]">
            <ArrowLeft size={16} strokeWidth={2.4} /> Back to fleet list
          </Link>
        </div>
      </div>
    );
  }

  const maxWeight = Number(airplane.maxWeightKg || 0);
  const utilized = Number(airplane.utilizedWeight || 0);
  const remaining = maxWeight - utilized;
  const utilizationPct = maxWeight > 0 ? (utilized / maxWeight) * 100 : 0;
  const utilStatus = getUtilizationStatus(utilizationPct);

  return (
    <div className="mx-auto w-full max-w-6xl p-6 md:p-10 animate-in fade-in duration-300">
      <PageTitle title={`Aircraft ${airplane.flightNumber}`} />

      {/* Header section */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/airplanes" className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.4px] text-[#64748b] hover:text-[#1a2d5a]">
            <ArrowLeft size={15} strokeWidth={2.4} />
            Back to fleet list
          </Link>
          <div className="text-[11px] font-black uppercase tracking-widest text-[#1a2d5a]">
            Airplane Profile
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0f172a]">
            {airplane.flightNumber}
          </h1>
          <p className="mt-1 text-sm font-medium text-[#64748b]">
            Detailed airplane metrics, utilization parameters, and assigned routes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEdit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#1a2d5a] bg-white px-4 text-sm font-bold text-[#1a2d5a] hover:bg-[#f0f4ff]"
          >
            <Edit size={16} strokeWidth={2.3} /> Edit Specifications
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ef4444] px-4 text-sm font-bold text-white hover:bg-red-700"
          >
            <Trash2 size={16} strokeWidth={2.3} /> Retire Aircraft
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="sl-stat-card">
          <span className="sl-stat-label">Model</span>
          <div className="sl-stat-value" style={{ fontSize: 20, marginTop: 8 }}>{airplane.model}</div>
          <div className="sl-stat-meta neutral">{airplane.airlineName}</div>
        </div>
        <div className="sl-stat-card">
          <span className="sl-stat-label">Max Cargo Capacity</span>
          <div className="sl-stat-value" style={{ fontSize: 20, marginTop: 8 }}>{maxWeight.toLocaleString()} kg</div>
          <div className="sl-stat-meta neutral">Max Volume: {airplane.maxVolumeM3 || '—'} m³</div>
        </div>
        <div className="sl-stat-card">
          <span className="sl-stat-label">Currently Utilized</span>
          <div className="sl-stat-value" style={{ fontSize: 20, marginTop: 8, color: utilStatus.color }}>{utilized.toLocaleString()} kg</div>
          <div className="sl-stat-meta neutral">Remaining: {remaining.toLocaleString()} kg</div>
        </div>
        <div className="sl-stat-card">
          <span className="sl-stat-label">Utilization rate</span>
          <div className="sl-stat-value" style={{ fontSize: 20, marginTop: 8 }}>{utilizationPct.toFixed(1)}%</div>
          <div className="sl-stat-meta" style={{ color: utilStatus.color }}>{utilStatus.label}</div>
        </div>
      </div>

      {/* Utilization Visual Bar */}
      <div className="rounded-xl border border-[#e8edf4] bg-[#f8fafc] p-6 mb-6">
        <h3 className="text-sm font-black uppercase tracking-[0.4px] text-[#1a2d5a] mb-4">Payload Load visualization</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: '#475569' }}>
            <span>{utilStatus.label} ({utilizationPct.toFixed(1)}%)</span>
            <span>{utilized.toLocaleString()} kg / {maxWeight.toLocaleString()} kg</span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 14, background: '#e2e8f0', borderRadius: 7, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
            <div
              style={{
                width: `${Math.min(utilizationPct, 100)}%`,
                height: '100%',
                background: utilStatus.color,
                borderRadius: 7,
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginTop: 4 }}>
            <span>0% (Empty)</span>
            <span>50% (Normal)</span>
            <span>80% (High)</span>
            <span>100% (Maximum)</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        {/* Assigned Shipments */}
        <section className="rounded-xl border border-[#e8edf4] bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-[#1a2d5a]">
            <Box size={18} strokeWidth={2.4} />
            <h2 className="text-sm font-black uppercase tracking-[0.4px]">Assigned Cargo Shipments</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="sl-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 12 }}>AWB Number</th>
                  <th>Product Type</th>
                  <th>Weight (kg)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {airplane.assignedShipments.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px 12px', textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                      No shipments currently assigned to this airplane.
                    </td>
                  </tr>
                ) : (
                  airplane.assignedShipments.map((shipment) => (
                    <tr key={shipment.id} onClick={() => router.push(`/shipments/${shipment.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ paddingLeft: 12 }}>
                        <Link href={`/shipments/${shipment.id}`} className="sl-awb-number" style={{ fontWeight: 800 }}>
                          {shipment.awbNumber}
                        </Link>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>
                          {shipment.productType || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                          {Number(shipment.weightKg).toLocaleString()} kg
                        </span>
                      </td>
                      <td>
                        <span
                          className={`sl-status-badge ${
                            shipment.status === 'closed'
                              ? 'sl-badge-closed'
                              : shipment.status === 'delivered'
                              ? 'sl-badge-ontime'
                              : shipment.status === 'delayed' || shipment.status === 'cancelled'
                              ? 'sl-badge-delayed'
                              : shipment.status === 'pending' || shipment.status === 'processing'
                              ? 'sl-badge-manifested'
                              : 'sl-badge-intransit'
                          }`}
                        >
                          {shipment.deliveryStatus || shipment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Airplane Flights */}
        <section className="rounded-xl border border-[#e8edf4] bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-[#1a2d5a]">
            <ScrollText size={18} strokeWidth={2.4} />
            <h2 className="text-sm font-black uppercase tracking-[0.4px]">Assigned Routes / Flights</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="sl-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 12 }}>Flight ID</th>
                  <th>Sector</th>
                  <th>Departure Time</th>
                  <th>Arrival Time</th>
                  <th>Flight Status</th>
                </tr>
              </thead>
              <tbody>
                {airplane.flights.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px 12px', textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                      No flights records found for this airplane.
                    </td>
                  </tr>
                ) : (
                  airplane.flights.map((flight) => (
                    <tr key={flight.id}>
                      <td style={{ paddingLeft: 12 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>
                          {flight.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1a2d5a' }}>
                          {flight.originAirport?.iataCode || '—'} → {flight.destAirport?.iataCode || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {flight.departureTime ? new Date(flight.departureTime).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {flight.arrivalTime ? new Date(flight.arrivalTime).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`sl-status-badge ${
                            flight.status === 'arrived'
                              ? 'sl-badge-ontime'
                              : flight.status === 'cancelled'
                              ? 'sl-badge-delayed'
                              : 'sl-badge-manifested'
                          }`}
                        >
                          {flight.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Edit Specifications Modal */}
      {isEditOpen && (
        <div
          role="presentation"
          onClick={() => setIsEditOpen(false)}
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
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
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
                alignItems: 'center',
                justifyContent: 'between',
                padding: '20px 22px',
                borderBottom: '1px solid #f0f4f8',
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
                  Update plane details
                </div>
                <h2 style={{ margin: 0, fontSize: 20, color: '#1a2d5a', fontWeight: 800 }}>
                  Edit Specifications
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#f8fafc',
                  color: '#64748b',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="sl-field-label">Flight Number / Identifier *</label>
                  <input
                    type="text"
                    className="sl-field-input"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                  />
                  <FormError message={formErrors.flightNumber || ''} />
                </div>

                <div>
                  <label className="sl-field-label">Model *</label>
                  <input
                    type="text"
                    className="sl-field-input"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                  <FormError message={formErrors.model || ''} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="sl-field-label">Airline *</label>
                    <select
                      className="sl-filter-sel"
                      value={formData.airlineId}
                      onChange={(e) => setFormData({ ...formData, airlineId: e.target.value })}
                      style={{ width: '100%', height: '42px' }}
                    >
                      {airlines.map((airline) => (
                        <option key={airline.airlineId} value={airline.airlineId}>
                          {airline.airlineName} ({airline.airlineCode})
                        </option>
                      ))}
                    </select>
                    <FormError message={formErrors.airlineId || ''} />
                  </div>

                  <div>
                    <label className="sl-field-label">Capacity (Passengers) *</label>
                    <input
                      type="number"
                      className="sl-field-input"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                    <FormError message={formErrors.capacity || ''} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="sl-field-label">Cargo Max Weight (kg) *</label>
                    <input
                      type="number"
                      className="sl-field-input"
                      value={formData.maxWeightKg}
                      onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
                    />
                    <FormError message={formErrors.maxWeightKg || ''} />
                  </div>

                  <div>
                    <label className="sl-field-label">Cargo Max Volume (m³ - Optional)</label>
                    <input
                      type="number"
                      className="sl-field-input"
                      value={formData.maxVolumeM3}
                      onChange={(e) => setFormData({ ...formData, maxVolumeM3: e.target.value })}
                    />
                    <FormError message={formErrors.maxVolumeM3 || ''} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, borderTop: '1px solid #f0f4f8', paddingTop: 18 }}>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="sl-btn-cancel"
                  style={{ width: 'auto', padding: '10px 24px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="sl-btn-save"
                  style={{ width: 'auto', padding: '10px 28px' }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Retire Aircraft"
        description={`Are you sure you want to retire and delete airplane ${airplane.flightNumber}? This operation cannot be undone.`}
        confirmText="Confirm Deletion"
        cancelText="Cancel"
        variant="delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
