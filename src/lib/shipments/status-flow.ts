export type ShipmentStatus =
  | 'pending'
  | 'processing'
  | 'in_transit'
  | 'delivered'
  | 'delayed'
  | 'cancelled'
  | 'closed';

// Underlying status reachable from each status (self-transition allowed = no-op edits).
// Enforces the task flow: Pending → In Transit → Delivered → Closed, plus Pending/In Transit → Cancelled.
// Delivered may only advance to Closed; Closed and Cancelled are terminal.
const ALLOWED: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['pending', 'processing', 'in_transit', 'delivered', 'delayed', 'cancelled'],
  processing: ['processing', 'in_transit', 'delivered', 'delayed', 'cancelled'],
  in_transit: ['in_transit', 'processing', 'delivered', 'delayed', 'cancelled'],
  delayed: ['delayed', 'pending', 'processing', 'in_transit', 'delivered', 'cancelled'],
  delivered: ['delivered', 'closed'],
  closed: ['closed'],
  cancelled: ['cancelled'],
};

export const FINALIZED_STATUSES: ReadonlySet<ShipmentStatus> = new Set(['closed', 'cancelled']);

export function isFinalized(status: ShipmentStatus): boolean {
  return FINALIZED_STATUSES.has(status);
}

// Delivery-status values that mark a shipment as reporting-eligible (it appears in the
// Reports page) and therefore permanently read-only: no edit, no delete, no status change.
export const LOCKED_DELIVERY_STATUSES: ReadonlySet<string> = new Set([
  'arrived_at_destination',
  'out_for_delivery',
  'ready_for_pickup',
  'delivered',
]);

// A shipment is locked from edit/delete once it reaches a reporting-eligible state:
// either a terminal status (closed/cancelled/delivered) or a delivery status that the
// Reports page treats as delivered.
export function isReportingLocked(
  status: ShipmentStatus | string | null | undefined,
  deliveryStatus?: string | null
): boolean {
  if (status === 'closed' || status === 'cancelled' || status === 'delivered') return true;
  if (deliveryStatus && LOCKED_DELIVERY_STATUSES.has(deliveryStatus)) return true;
  return false;
}

export function getAllowedTransitions(from: ShipmentStatus): ShipmentStatus[] {
  return ALLOWED[from] ?? [];
}

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return getAllowedTransitions(from).includes(to);
}
