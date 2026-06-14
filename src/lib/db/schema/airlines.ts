import { pgTable, serial, varchar, integer, timestamp, numeric } from 'drizzle-orm/pg-core';

export const airlines = pgTable('airlines', {
  airlineId: serial('airline_id').primaryKey(),
  airlineName: varchar('airline_name', { length: 100 }).notNull().unique(),
  airlineCode: varchar('airline_code', { length: 10 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const airplanes = pgTable('airplanes', {
  airplaneId: serial('airplane_id').primaryKey(),
  flightNumber: varchar('flight_number', { length: 20 }).notNull().unique(),
  model: varchar('model', { length: 100 }).notNull(),
  capacity: integer('capacity').notNull(),
  maxWeightKg: numeric('max_weight_kg', { precision: 10, scale: 2 }),
  maxVolumeM3: numeric('max_volume_m3', { precision: 10, scale: 2 }),
  airlineId: integer('airline_id').notNull().references(() => airlines.airlineId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});
