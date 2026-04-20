export const capacityData = [
  { day: 'MON', inbound: 320, outbound: 280 },
  { day: 'TUE', inbound: 380, outbound: 350 },
  { day: 'WED', inbound: 290, outbound: 310 },
  { day: 'THU', inbound: 420, outbound: 390 },
  { day: 'FRI', inbound: 460, outbound: 430 },
  { day: 'SAT', inbound: 380, outbound: 340 },
  { day: 'SUN', inbound: 350, outbound: 370 },
];

export const slaData = [
  { name: 'Met (SLA-1)', value: 2104, color: '#1a2d5a' },
  { name: 'Pending Review', value: 142, color: '#ef4444' },
  { name: 'At Risk', value: 34, color: '#e2e8f0' },
];

export const routes = [
  { id: 'A1', sector: 'LHR → JFK', desc: 'London Heathrow to John F. Kennedy', flightId: 'BA-1\n78C', weight: '342.5 MT', util: 88, utilColor: '#1a2d5a', status: 'OPTIMAL', statusClass: 'sl-badge-optimal' },
  { id: 'A2', sector: 'SIN → DXB', desc: 'Going to Dubai Int', flightId: 'EK-3\n55X', weight: '298.1 MT', util: 80, utilColor: '#1a2d5a', status: 'OPTIMAL', statusClass: 'sl-badge-optimal' },
  { id: 'A3', sector: 'PVG → LAX', desc: 'Pudong to Los Angeles', flightId: 'CX-8\n80F', weight: '210.4 MT', util: 60, utilColor: '#b45309', status: 'MODERATE', statusClass: 'sl-badge-moderate' },
  { id: 'A4', sector: 'FRA → HKG', desc: 'Frankfurt to Hong Kong Intl', flightId: 'LH-8\n224', weight: '185.9 MT', util: 75, utilColor: '#1a2d5a', status: 'OPTIMAL', statusClass: 'sl-badge-optimal' },
  { id: 'A5', sector: 'CDG → ORD', desc: 'Paris Charles de Gaulle to Chicago', flightId: 'AF-7\n31B', weight: '162.3 MT', util: 55, utilColor: '#1a2d5a', status: 'OPTIMAL', statusClass: 'sl-badge-optimal' },
];

export const cargoFlights = [
  { awb: 'AWB-109281', origin: 'JFK', originCode: 'green', dest: 'LHR', destCode: 'green', flight: 'BA-178', status: 'ON-TIME', statusClass: 'sl-badge-ontime', weight: '2,340 kg', timestamp: '2026-04-13 08:45' },
  { awb: 'AWB-216581', origin: 'LAX', originCode: 'blue', dest: 'NRT', destCode: 'blue', flight: 'JL-061', status: 'DEPARTED', statusClass: 'sl-badge-departed', weight: '1,875 kg', timestamp: '2026-04-13 09:12' },
  { awb: 'AWB-154351', origin: 'ORD', originCode: 'purple', dest: 'FRA', destCode: 'purple', flight: 'LH-430', status: 'ON-TIME', statusClass: 'sl-badge-ontime', weight: '3,120 kg', timestamp: '2026-04-13 09:30' },
  { awb: 'AWB-735198', origin: 'DXB', originCode: 'red', dest: 'SYD', destCode: 'red', flight: 'EK-413', status: 'DELAYED', statusClass: 'sl-badge-delayed', weight: '2,650 kg', timestamp: '2026-04-13 10:05' },
  { awb: 'AWB-308123', origin: 'CDG', originCode: 'orange', dest: 'JFK', destCode: 'green', flight: 'AF-022', status: 'DEPARTED', statusClass: 'sl-badge-departed', weight: '1,920 kg', timestamp: '2026-04-13 10:22' },
  { awb: 'AWB-476289', origin: 'AMS', originCode: 'blue', dest: 'DXB', destCode: 'red', flight: 'KL-781', status: 'DELAYED', statusClass: 'sl-badge-delayed', weight: '1,540 kg', timestamp: '2026-04-13 10:48' },
];

export const statusIndicatorColor: Record<string, string> = {
  'ON-TIME': '#10b981',
  'DELAYED': '#ef4444',
  'DEPARTED': '#3b82f6',
};