# SkyLedger — Database ERD

```mermaid
erDiagram

    users {
        uuid        id              PK  "Primary key"
        varchar10   skyledger_id    UK  "SL-XXXXXX — auto-generated"
        varchar255  name
        varchar255  email           UK
        text        password_hash       "bcrypt hash"
        enum        role                "admin | operator | viewer"
        varchar100  department
        boolean     is_active           "soft-delete flag"
        timestamp   created_at
        timestamp   updated_at
    }

    sessions {
        uuid        id              PK
        uuid        user_id         FK  "→ users.id (CASCADE DELETE)"
        text        token           UK  "64-char random hex"
        timestamp   expires_at          "24h TTL"
        timestamp   created_at
        varchar45   ip_address
        text        user_agent
    }

    airports {
        serial      id              PK
        char3       iata_code       UK  "e.g. CGK, SIN, HKG"
        varchar255  name
        varchar100  city
        varchar100  country
        varchar50   timezone
    }

    flights {
        uuid        id              PK
        varchar20   flight_id       UK  "e.g. GA-201"
        varchar100  airline
        integer     origin_airport_id FK "→ airports.id"
        integer     dest_airport_id   FK "→ airports.id"
        timestamp   departure_time
        timestamp   arrival_time
        varchar50   aircraft_type
        numeric     max_cargo_weight_kg "precision 10,2"
        enum        status              "scheduled | departed | arrived | cancelled | diverted"
        timestamp   created_at
        timestamp   updated_at
    }

    shipments {
        uuid        id              PK
        varchar20   awb_number      UK  "SL-YYYY-XXXXXX"
        uuid        flight_id       FK  "→ flights.id (nullable)"
        integer     origin_airport_id FK "→ airports.id"
        integer     dest_airport_id   FK "→ airports.id"
        enum        priority            "standard | express | critical"
        varchar100  product_type
        integer     quantity
        numeric     weight_kg           "precision 10,3"
        enum        status              "pending | processing | in_transit | delivered | delayed | cancelled"
        uuid        created_by      FK  "→ users.id"
        timestamp   estimated_delivery
        timestamp   actual_delivery
        text        notes
        timestamp   created_at
        timestamp   updated_at
    }

    shipment_events {
        uuid        id              PK
        uuid        shipment_id     FK  "→ shipments.id (CASCADE DELETE)"
        enum        status              "pending | processing | in_transit | delivered | delayed | cancelled"
        varchar100  location            "IATA code or freeform"
        text        notes
        uuid        changed_by      FK  "→ users.id"
        timestamp   occurred_at
    }

    %% ── Relationships ──────────────────────────────────────────────

    users           ||--o{  sessions         : "authenticates via"
    users           ||--o{  shipments        : "creates"
    users           ||--o{  shipment_events  : "logs"

    airports        ||--o{  flights          : "departs from (origin)"
    airports        ||--o{  flights          : "arrives at (dest)"
    airports        ||--o{  shipments        : "origin airport"
    airports        ||--o{  shipments        : "dest airport"

    flights         ||--o{  shipments        : "carries"

    shipments       ||--|{  shipment_events  : "tracked by"
```

---

## Relationship Summary

| From | To | Cardinality | Notes |
|---|---|---|---|
| `users` | `sessions` | 1 → many | One user can have multiple active sessions |
| `users` | `shipments` | 1 → many | A user creates many shipments |
| `users` | `shipment_events` | 1 → many | A user can log many status changes |
| `airports` | `flights` | 1 → many | One airport is origin/dest for many flights |
| `airports` | `shipments` | 1 → many | One airport is origin/dest for many shipments |
| `flights` | `shipments` | 1 → many | One flight carries many shipments |
| `shipments` | `shipment_events` | 1 → many | Every shipment has at least one event (cascade delete) |

## Enum Values

| Column | Values |
|---|---|
| `users.role` | `admin` · `operator` · `viewer` |
| `flights.status` | `scheduled` · `departed` · `arrived` · `cancelled` · `diverted` |
| `shipments.priority` | `standard` · `express` · `critical` |
| `shipments.status` | `pending` · `processing` · `in_transit` · `delivered` · `delayed` · `cancelled` |
| `shipment_events.status` | _(same as shipments.status)_ |

---

## Type Legend

| Shorthand in diagram | Actual PostgreSQL type |
|---|---|
| `uuid` | `UUID` |
| `serial` | `SERIAL` (auto-increment integer) |
| `integer` | `INTEGER` |
| `boolean` | `BOOLEAN` |
| `text` | `TEXT` (unlimited length) |
| `timestamp` | `TIMESTAMP WITHOUT TIME ZONE` |
| `numeric` | `NUMERIC(precision, scale)` |
| `enum` | PostgreSQL custom ENUM type |
| `varcharN` | `VARCHAR(N)` |
| `char3` | `CHAR(3)` |

---

## Constraints & Defaults

