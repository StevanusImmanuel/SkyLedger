'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { capacityData, slaData } from '@/lib/constrant/dummydb';

export function CapacityTrendChart() {
  return (
    <div className="sl-chart-card">
      <div className="sl-chart-header">
        <div>
          <p className="sl-chart-title">Capacity Utilization Trend</p>
          <p className="sl-chart-subtitle">Cargo volume past 7 days</p>
        </div>
        <div className="sl-chart-legend">
          <span className="sl-legend-item"><span className="sl-legend-dot" style={{ background: '#1a2d5a' }} /> Inbound</span>
          <span className="sl-legend-item"><span className="sl-legend-dot" style={{ background: '#60a5fa' }} /> Outbound</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={capacityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1a2d5a" stopOpacity={0.3} /><stop offset="95%" stopColor="#1a2d5a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Area type="monotone" dataKey="inbound" stroke="#1a2d5a" strokeWidth={2} fill="url(#colorInbound)" />
          <Area type="monotone" dataKey="outbound" stroke="#60a5fa" strokeWidth={2} fill="url(#colorOutbound)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SLADonutChart() {
  return (
    <div className="sl-sla-card">
      <p className="sl-sla-title">SLA Performance Index</p>
      <p className="sl-sla-subtitle">Service Level Targets</p>
      <div className="sl-donut-wrapper" style={{ position: 'relative' }}>
        <PieChart width={160} height={160}>
          <Pie data={slaData} cx={75} cy={75} innerRadius={52} outerRadius={72} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
            {slaData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
          </Pie>
        </PieChart>
        <div style={{ position: 'absolute', top: '50%', left: '46%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>92%</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Compliant</div>
        </div>
      </div>
      <div className="sl-sla-legend">
        {slaData.map((item) => (
          <div key={item.name} className="sl-sla-legend-row">
            <div className="sl-sla-legend-left">
              <span className="sl-sla-legend-dot" style={{ background: item.color }} />
              <span>{item.name}</span>
            </div>
            <span className="sl-sla-legend-count">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}