'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Pagination } from '@/components/ui/Pagination';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/skeletons';
import { MenuItem, MenuContainer } from '@/components/ui/fluid-menu';
import { MoreVertical, Eye, Edit, Trash2, X, Plus, Plane } from 'lucide-react';
import { useNotifications } from '@/components/ui/notification-provider';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { PageTitle } from '@/components/ui/page-title';
import { apiFetch } from '@/lib/api-client';
import { FormError } from '@/components/ui/form-error';

type Airplane = {
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

function FleetContent() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [airplanes, setAirplanes] = useState<Airplane[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAirlineFilter, setSelectedAirlineFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAirplane, setSelectedAirplane] = useState<Airplane | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    flightNumber: '',
    model: '',
    capacity: '',
    maxWeightKg: '',
    maxVolumeM3: '',
    airlineId: '',
  });

  // Delete modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [airplaneToDelete, setAirplaneToDelete] = useState<Airplane | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10;
  const debouncedSearch = useDebounce(search, 500);

  // Stats
  const [stats, setStats] = useState({
    totalPlanes: 0,
    totalCapacityKg: 0,
    totalUtilizedKg: 0,
    overallUtilizationPct: 0,
  });

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

  // Fetch airplanes and calculate stats
  useEffect(() => {
    async function fetchAirplanes() {
      setIsTableLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedAirlineFilter !== 'all') {
          params.set('airlineId', selectedAirlineFilter);
        }
        const res = await apiFetch(`/api/airplanes?${params}`);
        const json = await res.json();
        if (json.success) {
          let data: Airplane[] = json.data;
          
          // Apply local client search if any
          if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase();
            data = data.filter(
              p =>
                p.flightNumber.toLowerCase().includes(query) ||
                p.model.toLowerCase().includes(query)
            );
          }

          setAirplanes(data);

          // Calculate stats
          const totalPlanes = data.length;
          const totalCapacityKg = data.reduce((sum, p) => sum + Number(p.maxWeightKg || 0), 0);
          const totalUtilizedKg = data.reduce((sum, p) => sum + Number(p.utilizedWeight || 0), 0);
          const overallUtilizationPct = totalCapacityKg > 0 ? (totalUtilizedKg / totalCapacityKg) * 100 : 0;

          setStats({
            totalPlanes,
            totalCapacityKg,
            totalUtilizedKg,
            overallUtilizationPct,
          });
        } else {
          setError(json.error || 'Failed to fetch airplanes');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch airplanes');
      } finally {
        setIsTableLoading(false);
        setIsLoading(false);
      }
    }
    fetchAirplanes();
  }, [selectedAirlineFilter, debouncedSearch, refreshTrigger]);

  // Handle page changes
  const paginatedAirplanes = airplanes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(airplanes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const handlePageChange = (page: number) => {
    setIsTableLoading(true);
    setCurrentPage(page);
    setTimeout(() => setIsTableLoading(false), 200);
  };

  // Open create form
  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedAirplane(null);
    setFormErrors({});
    setFormData({
      flightNumber: '',
      model: '',
      capacity: '200', // default passengers capacity
      maxWeightKg: '',
      maxVolumeM3: '',
      airlineId: airlines[0]?.airlineId.toString() || '',
    });
    setIsFormOpen(true);
  };

  // Open edit form
  const handleOpenEdit = (plane: Airplane) => {
    setIsEditing(true);
    setSelectedAirplane(plane);
    setFormErrors({});
    setFormData({
      flightNumber: plane.flightNumber,
      model: plane.model,
      capacity: plane.capacity.toString(),
      maxWeightKg: plane.maxWeightKg || '',
      maxVolumeM3: plane.maxVolumeM3 || '',
      airlineId: plane.airlineId.toString(),
    });
    setIsFormOpen(true);
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Airline is always required (it's the only editable field when editing).
    if (!formData.airlineId) errors.airlineId = 'Please select an airline';

    // When editing, every field except the airline is read-only, so skip their validation.
    if (!isEditing) {
      if (!formData.model.trim()) errors.model = 'Model is required';

      const capacityVal = Number(formData.capacity);
      if (!formData.capacity || !Number.isInteger(capacityVal) || capacityVal <= 0) {
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
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = isEditing ? `/api/airplanes/${selectedAirplane?.airplaneId}` : '/api/airplanes';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsFormOpen(false);
        addNotification({
          variant: 'success',
          title: isEditing ? 'Aircraft updated!' : 'Aircraft added!',
          description: `Airplane identifier: ${formData.flightNumber}`,
        });
        setRefreshTrigger(prev => prev + 1);
      } else {
        addNotification({
          variant: 'destructive',
          title: 'Operation failed',
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

  // Delete Airplane
  const handleOpenDelete = (plane: Airplane) => {
    setAirplaneToDelete(plane);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!airplaneToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/airplanes/${airplaneToDelete.airplaneId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteOpen(false);
        setAirplaneToDelete(null);
        addNotification({
          variant: 'success',
          title: 'Aircraft deleted!',
          description: 'The airplane record has been deleted.',
        });
        setRefreshTrigger(prev => prev + 1);
      } else {
        addNotification({
          variant: 'destructive',
          title: 'Failed to delete aircraft',
          description: data.error || 'An error occurred while deleting the aircraft.',
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

  return (
    <div>
      <PageTitle title="Fleet Management" />

      {/* Navigation and Search */}
      <div className="sl-shipment-nav" style={{ marginBottom: 16 }}>
        <div className="sl-awb-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search Flight Number, Model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            className="sl-filter-sel"
            value={selectedAirlineFilter}
            onChange={(e) => {
              setSelectedAirlineFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ height: '36px', minWidth: '160px' }}
          >
            <option value="all">All Airlines</option>
            {airlines.map(airline => (
              <option key={airline.airlineId} value={airline.airlineId}>
                {airline.airlineCode} - {airline.airlineName}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#1a2d5a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0 18px',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              height: '36px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            <Plus size={14} strokeWidth={2.5} /> Add Aircraft
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 className="sl-page-title">Fleet Management</h1>
        <p className="sl-page-subtitle">Configure air cargo limits, check utilized payload, and manage airplanes.</p>
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
            <div className="sl-stat-label">Total Aircraft</div>
            <div className="sl-stat-value" style={{ fontSize: 32 }}>{stats.totalPlanes.toString().padStart(2, '0')}</div>
            <div className="sl-stat-meta neutral">— Active planes in hub</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-label">Total Fleet Capacity</div>
            <div className="sl-stat-value" style={{ fontSize: 32 }}>
              {(stats.totalCapacityKg / 1000).toFixed(1)}<span className="unit">T</span>
            </div>
            <div className="sl-stat-meta neutral">— Maximum payload limit</div>
          </div>
          <div className="sl-stat-card">
            <div className="sl-stat-label">Overall Fleet Utilization</div>
            <div className="sl-stat-value" style={{ fontSize: 32 }}>
              {stats.overallUtilizationPct.toFixed(1)}%
            </div>
            <div className="sl-stat-meta neutral">
              {stats.totalUtilizedKg.toLocaleString()} / {stats.totalCapacityKg.toLocaleString()} kg
            </div>
          </div>
        </div>
      )}

      {/* Airplanes Table */}
      {error ? (
        <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            Fleet Data Load Error
          </div>
          <div style={{ color: '#475569', fontSize: 12.5, fontWeight: 600, marginBottom: 16 }}>
            {error}
          </div>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="sl-btn-save"
            style={{ display: 'inline-block', width: 'auto', padding: '10px 24px' }}
          >
            Retry Loading
          </button>
        </div>
      ) : isTableLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="sl-awb-table-container" style={{ overflowX: 'auto' }}>
          <table className="sl-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Flight Number</th>
                <th>Model</th>
                <th>Airline</th>
                <th>Capacity (Pax)</th>
                <th>Max Weight</th>
                <th>Max Volume</th>
                <th>Capacity Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAirplanes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '28px 20px', textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                    No aircraft found in fleet.
                  </td>
                </tr>
              ) : (
                paginatedAirplanes.map((plane) => {
                  const maxWeight = Number(plane.maxWeightKg || 0);
                  const utilized = Number(plane.utilizedWeight || 0);
                  const utilizationPct = maxWeight > 0 ? (utilized / maxWeight) * 100 : 0;
                  const utilStatus = getUtilizationStatus(utilizationPct);

                  return (
                    <tr
                      key={plane.airplaneId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/airplanes/${plane.airplaneId}`)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          router.push(`/airplanes/${plane.airplaneId}`);
                        }
                      }}
                    >
                      <td style={{ paddingLeft: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 3, height: 34, borderRadius: 2, background: utilStatus.color, flexShrink: 0 }} />
                          <span className="sl-awb-number" style={{ fontSize: 13, fontWeight: 800 }}>
                            {plane.flightNumber}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>
                          {plane.model}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="sl-airport-badge blue">{plane.airlineCode}</span>
                          <span style={{ fontSize: 12, color: '#475569' }}>{plane.airlineName}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>
                          {plane.capacity} Pax
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>
                          {maxWeight.toLocaleString()} kg
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>
                          {plane.maxVolumeM3 ? `${Number(plane.maxVolumeM3).toLocaleString()} m³` : '—'}
                        </span>
                      </td>
                      <td style={{ minWidth: 200 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#475569' }}>
                            <span>{utilizationPct.toFixed(0)}%</span>
                            <span>{utilized.toLocaleString()} / {maxWeight.toLocaleString()} kg</span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(utilizationPct, 100)}%`,
                                height: '100%',
                                background: utilStatus.color,
                                borderRadius: 3,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: utilStatus.bg,
                            color: utilStatus.color,
                            border: `1px solid ${utilStatus.border}`
                          }}
                        >
                          {utilStatus.label}
                        </span>
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
                              onClick={() => router.push(`/airplanes/${plane.airplaneId}`)}
                            />
                            <MenuItem
                              icon={<Edit size={18} strokeWidth={1.5} />}
                              onClick={() => handleOpenEdit(plane)}
                            />
                            <MenuItem
                              icon={<Trash2 size={18} strokeWidth={1.5} />}
                              onClick={() => handleOpenDelete(plane)}
                            />
                          </MenuContainer>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {airplanes.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={airplanes.length}
              itemsPerPage={itemsPerPage}
              startIndex={startIndex}
            />
          )}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <div
          role="presentation"
          onClick={() => setIsFormOpen(false)}
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
                  {isEditing ? 'Update Plane Info' : 'Fleet Operations'}
                </div>
                <h2 style={{ margin: 0, fontSize: 20, color: '#1a2d5a', fontWeight: 800 }}>
                  {isEditing ? `Edit Airplane ${formData.flightNumber}` : 'Register New Airplane'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
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

            <form onSubmit={handleFormSubmit} style={{ padding: 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {isEditing && (
                  <div style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1a2d5a' }}>
                    Only the airline can be changed. All other aircraft specifications are read-only.
                  </div>
                )}
                <div>
                  <label className="sl-field-label">Flight Number / Identifier</label>
                  <input
                    type="text"
                    className="sl-field-input"
                    placeholder="Auto-generated from airline code"
                    value={formData.flightNumber}
                    readOnly
                    style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
                  />
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>
                    {isEditing ? 'Flight number cannot be changed.' : 'Generated automatically from the selected airline code on save.'}
                  </p>
                </div>

                <div>
                  <label className="sl-field-label">Model{isEditing ? '' : ' *'}</label>
                  <input
                    type="text"
                    className="sl-field-input"
                    placeholder="e.g. Boeing 737-800F, Airbus A330"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    readOnly={isEditing}
                    style={isEditing ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : undefined}
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
                      <option value="">Select Airline</option>
                      {airlines.map((airline) => (
                        <option key={airline.airlineId} value={airline.airlineId}>
                          {airline.airlineName} ({airline.airlineCode})
                        </option>
                      ))}
                    </select>
                    <FormError message={formErrors.airlineId || ''} />
                  </div>

                  <div>
                    <label className="sl-field-label">Capacity (Passengers){isEditing ? '' : ' *'}</label>
                    <input
                      type="number"
                      className="sl-field-input"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      readOnly={isEditing}
                      style={isEditing ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : undefined}
                    />
                    <FormError message={formErrors.capacity || ''} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="sl-field-label">Cargo Max Weight (kg){isEditing ? '' : ' *'}</label>
                    <input
                      type="number"
                      className="sl-field-input"
                      placeholder="e.g. 15000"
                      value={formData.maxWeightKg}
                      onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
                      readOnly={isEditing}
                      style={isEditing ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : undefined}
                    />
                    <FormError message={formErrors.maxWeightKg || ''} />
                  </div>

                  <div>
                    <label className="sl-field-label">Cargo Max Volume (m³{isEditing ? '' : ' - Optional'})</label>
                    <input
                      type="number"
                      className="sl-field-input"
                      placeholder="e.g. 120"
                      value={formData.maxVolumeM3}
                      onChange={(e) => setFormData({ ...formData, maxVolumeM3: e.target.value })}
                      readOnly={isEditing}
                      style={isEditing ? { background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' } : undefined}
                    />
                    <FormError message={formErrors.maxVolumeM3 || ''} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, borderTop: '1px solid #f0f4f8', paddingTop: 18 }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
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
                  {isSubmitting ? 'Processing...' : isEditing ? 'Save Changes' : 'Create Airplane'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setAirplaneToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Aircraft Deletion"
        description={
          airplaneToDelete
            ? `Are you sure you want to delete airplane ${airplaneToDelete.flightNumber} (${airplaneToDelete.model})? All flights associated with this plane will be checked.`
            : 'Are you sure you want to delete this aircraft?'
        }
        confirmText="Delete Aircraft"
        cancelText="Cancel"
        variant="delete"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <FleetContent />
    </Suspense>
  );
}
