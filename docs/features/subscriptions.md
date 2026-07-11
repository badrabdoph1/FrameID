# Subscriptions

## Goal

Control tenant access through trial, active subscription, expiration, grace-period, past-due, cancellation, suspension, and soft-deletion states.

## Components

- tenant trial fields;
- subscription records and statuses;
- subscription `deletedAt` soft-delete field;
- lifecycle settings;
- lifecycle synchronization services;
- lifecycle events;
- admin controls and customer access checks.

## Data Flow

Signup provisioning creates the tenant trial using the configured duration. Request/session resolution may synchronize lifecycle state against the current time. Subscription or payment changes update persisted state, and public/customer access checks consume the resulting tenant and site status. Soft-deleted subscriptions must be excluded from normal active-subscription reads while remaining available for audit, recovery, or historical analysis.

## Important Files

- `src/modules/lifecycle/`
- signup provisioning modules
- current session/request services
- subscription/admin routes under `src/app/`
- `prisma/schema.prisma`
- `prisma/migrations/20260711000100_restore_dropped_columns/migration.sql`
- `docs/DATA_FLOW.md`
- `docs/DATABASE_ARCHITECTURE.md`

## Development Notes

Treat lifecycle transitions as domain policy, not UI logic. Respect `deletedAt` in normal reads, preserve historical events, avoid silent trial-duration changes, and document any new state, transition, retention rule, or deletion behavior in the database, data-flow, feature, and changelog documentation.
