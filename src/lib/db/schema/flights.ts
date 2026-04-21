import { pgTable, uuid, varchar, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { airports } from './airports';

export const flightStatusEnum = pgEnum('flight_status', [
  'scheduled',
  'departed',
  'arrived',
  'cancelled',
  'diverted',
]);

export const flights = pgTable('flights', {
  id: uuid('id').primaryKey().defaultRandom(),
  flightId: varchar('flight_id', { length: 20 }).unique().notNull(),
  airline: varchar('airline', { length: 100 }),
  originAirportId: integer('origin_airport_id').references(() => airports.id),
  destAirportId: integer('dest_airport_id').references(() => airports.id),
  departureTime: timestamp('departure_time'),
  arrivalTime: timestamp('arrival_time'),
  aircraftType: varchar('aircraft_type', { length: 50 }),
  maxCargoWeightKg: numeric('max_cargo_weight_kg', { precision: 10, scale: 2 }),
  status: flightStatusEnum('status').default('scheduled').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
