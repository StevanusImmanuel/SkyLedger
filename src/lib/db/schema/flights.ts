import { pgTable, uuid, varchar, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { airports } from './airports';
import { airlines, airplanes } from './airlines';

export const flightStatusEnum = pgEnum('flight_status', [
  'scheduled',
  'departed',
  'arrived',
  'cancelled',
  'diverted',
]);

export const flights = pgTable('flights', {
  id: uuid('id').primaryKey().defaultRandom(),
  airlineId: integer('airline_id').references(() => airlines.airlineId),
  airplaneId: integer('airplane_id').references(() => airplanes.airplaneId),
  originAirportId: integer('origin_airport_id').references(() => airports.id),
  destAirportId: integer('dest_airport_id').references(() => airports.id),
  departureTime: timestamp('departure_time'),
  arrivalTime: timestamp('arrival_time'),
  maxCargoWeightKg: numeric('max_cargo_weight_kg', { precision: 10, scale: 2 }),
  status: flightStatusEnum('status').default('scheduled').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
