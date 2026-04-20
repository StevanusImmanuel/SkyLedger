import { routes, cargoFlights, statusIndicatorColor } from '@/lib/constrant/dummydb';

export default function DashboardView() {
  return (
    <>
      {/* Top Operational Routes */}
      <div className="sl-routes-section">
        <div className="sl-routes-header">
          <div>
            <p className="sl-routes-title">Top Operational Routes</p>
            <p className="sl-routes-subtitle">Volume by Sector (Weekly)</p>
          </div>
          <a href="#" className="sl-view-all-link">View All Routes</a>
        </div>
        <table className="sl-table">
          <thead>
            <tr><th>Sector</th><th>Flight ID</th><th>Cargo Weight</th><th>Utiliz.</th><th>Status</th></tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span className="sl-sector-badge">{route.id}</span>
                    <div><div className="sl-route-main">{route.sector}</div><div className="sl-route-sub">{route.desc}</div></div>
                  </div>
                </td>
                <td className="sl-flight-id" style={{ whiteSpace: 'pre-line' }}>{route.flightId}</td>
                <td><span className="sl-cargo-weight">{route.weight}</span></td>
                <td>
                  <div className="sl-util-bar">
                    <div className="sl-util-track">
                      <div className="sl-util-fill" style={{ width: `${route.util}%`, background: route.utilColor }} />
                    </div>
                  </div>
                </td>
                <td><span className={`sl-status-badge ${route.statusClass}`}>{route.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cargo Flight Status */}
      <div className="sl-cargo-table-section">
        <div className="sl-cargo-table-header">
          <div><p className="sl-cargo-table-title">Cargo Flight Status</p><p className="sl-cargo-table-subtitle">Real-time shipment tracking</p></div>
        </div>
        <table className="sl-table">
          <thead>
            <tr><th style={{ paddingLeft: 20 }}>AWB Number</th><th>Origin</th><th>Destination</th><th>Flight ID</th><th>Status</th><th>Weight</th><th>Timestamp</th></tr>
          </thead>
          <tbody>
            {cargoFlights.map((flight, i) => (
              <tr key={i}>
                <td style={{ paddingLeft: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="sl-cargo-row-indicator" style={{ background: statusIndicatorColor[flight.status] }} />
                    <span style={{ fontWeight: 700, fontSize: 12, color: '#1a2d5a' }}>{flight.awb}</span>
                  </div>
                </td>
                <td><span className={`sl-airport-badge ${flight.originCode}`}>{flight.origin}</span></td>
                <td><span className={`sl-airport-badge ${flight.destCode}`}>{flight.dest}</span></td>
                <td><span style={{ fontSize: 12, fontWeight: 600 ,color: '#1a2d5a'}}>{flight.flight}</span></td>
                <td><span className={`sl-status-badge ${flight.statusClass}`}>{flight.status}</span></td>
                <td><span style={{ fontSize: 12.5, fontWeight: 600 , color: '#1a2d5a'}}>{flight.weight}</span></td>
                <td><span style={{ fontSize: 11.5, color: '#64748b' }}>{flight.timestamp}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}