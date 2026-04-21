import type { InferSelectModel } from 'drizzle-orm';
import type { users, sessions, airports, flights, shipments, shipmentEvents } from '@/lib/db/schema';

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type Airport = InferSelectModel<typeof airports>;
export type Flight = InferSelectModel<typeof flights>;
export type Shipment = InferSelectModel<typeof shipments>;
export type ShipmentEvent = InferSelectModel<typeof shipmentEvents>;

export type SafeUser = Omit<User, 'passwordHash'>;

export type UserRole = 'admin' | 'operator' | 'viewer';
export type FlightStatus = 'scheduled' | 'departed' | 'arrived' | 'cancelled' | 'diverted';
export type ShipmentStatus = 'pending' | 'processing' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
export type ShipmentPriority = 'standard' | 'express' | 'critical';

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
