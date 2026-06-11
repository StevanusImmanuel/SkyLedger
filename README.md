# SkyLedger

SkyLedger is an airport-operator cargo dashboard for creating, managing, and tracking Air Waybill (AWB) shipments.

## Main Features

- Public AWB tracking at `/tracking`
- Operator dashboard at `/dashboard`
- Shipment CRUD at `/shipments`
- Shipment timeline events with timestamps
- Airport, airline, flight, shipment, and activity-log relations using Drizzle ORM
- Reports, activity logs, account management, and protected app routes

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Drizzle ORM
- Neon Postgres
- Tailwind CSS
- Leaflet/react-leaflet

## Environment

Create `.env.local` with at least:

```bash
DATABASE_URL=
POSTGRES_URL=
```

The local airport-coordinate verification script reads `.env` by default. To use `.env.local`, run it with:

```bash
DOTENV_CONFIG_PATH=.env.local node scripts/verify-airport-coordinates.mjs
```

## Development

```bash
npm install
npm run dev
```

Open:

- Public site: `http://localhost:3000`
- Public tracking: `http://localhost:3000/tracking`
- Operator dashboard: `http://localhost:3000/dashboard`
- Shipment management: `http://localhost:3000/shipments`

## Verification Commands

```bash
npm run build
npm run lint
DOTENV_CONFIG_PATH=.env.local node scripts/verify-airport-coordinates.mjs
```

Current demo data includes AWB `JL-196784`, which can be tested at:

```text
http://localhost:3000/tracking/JL-196784
```

## Demo Flow

1. Open `/tracking` and search an AWB.
2. Confirm status, delivery status, route, flight, and shipment timeline appear.
3. Login as an operator.
4. Open `/dashboard` and review operations analytics.
5. Open `/shipments` and use search, pagination, detail, edit, create, and delete flows.
6. Check `/activity-logs` after shipment changes.
7. Run `npm run build` before presenting.

## Database Notes

Core tables:

- `users`
- `sessions`
- `airports`
- `airlines`
- `airplanes`
- `flights`
- `shipments`
- `shipment_events`
- `activity_logs`

Important relations:

- `shipments.flight_id -> flights.id`
- `shipments.origin_airport_id -> airports.id`
- `shipments.dest_airport_id -> airports.id`
- `shipments.created_by -> users.id`
- `shipment_events.shipment_id -> shipments.id`
- `shipment_events.changed_by -> users.id`
