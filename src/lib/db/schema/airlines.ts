import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

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
  airlineId: integer('airline_id').notNull().references(() => airlines.airlineId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});
