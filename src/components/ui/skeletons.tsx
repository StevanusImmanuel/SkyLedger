'use client';

const chartSkeletonHeights = [48, 72, 60, 42, 77, 58, 88];

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="sl-awb-table-container">
      <table className="sl-table">
        <thead>
          <tr>
            <th style={{ paddingLeft: 20 }}>AWB Number</th>
            <th>Origin</th>
            <th>Destination</th>
            <th>Flight ID</th>
            <th>Status</th>
            <th>Weight</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="skeleton" style={{ width: 3, height: 34, borderRadius: 2 }} />
                  <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4 }} />
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="skeleton" style={{ width: 40, height: 20, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="skeleton" style={{ width: 40, height: 20, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
                </div>
              </td>
              <td><div className="skeleton" style={{ width: 60, height: 14, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 70, height: 20, borderRadius: 12 }} /></td>
              <td><div className="skeleton" style={{ width: 60, height: 14, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 100, height: 12, borderRadius: 4 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ShipmentTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
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
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="skeleton" style={{ width: 3, height: 34, borderRadius: 2 }} />
                  <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4 }} />
                </div>
              </td>
              <td><div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 110, height: 14, borderRadius: 4 }} /></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="skeleton" style={{ width: 40, height: 20, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: 90, height: 12, borderRadius: 4 }} />
                </div>
              </td>
              <td><div className="skeleton" style={{ width: 60, height: 14, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 70, height: 20, borderRadius: 12 }} /></td>
              <td><div className="skeleton" style={{ width: 70, height: 20, borderRadius: 12 }} /></td>
              <td><div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="sl-stat-card">
      <div className="sl-stat-header">
        <div className="skeleton" style={{ width: 120, height: 12, borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 6, marginTop: 8 }} />
      <div className="skeleton" style={{ width: 100, height: 10, borderRadius: 4, marginTop: 8 }} />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="sl-chart-card">
      <div className="sl-chart-header">
        <div>
          <div className="skeleton" style={{ width: 180, height: 16, borderRadius: 4, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: 140, height: 12, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '20px 10px' }}>
        {chartSkeletonHeights.map((height, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              flex: 1,
              height: `${height}%`,
              borderRadius: 4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function RouteTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="sl-routes-section">
      <div className="sl-routes-header">
        <div>
          <div className="skeleton" style={{ width: 180, height: 16, borderRadius: 4, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: 140, height: 12, borderRadius: 4 }} />
        </div>
      </div>
      <table className="sl-table">
        <thead>
          <tr>
            <th>Sector</th>
            <th>Flight ID</th>
            <th>Cargo Weight</th>
            <th>Utiliz.</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 6 }} />
                  <div>
                    <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4, marginBottom: 4 }} />
                    <div className="skeleton" style={{ width: 160, height: 11, borderRadius: 4 }} />
                  </div>
                </div>
              </td>
              <td><div className="skeleton" style={{ width: 60, height: 14, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 70, height: 14, borderRadius: 4 }} /></td>
              <td>
                <div className="skeleton" style={{ width: '100%', height: 8, borderRadius: 4 }} />
              </td>
              <td><div className="skeleton" style={{ width: 70, height: 20, borderRadius: 12 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PieChartSkeleton() {
  return (
    <div className="sl-sla-card">
      <div className="skeleton" style={{ width: 160, height: 16, borderRadius: 4, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: 120, height: 12, borderRadius: 4, marginBottom: 20 }} />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 160, height: 160, borderRadius: '50%' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="skeleton" style={{ width: 10, height: 10, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: 100, height: 12, borderRadius: 4 }} />
            </div>
            <div className="skeleton" style={{ width: 40, height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShipmentDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl p-6 md:p-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="skeleton" style={{ width: 120, height: 11, borderRadius: 4, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: 80, height: 11, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 240, height: 32, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 280, height: 12, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ width: 90, height: 36, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 90, height: 36, borderRadius: 8 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8edf4', padding: 20 }}>
            <div className="skeleton" style={{ width: 100, height: 11, borderRadius: 4, marginBottom: 14 }} />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="skeleton" style={{ width: 80, height: 11, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 120, height: 11, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8edf4', padding: 20 }}>
        <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 4, marginBottom: 14 }} />
        <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function ShipmentFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6 md:p-10">
      <div className="mb-6">
        <div className="skeleton" style={{ width: 120, height: 11, borderRadius: 4, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: 200, height: 28, borderRadius: 6, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: 260, height: 12, borderRadius: 4 }} />
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8edf4', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ width: 100, height: 11, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: '100%', height: 38, borderRadius: 8 }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <div className="skeleton" style={{ width: 90, height: 38, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 38, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export function UserTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="sl-awb-table-container">
      <table className="sl-table">
        <thead>
          <tr>
            <th style={{ paddingLeft: 20 }}>SkyLedger ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={{ paddingLeft: 20 }}><div className="skeleton" style={{ width: 90, height: 14, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 160, height: 14, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 70, height: 20, borderRadius: 12 }} /></td>
              <td><div className="skeleton" style={{ width: 90, height: 14, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 60, height: 20, borderRadius: 12 }} /></td>
              <td><div className="skeleton" style={{ width: 100, height: 12, borderRadius: 4 }} /></td>
              <td><div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
