import { relations } from 'drizzle-orm';
import { users } from './users';
import { sessions } from './sessions';
import { airports } from './airports';
import { flights } from './flights';
import { shipments, shipmentEvents } from './shipments';

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  shipments: many(shipments),
  shipmentEvents: many(shipmentEvents),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const airportsRelations = relations(airports, ({ many }) => ({
  originFlights: many(flights, { relationName: 'originAirport' }),
  destFlights: many(flights, { relationName: 'destAirport' }),
  originShipments: many(shipments, { relationName: 'originAirport' }),
  destShipments: many(shipments, { relationName: 'destAirport' }),
}));

export const flightsRelations = relations(flights, ({ one, many }) => ({
  originAirport: one(airports, {
    fields: [flights.originAirportId],
    references: [airports.id],
    relationName: 'originAirport',
  }),
  destAirport: one(airports, {
    fields: [flights.destAirportId],
    references: [airports.id],
    relationName: 'destAirport',
  }),
  shipments: many(shipments),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  flight: one(flights, { fields: [shipments.flightId], references: [flights.id] }),
  originAirport: one(airports, {
    fields: [shipments.originAirportId],
    references: [airports.id],
    relationName: 'originAirport',
  }),
  destAirport: one(airports, {
    fields: [shipments.destAirportId],
    references: [airports.id],
    relationName: 'destAirport',
  }),
  createdByUser: one(users, { fields: [shipments.createdBy], references: [users.id] }),
  events: many(shipmentEvents),
}));

export const shipmentEventsRelations = relations(shipmentEvents, ({ one }) => ({
  shipment: one(shipments, { fields: [shipmentEvents.shipmentId], references: [shipments.id] }),
  changedByUser: one(users, { fields: [shipmentEvents.changedBy], references: [users.id] }),
}));
