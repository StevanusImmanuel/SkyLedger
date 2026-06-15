type ReceiptShipment = {
  awbNumber: string;
  status: string;
  deliveryStatus?: string | null;
  priority?: string;
  productType?: string | null;
  weightKg?: string | null;
  notes?: string | null;
  createdAt?: string;
  estimatedDelivery?: string | null;
  originAirport?: { iataCode: string; city: string; country: string } | null;
  destAirport?: { iataCode: string; city: string; country: string } | null;
  flight?: {
    airline?: { airlineName: string; airlineCode: string } | null;
    airplane?: { flightNumber: string; model: string } | null;
  } | null;
};

function parseNoteValue(notes: string | null, label: string): string {
  if (!notes) return '—';
  const stopLabels = ['Shipping Date', 'Sender', 'Receiver', 'Tel', 'Origin', 'Dest', 'Delivery', 'Fee', 'Weight Unit', 'Notes']
    .filter(l => l !== label).join('|');
  const re = new RegExp(`(?:^|,\\s*)${label}:\\s*([\\s\\S]*?)(?=,\\s*(?:${stopLabels}):|$)`, 'i');
  const m = notes.match(re);
  return m?.[1]?.trim() || '—';
}

export function printShipmentReceipt(shipment: ReceiptShipment) {
  const sender = parseNoteValue(shipment.notes ?? null, 'Sender');
  const receiver = parseNoteValue(shipment.notes ?? null, 'Receiver');
  const tel = parseNoteValue(shipment.notes ?? null, 'Tel');
  const fee = parseNoteValue(shipment.notes ?? null, 'Fee');
  const shippingDate = parseNoteValue(shipment.notes ?? null, 'Shipping Date');
  const originAddr = parseNoteValue(shipment.notes ?? null, 'Origin');
  const destAddr = parseNoteValue(shipment.notes ?? null, 'Dest');

  const origin = shipment.originAirport
    ? `${shipment.originAirport.iataCode} — ${shipment.originAirport.city}, ${shipment.originAirport.country}`
    : '—';
  const destination = shipment.destAirport
    ? `${shipment.destAirport.iataCode} — ${shipment.destAirport.city}, ${shipment.destAirport.country}`
    : '—';

  const airline = shipment.flight?.airline?.airlineName || '—';
  const airplane = shipment.flight?.airplane
    ? `${shipment.flight.airplane.flightNumber} (${shipment.flight.airplane.model})`
    : '—';

  const status = shipment.deliveryStatus
    ? shipment.deliveryStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : shipment.status.replace(/_/g, ' ').toUpperCase();

  const weight = shipment.weightKg ? `${Number(shipment.weightKg).toFixed(2)} kg` : '—';
  const priority = shipment.priority ? shipment.priority.charAt(0).toUpperCase() + shipment.priority.slice(1) : '—';
  const createdAt = shipment.createdAt ? new Date(shipment.createdAt).toLocaleString() : '—';
  const estimated = shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleString() : '—';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt — ${shipment.awbNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; padding: 32px; color: #1e293b; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a2d5a; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { font-size: 22px; font-weight: 900; color: #1a2d5a; letter-spacing: -0.5px; }
    .logo-sub { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .awb { font-size: 18px; font-weight: 800; color: #0f172a; text-align: right; }
    .awb-label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; font-weight: 700; color: #1a2d5a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; }
    .field { margin-bottom: 6px; }
    .field-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px; }
    .field-value { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 1px; }
    .status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #dbeafe; color: #1d4ed8; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
    @media print {
      body { padding: 16px; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">SkyLedger</div>
      <div class="logo-sub">Cargo Management System</div>
    </div>
    <div>
      <div class="awb-label">Air Waybill Number</div>
      <div class="awb">${shipment.awbNumber}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Shipment Information</div>
    <div class="grid">
      <div class="field"><div class="field-label">Status</div><div class="field-value"><span class="status-badge">${status}</span></div></div>
      <div class="field"><div class="field-label">Priority</div><div class="field-value">${priority}</div></div>
      <div class="field"><div class="field-label">Product Type</div><div class="field-value">${shipment.productType || '—'}</div></div>
      <div class="field"><div class="field-label">Weight</div><div class="field-value">${weight}</div></div>
      <div class="field"><div class="field-label">Shipping Fee</div><div class="field-value">${fee}</div></div>
      <div class="field"><div class="field-label">Shipping Date</div><div class="field-value">${shippingDate}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Sender & Receiver</div>
    <div class="grid">
      <div class="field"><div class="field-label">Sender</div><div class="field-value">${sender}</div></div>
      <div class="field"><div class="field-label">Receiver</div><div class="field-value">${receiver}</div></div>
      <div class="field"><div class="field-label">Phone</div><div class="field-value">${tel}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Route</div>
    <div class="grid">
      <div class="field"><div class="field-label">Origin Airport</div><div class="field-value">${origin}</div></div>
      <div class="field"><div class="field-label">Destination Airport</div><div class="field-value">${destination}</div></div>
      <div class="field"><div class="field-label">Origin Address</div><div class="field-value">${originAddr}</div></div>
      <div class="field"><div class="field-label">Destination Address</div><div class="field-value">${destAddr}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Flight Details</div>
    <div class="grid">
      <div class="field"><div class="field-label">Airline</div><div class="field-value">${airline}</div></div>
      <div class="field"><div class="field-label">Airplane</div><div class="field-value">${airplane}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dates</div>
    <div class="grid">
      <div class="field"><div class="field-label">Created At</div><div class="field-value">${createdAt}</div></div>
      <div class="field"><div class="field-label">Estimated Delivery</div><div class="field-value">${estimated}</div></div>
    </div>
  </div>

  <div class="footer">
    Powered by SkyLedger &mdash; Generated on ${new Date().toLocaleString()}
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }
}
