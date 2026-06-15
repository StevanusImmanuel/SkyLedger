'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type WeightByDate = {
  date: string;
  weightKg: number;
  weightMt?: number;
};

type PriorityCount = {
  priority: string;
  count: number;
};

const CHART_COLOR = '#1a2d5a';

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatPriorityLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function DashboardCharts({
  weightByDate,
  priorityCounts,
}: {
  weightByDate: WeightByDate[];
  priorityCounts: PriorityCount[];
}) {
  const hasWeightData = weightByDate.length > 0;
  const visiblePriorityCounts = priorityCounts.filter((p) => p.priority !== 'other');
  const hasPriorityData = visiblePriorityCounts.some((p) => p.count > 0);

  return (
    <div className="sl-charts-grid">
      <div className="sl-chart-card">
        <div className="sl-chart-header">
          <div>
            <p className="sl-chart-title">Shipment Weight Over Time</p>
            <p className="sl-chart-subtitle">Total Cargo Weight (MT) by Date</p>
          </div>
        </div>
        {hasWeightData ? (
          <div className="sl-dashboard-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightByDate} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e8edf4' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  unit=" MT"
                />
                <Tooltip
                  labelFormatter={(label) => formatDateLabel(String(label))}
                  formatter={(value) => [`${value} MT`, 'Weight']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e8edf4', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="weightMt"
                  name="Weight"
                  stroke={CHART_COLOR}
                  strokeWidth={2}
                  fill="url(#weightGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="sl-chart-empty">No shipment weight data available yet.</div>
        )}
      </div>

      <div className="sl-chart-card">
        <div className="sl-chart-header">
          <div>
            <p className="sl-chart-title">Active Shipments by Priority</p>
            <p className="sl-chart-subtitle">Standard / Express / Critical</p>
          </div>
        </div>
        {hasPriorityData ? (
          <div className="sl-dashboard-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visiblePriorityCounts} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="priority"
                  tickFormatter={formatPriorityLabel}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e8edf4' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  labelFormatter={(label) => formatPriorityLabel(String(label))}
                  formatter={(value) => [value, 'Shipments']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e8edf4', fontSize: 12 }}
                />
                <Bar dataKey="count" name="Shipments" fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="sl-chart-empty">No active shipments to display.</div>
        )}
      </div>
    </div>
  );
}
