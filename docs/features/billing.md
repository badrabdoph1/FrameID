# Billing

## Goal

Track customer payment requests, payment accounts, proofs, review state, and billing-related administration without mixing billing policy into presentation code.

## Components

- payment requests and statuses;
- supported payment methods;
- payment accounts and QR assets;
- payment settings;
- reviewer/admin workflows;
- audit and notification integration.

## Data Flow

A tenant submits or creates a payment request, optionally with proof media. Billing/admin workflows review the request, update its status, and record the responsible reviewer and related audit information. Approved billing state may affect subscription and lifecycle behavior through the relevant services.

## Important Files

- `src/modules/payments/`
- billing/admin routes under `src/app/(admin)/admin/`
- customer billing routes under `src/app/`
- `prisma/schema.prisma`
- `docs/DATA_FLOW.md`

## Development Notes

Keep payment state transitions server-side, permission-protected, and auditable. Do not store proof binaries directly in business records; use the media pipeline and references. Document changes to payment states, providers, or approval rules.
