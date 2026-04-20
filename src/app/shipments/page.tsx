'use client';
import { useState } from 'react';
import Link from 'next/link';

const shipments = [
  { id: 1, awb: 'AWB-960231', dest: 'LHR', destName: 'London, UK', destColor: 'blue', flight: 'BA-0284', priority: 'URGENT', status: 'Delayed', statusClass: 'sl-badge-delayed', indicatorColor: '#ef4444' },
  { id: 2, awb: 'AWB-880231', dest: 'LHR', destName: 'London, UK', destColor: 'blue', flight: 'SA-0284', priority: 'URGENT', status: 'Delayed', statusClass: 'sl-badge-delayed', indicatorColor: '#ef4444' },
  { id: 3, awb: 'AWB-672190', dest: 'SIN', destName: 'Singapore, SG', destColor: 'orange', flight: 'SA-0012', status: 'In-Transit', statusClass: 'sl-badge-intransit', priority: 'STANDARD', indicatorColor: '#0ea5e9' },
  { id: 4, awb: 'AWB-443211', dest: 'NRT', destName: 'Tokyo, JP', destColor: 'purple', flight: 'JL-0005', status: 'Manifested', statusClass: 'sl-badge-manifested', priority: 'HIGH', indicatorColor: '#8b5cf6' },
  { id: 5, awb: 'AWB-109283', dest: 'JFK', destName: 'New York, US', destColor: 'green', flight: 'UA-0099', status: 'In-Transit', statusClass: 'sl-badge-intransit', priority: 'STANDARD', indicatorColor: '#0ea5e9' },
  { id: 6, awb: 'AWB-109263', dest: 'JFK', destName: 'New York, US', destColor: 'green', flight: 'UA-0099', status: 'In-Transit', statusClass: 'sl-badge-intransit', priority: 'STANDARD', indicatorColor: '#0ea5e9' },
];

const priorityColor: Record<string, string> = {
  URGENT: '#fee2e2',
  URGENTTEXT: '#b91c1c',
  HIGH: '#fef3c7',
  HIGHTEXT: '#b45309',
  STANDARD: '#dbeafe',
  STANDARDTEXT: '#1d4ed8',
};

export default function ShipmentsPage() {
  const [search, setSearch] = useState('');

  const filtered = shipments.filter(s =>
    s.awb.toLowerCase().includes(search.toLowerCase()) ||
    s.destName.toLowerCase().includes(search.toLowerCase()) ||
    s.flight.toLowerCase().includes(search.toLowerCase())
  );

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="sl-stat-card">
          <div className="sl-stat-header">
            <span className="sl-stat-label">Active</span>
          </div>
          <div className="sl-stat-value" style={{ fontSize: 32 }}>142</div>
          <div className="sl-stat-meta up">↑ +18%</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-header">
            <span className="sl-stat-label">Delayed</span>
          </div>
          <div className="sl-stat-value" style={{ fontSize: 32, color: '#ef4444' }}>08</div>
          <div className="sl-stat-meta" style={{ color: '#ef4444', fontWeight: 600 }}>↓ -4%</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-header">
            <span className="sl-stat-label">Priority Weight</span>
          </div>
          <div className="sl-stat-value" style={{ fontSize: 32 }}>24</div>
          <div className="sl-stat-meta neutral">— Planned</div>
        </div>
        <div className="sl-stat-card">
          <div className="sl-stat-header">
            <span className="sl-stat-label">Total Tonnage</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
          </div>
          <div className="sl-stat-value" style={{ fontSize: 32 }}>1,240<span className="unit">T</span></div>
        </div>
      </div>

      {/* Shipments Table */}
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
            {filtered.map((s) => {
              const pKey = s.priority.toUpperCase();
              const bgColor = priorityColor[pKey] || '#f1f5f9';
              const textColor = priorityColor[`${pKey}TEXT`] || '#475569';
              return (
                <tr key={s.id} style={{ cursor: 'pointer' }}>
                  <td style={{ paddingLeft: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 3, height: 34, borderRadius: 2, background: s.indicatorColor, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 12, color: '#1a2d5a' }}>{s.awb}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`sl-airport-badge ${s.destColor}`}>{s.dest}</span>
                      <span style={{ fontSize: 12, color: '#475569' }}>{s.destName}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>{s.flight}</span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
                      borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                      background: bgColor, color: textColor,
                    }}>
                      {s.priority}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.indicatorColor }} />
                      <span className={`sl-status-badge ${s.statusClass}`}>{s.status}</span>
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
        <div className="sl-table-footer">
          <span className="sl-table-showing">Showing 1 to 4 of 248 entries</span>
          <div className="sl-pagination">
            <button className="sl-page-btn">‹</button>
            <button className="sl-page-btn active">1</button>
            <button className="sl-page-btn">2</button>
            <button className="sl-page-btn">3</button>
            <button className="sl-page-btn">›</button>
          </div>
        </div>
      </div>

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
