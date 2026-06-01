export const PRIORITY_RATES = {
  standard: 1,
  express: 1.5,
  critical: 2,
} as const;

export type ShipmentPriority = keyof typeof PRIORITY_RATES;

export function isShipmentPriority(value: unknown): value is ShipmentPriority {
  return typeof value === 'string' && value in PRIORITY_RATES;
}

export function parseShipmentWeight(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') return null;

  const weight = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(weight) ? weight : null;
}

export function calculateShippingFee(productWeight: number, priority: ShipmentPriority, weightUnit: string = 'Kilogram') {
  // Convert tonnes to kilograms if needed
  const weightInKg = weightUnit === 'Tonnes' ? productWeight * 1000 : productWeight;
  return PRIORITY_RATES[priority] * (weightInKg * 1.5);
}

export function calculateShippingFeeFromInput(productWeight: unknown, priority: unknown, weightUnit: string = 'Kilogram') {
  if (!isShipmentPriority(priority)) return null;

  const weight = parseShipmentWeight(productWeight);
  if (weight === null || weight < 0) return null;

  return calculateShippingFee(weight, priority, weightUnit);
}

export function formatShippingFee(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
