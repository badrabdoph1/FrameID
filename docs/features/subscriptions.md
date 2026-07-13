# Subscriptions

## Goal

Control tenant access through trial, active subscription, expiration, grace-period, past-due, cancellation, suspension, and soft-deletion states.

## Components

- tenant trial fields;
- subscription records and statuses;
- subscription `deletedAt` soft-delete field;
- lifecycle settings;
- subscription experience defaults;
- tenant-level subscription experience overrides;
- shared resolver for dashboard and billing surfaces;
- lifecycle synchronization services;
- lifecycle events;
- admin controls and customer access checks.

## Data Flow

Signup provisioning creates the tenant trial using the configured duration. Request/session resolution may synchronize lifecycle state against the current time. Subscription or payment changes update persisted state, and public/customer access checks consume the resulting tenant and site status. Soft-deleted subscriptions must be excluded from normal active-subscription reads while remaining available for audit, recovery, or historical analysis.

## Important Files

- `src/modules/lifecycle/`
- `src/modules/subscription/subscription-experience.ts`
- signup provisioning modules
- current session/request services
- subscription/admin routes under `src/app/`
- `prisma/schema.prisma`
- `prisma/migrations/20260711000100_restore_dropped_columns/migration.sql`
- `docs/DATA_FLOW.md`
- `docs/DATABASE_ARCHITECTURE.md`

## Development Notes

Treat lifecycle transitions as domain policy, not UI logic. Respect `deletedAt` in normal reads, preserve historical events, avoid silent trial-duration changes, and document any new state, transition, retention rule, or deletion behavior in the database, data-flow, feature, and changelog documentation.

## Subscription Experience Model

The admin messaging system for subscription and activation is modeled as one shared experience layer:

- global defaults define what trial, active, pending review, rejected, and expired customers see by default;
- tenant overrides can replace any of those defaults for specific customers only;
- dashboard and billing both resolve the same final payload using this priority:
  override → global default → system fallback.

This keeps subscription messaging, timer visibility, and action-button behavior in one source of truth instead of duplicating logic across multiple services or UI routes.

## Trial Policy Rules

- Default trial duration is configured separately from message content.
- The default duration is calculated from the real account creation date.
- Applying a new default duration to existing customers is always an explicit admin action.
- A manual customer-specific trial grant starts at execution time, not at account creation time, and behaves as an independent fresh trial override at the lifecycle level.
