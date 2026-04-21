import { pgTable, serial, char, varchar } from 'drizzle-orm/pg-core';

export const airports = pgTable('airports', {
  id: serial('id').primaryKey(),
  iataCode: char('iata_code', { length: 3 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  timezone: varchar('timezone', { length: 50 }),
});
