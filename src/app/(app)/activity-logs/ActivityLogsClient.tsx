'use client';

import { useState, useEffect } from 'react';
import { Calendar, Search, Filter, RefreshCw, Download, User, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/ui/page-title';
import { apiFetch } from '@/lib/api-client';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function ActivityLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (action) params.append('action', action);
      if (entityType) params.append('entityType', entityType);
      if (search) params.append('search', search);

      const response = await apiFetch(`/api/activity-logs?${params}`);
      const data = await response.json();

      if (response.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, startDate, endDate, action, entityType, search]);

  if (accessDenied) {
    return (
      <div style={{ padding: '24px 28px' }}>
        <div style={{
          background: '#fff',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#991b1b', marginBottom: '8px' }}>
            Access Denied
          </h2>
          <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '24px' }}>
            You do not have permission to access this page. Only administrators can view activity logs.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '10px 24px',
              background: '#1a2d5a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setAction('');
    setEntityType('');
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case 'login': return { background: '#dbeafe', color: '#1d4ed8' };
      case 'logout': return { background: '#f1f5f9', color: '#64748b' };
      case 'create': return { background: '#dcfce7', color: '#15803d' };
      case 'update': return { background: '#fef3c7', color: '#b45309' };
      case 'delete': return { background: '#fee2e2', color: '#b91c1c' };
      case 'search': return { background: '#f3e8ff', color: '#7e22ce' };
      case 'export': return { background: '#e0f2fe', color: '#0369a1' };
      case 'view': return { background: '#dbeafe', color: '#1e40af' };
      default: return { background: '#f1f5f9', color: '#64748b' };
    }
  };

  const getEntityBadgeStyle = (entityType: string) => {
    switch (entityType) {
      case 'shipment': return { background: '#ffedd5', color: '#c2410c' };
      case 'user': return { background: '#fce7f3', color: '#be185d' };
      case 'report': return { background: '#ccfbf1', color: '#0f766e' };
      case 'auth': return { background: '#f3e8ff', color: '#7e22ce' };
      case 'system': return { background: '#f1f5f9', color: '#475569' };
      default: return { background: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      <PageTitle title="Activity Logs" />
      {/* Header */}
      <div className="sl-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 className="sl-page-title">Activity Logs</h1>
          <p className="sl-page-subtitle">Monitor system activities and user actions across the platform</p>
        </div>
        <button
          onClick={fetchLogs}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: '#1a2d5a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff',
        border: '1px solid #e8edf4',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter className="w-5 h-5" style={{ color: '#64748b' }} />
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Filters</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          {/* Date Range */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Calendar className="w-3 h-3" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '7px',
                fontSize: '12px',
                color: '#475569',
                background: '#f8fafc',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Calendar className="w-3 h-3" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '7px',
                fontSize: '12px',
                color: '#475569',
                background: '#f8fafc',
                outline: 'none'
              }}
            />
          </div>

          {/* Action Filter */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px', display: 'block' }}>
              Action
            </label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '7px',
                fontSize: '12px',
                color: '#475569',
                background: '#f8fafc',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="search">Search</option>
              <option value="export">Export</option>
              <option value="view">View</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px', display: 'block' }}>
              Entity Type
            </label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '7px',
                fontSize: '12px',
                color: '#475569',
                background: '#f8fafc',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="">All Types</option>
              <option value="shipment">Shipment</option>
              <option value="user">User</option>
              <option value="report">Report</option>
              <option value="auth">Auth</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by user name, details, or entity ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                width: '100%',
                paddingLeft: '34px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '7px',
                fontSize: '12px',
                color: '#475569',
                background: '#f8fafc',
                outline: 'none'
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            style={{
              padding: '8px 18px',
              background: '#1a2d5a',
              color: '#fff',
              border: 'none',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 18px',
              background: '#fff',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
          Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
          {Math.min(page * limit, total)} of {total} logs
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: '#fff',
        border: '1px solid #e8edf4',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="sl-table" style={{ width: '100%', minWidth: '1000px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f4f8' }}>
                <th style={{ padding: '10px 14px', fontSize: '9.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left' }}>Timestamp</th>
                <th style={{ padding: '10px 14px', fontSize: '9.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '10px 14px', fontSize: '9.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '10px 14px', fontSize: '9.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left' }}>Action</th>
                <th style={{ padding: '10px 14px', fontSize: '9.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left' }}>Entity Type</th>
                <th style={{ padding: '10px 14px', fontSize: '9.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left' }}>Entity ID</th>
                <th style={{ padding: '10px 14px', fontSize: '9.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left' }}>Details</th>
                <th style={{ padding: '10px 14px', fontSize: '9.5px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'left' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Activity className="w-4 h-4 animate-pulse" />
                      Loading activity logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                    No activity logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionStyle = getActionBadgeStyle(log.action);
                  const entityStyle = getEntityBadgeStyle(log.entityType);

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s ease' }} className="hover:bg-muted/30">
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12.5px', fontWeight: '600', color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: '#1a2d5a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: '700',
                            flexShrink: 0
                          }}>
                            {log.userName.charAt(0).toUpperCase()}
                          </div>
                          {log.userName}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>
                        {log.userRole}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          letterSpacing: '0.3px',
                          ...actionStyle
                        }}>
                          {log.action.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          letterSpacing: '0.3px',
                          ...entityStyle
                        }}>
                          {log.entityType.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                        {log.entityId || '-'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#475569', maxWidth: '300px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details || ''}>
                          {log.details || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              background: '#fff',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            Previous
          </button>
          <span style={{ padding: '8px 16px', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              background: page === totalPages ? '#fff' : '#1a2d5a',
              color: page === totalPages ? '#475569' : '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '7px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