### `users`
| Column | Constraint | Default |
|---|---|---|
| `id` | PRIMARY KEY | `gen_random_uuid()` |
| `skyledger_id` | UNIQUE · NOT NULL | — |
| `name` | NOT NULL | — |
| `email` | UNIQUE · NOT NULL | — |
| `password_hash` | NOT NULL | — |
| `role` | NOT NULL | `'operator'` |
| `is_active` | NOT NULL | `true` |
| `created_at` | NOT NULL | `now()` |
| `updated_at` | NOT NULL | `now()` |

### `sessions`
| Column | Constraint | Default |
|---|---|---|
| `id` | PRIMARY KEY | `gen_random_uuid()` |
| `user_id` | NOT NULL · FK · ON DELETE CASCADE | — |
| `token` | UNIQUE · NOT NULL | — |
| `expires_at` | NOT NULL | — |
| `created_at` | NOT NULL | `now()` |

### `airports`
| Column | Constraint | Default |
|---|---|---|
| `id` | PRIMARY KEY | auto-increment |
| `iata_code` | UNIQUE · NOT NULL | — |
| `name` | NOT NULL | — |

### `flights`
| Column | Constraint | Default |
|---|---|---|
| `id` | PRIMARY KEY | `gen_random_uuid()` |
| `flight_id` | UNIQUE · NOT NULL | — |
| `origin_airport_id` | FK → `airports.id` | NULL |
| `dest_airport_id` | FK → `airports.id` | NULL |
| `status` | NOT NULL | `'scheduled'` |
| `created_at` | NOT NULL | `now()` |
| `updated_at` | NOT NULL | `now()` |

### `shipments`
| Column | Constraint | Default |
|---|---|---|
| `id` | PRIMARY KEY | `gen_random_uuid()` |
| `awb_number` | UNIQUE · NOT NULL | — |
| `flight_id` | FK → `flights.id` · nullable | NULL |
| `origin_airport_id` | FK → `airports.id` · nullable | NULL |
| `dest_airport_id` | FK → `airports.id` · nullable | NULL |
| `created_by` | FK → `users.id` · nullable | NULL |
| `priority` | NOT NULL | `'standard'` |
| `status` | NOT NULL | `'pending'` |
| `created_at` | NOT NULL | `now()` |
| `updated_at` | NOT NULL | `now()` |

### `shipment_events`
| Column | Constraint | Default |
|---|---|---|
| `id` | PRIMARY KEY | `gen_random_uuid()` |
| `shipment_id` | NOT NULL · FK · ON DELETE CASCADE | — |
| `status` | NOT NULL | — |
| `changed_by` | FK → `users.id` · nullable | NULL |
| `occurred_at` | NOT NULL | `now()` |

---

## Recommended Indexes

| Table | Column(s) | Reason |
|---|---|---|
| `users` | `email` | Login lookup |
| `users` | `skyledger_id` | ID-based lookup |
| `sessions` | `token` | Validated on every authenticated request |
| `sessions` | `user_id` | Fetch all sessions per user |
| `sessions` | `expires_at` | Cleanup of expired sessions |
| `airports` | `iata_code` | IATA lookup when creating shipments |
| `flights` | `flight_id` | Flight lookup by code |
| `shipments` | `awb_number` | AWB lookup (public tracking page) |
| `shipments` | `status` | Filter by status on dashboard |
| `shipments` | `created_by` | Filter shipments per user |
| `shipments` | `flight_id` | List all cargo on a given flight |
| `shipments` | `created_at` | Time-range queries in reports |
| `shipment_events` | `shipment_id` | Fetch full audit trail per shipment |

> Drizzle ORM automatically creates UNIQUE indexes for `.unique()` columns. Add extra BTREE indexes via raw SQL migrations if needed.

---

## Shipment Lifecycle

```mermaid
stateDiagram-v2
    [*]         --> pending     : Shipment created
    pending     --> processing  : Cargo accepted at terminal
    processing  --> in_transit  : Loaded onto flight & departed
    in_transit  --> delivered   : Arrived and cleared at destination
    in_transit  --> delayed     : Flight issue or customs hold
    delayed     --> in_transit  : Issue resolved, flight resumed
    pending     --> cancelled   : Cancelled before acceptance
    processing  --> cancelled   : Cancelled after acceptance
    delivered   --> [*]
    cancelled   --> [*]
```

Every transition inserts a new row into `shipment_events` — full, immutable audit trail.

---

## Data Flow Overview

```
 [Register / Login]
         │
         ▼
   users + sessions ──────────────────────────────────────┐
         │                                                 │
         ▼                                                 │
 [Create Shipment]                                         │
         │                                                 │
         ▼                                                 ▼
    shipments ──FK──► flights ──FK──► airports         sessions
         │                                            (auth guard)
         ▼
  shipment_events  ◄── appended on every status change
         │
         ▼
  [Reports API]  aggregates shipments + events → dashboard charts
```
