# Subscriptions

## Goal

Control tenant access through trial, active subscription, expiration, grace-period, past-due, cancellation, and suspension states.

## Components

- tenant trial fields;
- subscription records and statuses;
- lifecycle settings;
- lifecycle synchronization services;
- lifecycle events;
- admin controls and customer access checks.

## Data Flow

Signup provisioning creates the tenant trial using the configured duration. Request/session resolution may synchronize lifecycle state against the current time. Subscription or payment changes update persisted state, and public/customer access checks consume the resulting tenant and site status.

## Important Files

- `src/modules/lifecycle/`
- signup provisioning modules
- current session/request services
- subscription/admin routes under `src/app/`
- `prisma/schema.prisma`
- `docs/DATA_FLOW.md`

## Development Notes

Treat lifecycle transitions as domain policy, not UI logic. Preserve historical events, avoid silent trial-duration changes, and document any new state or transition in the database, data-flow, feature, and changelog documentation.
