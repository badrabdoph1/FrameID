# FrameID Enterprise Super Admin Console — Implementation Plan

This document is the execution blueprint for transforming the current FrameID admin area from an MVP console into an enterprise-grade SaaS operating console.

## Current implementation wave

Branch: `feature/enterprise-admin-console-foundation`

This wave focuses on foundation capabilities that unblock the next admin modules:

1. Permission guard foundation.
2. Real global search page at `/admin/search`.
3. Real Audit Explorer at `/admin/audit`.
4. Real Feature Flags Console at `/admin/feature-flags`.
5. Navigation updates to expose the new operational surfaces.
6. Audit logging for feature flag mutations.

## Architectural direction

The Super Admin Console should be built around operating workflows, not only CRUD tables.

The long-term information architecture is:

1. Command Center
2. Customers & Tenancy
3. Sites & Publishing
4. Content Platform
5. Design System
6. Billing & Revenue
7. Support & Success
8. Growth & Analytics
9. Operations
10. Security & Governance
11. System Settings

## Phase 1 — Admin foundation

### Goals

- Make admin access permission-aware, not only session-aware.
- Replace dead/placeholder operational pages with real tools.
- Provide a single search entrypoint across core entities.
- Make audit data discoverable and useful.
- Make feature flags manageable with auditability.

### Delivered in this branch

#### 1. Permission guards

Added `src/modules/admin/admin-permission-guards.ts`.

It provides:

- `requireAdminPermission(center, action)`
- `requireAdminCenter(center)`

These guards build on the existing RBAC definitions and give new admin pages a reusable server-side authorization layer.

#### 2. Global Search

Added `/admin/search` as a real Command Center surface.

It searches across:

- customers / tenants
- users
- sites
- payment requests
- subscriptions
- templates
- themes
- media assets
- support cases
- error logs
- audit logs
- backup jobs
- feature flags
- notification logs

The first version is direct Prisma search. Later phases should move heavy search to a dedicated indexed search layer.

#### 3. Audit Explorer

Replaced the placeholder audit page with a functional explorer.

It includes:

- text search
- action filter
- entity filter
- tenant filter
- date range filters
- pagination
- actor display
- tenant linking
- metadata expansion
- high-risk action stats
- top entity/action summaries

#### 4. Feature Flags Console

Replaced the placeholder feature flags page with a functional console.

It supports:

- platform-scoped flags
- tenant-scoped flags
- site-scoped flags
- JSON value payloads
- enable / disable
- create / update
- delete
- filtering by key, scope, state
- audit logging for every mutation

#### 5. Navigation

Updated admin navigation to expose:

- Global Search under Command Center
- Audit Explorer under Operations
- Feature Flags under System / Security & Governance

## Phase 2 — Command Center

Build the real admin home around operational queues:

- pending payment reviews
- trials expiring soon
- failed backups
- critical errors
- support SLA breaches
- suspicious security events
- failed domain verifications
- high-risk feature rollouts

## Phase 3 — Customer 360 Workspace

Upgrade the customer detail page into a complete Customer 360 workspace:

- account overview
- owner user
- sites
- subscription lifecycle
- payment history
- media usage
- support cases
- notifications
- admin notes
- sessions
- impersonation
- audit timeline
- risk score

## Phase 4 — Site Workspace

Build a site-level workspace:

- publishing state
- public URLs
- domains
- theme/template
- sections
- media
- packages
- extras
- contact profile
- SEO
- performance
- publishing history
- feature flags
- audit

## Phase 5 — Billing & Revenue Console

Expand billing from payment review into a revenue operating system:

- payment request workspace
- subscription workspace
- plans manager
- renewal workflow
- refunds
- invoices / receipts
- revenue dashboard
- activation funnel
- trial lifecycle automation

## Phase 6 — Content and Design Platform

Replace file-driven editing with enterprise content and design workflows:

- content drafts
- version history
- preview
- approvals
- scheduled publish
- rollback
- template versions
- theme versions
- media manager
- SEO manager

## Phase 7 — Operations and Governance

Add the missing enterprise operational surfaces:

- background jobs queue
- email delivery center
- API keys
- webhooks
- admin users
- roles and permissions UI
- access reviews
- MFA policy
- impersonation center
- data retention
- export controls

## Risk notes

The current project still contains architecture risks that must be handled in future work:

1. Admin identity is split between `User` roles and `AdminUser` / `AdminSession`.
2. Some existing audit writes may use admin IDs that do not necessarily reference `User.id`.
3. `npm start` currently runs `prisma db push --accept-data-loss`, which should not be used for production startup.
4. Several admin pages are still placeholders.
5. RBAC is currently code-defined and should evolve into DB-managed roles and granular permissions.
6. Search is currently direct database search and should later be indexed.

## Definition of done for the full console

The admin console should be considered enterprise-ready only when:

- every high-risk mutation is permission-checked server-side
- every high-risk mutation writes audit logs
- every major entity has a workspace
- every admin can find entities through global search
- every operational queue has owner, status, SLA, and next action
- feature flags are auditable and reversible
- backups and restores require protected workflows
- support, billing, customer success, and security are integrated into one operating model
