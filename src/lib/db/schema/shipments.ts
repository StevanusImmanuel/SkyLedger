import { pgTable, uuid, varchar, timestamp, numeric, integer, text, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { airports } from './airports';
import { flights } from './flights';

export const priorityEnum = pgEnum('shipment_priority', ['standard', 'express', 'critical']);

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending',
  'processing',
  'in_transit',
  'delivered',
  'delayed',
  'cancelled',
]);

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  awbNumber: varchar('awb_number', { length: 20 }).unique().notNull(),
  flightId: uuid('flight_id').references(() => flights.id),
  originAirportId: integer('origin_airport_id').references(() => airports.id),
  destAirportId: integer('dest_airport_id').references(() => airports.id),
  priority: priorityEnum('priority').default('standard').notNull(),
  productType: varchar('product_type', { length: 100 }),
  quantity: integer('quantity'),
  weightKg: numeric('weight_kg', { precision: 10, scale: 3 }),
  status: shipmentStatusEnum('status').default('pending').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  estimatedDelivery: timestamp('estimated_delivery'),
  actualDelivery: timestamp('actual_delivery'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const shipmentEvents = pgTable('shipment_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  status: shipmentStatusEnum('status').notNull(),
  location: varchar('location', { length: 100 }),
  notes: text('notes'),
  changedBy: uuid('changed_by').references(() => users.id),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
});
