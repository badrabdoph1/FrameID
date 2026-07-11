# Project Architecture

## Responsibility

This file describes how FrameID is currently structured. Architectural rationale belongs in `ARCHITECTURE_DECISIONS.md`; implementation rules belong in `PROJECT_CONVENTIONS.md`.

## System purpose

FrameID is a multi-tenant SaaS platform that provisions and publishes photographer websites. It includes customer onboarding and dashboard workflows, public sites, reusable themes/templates, subscriptions and lifecycle controls, media management, payment workflows, backups, and a role-based administration area.

## Runtime stack

- Next.js 15 App Router
- React 19 and TypeScript
- Prisma 6
- PostgreSQL
- Server Components, Client Components, Route Handlers, and Server Actions
- Vitest for tests and ESLint for static analysis
- Node.js 20+

## High-level layers

### 1. Presentation layer

Located primarily under `src/app/` and `src/components/`.

- Marketing and public routes
- Customer dashboard routes
- Admin routes
- Public site route under the site slug
- Client components for interactivity, preview, uploads, and guided flows

Presentation code must not become a second owner of business rules.

### 2. Application/domain layer

Located primarily under `src/modules/`.

This layer owns reusable behavior such as:

- authentication and session resolution
- signup provisioning
- customer lifecycle synchronization
- theme/template registry and starter content
- media upload validation and persistence coordination
- admin RBAC and guards
- public-site read models
- payments, backups, and operational workflows

Business rules should be implemented here when they are reused or represent product policy.

### 3. Persistence layer

- `prisma/schema.prisma` is the database-shape contract.
- PostgreSQL is the authoritative runtime store for customer and operational data.
- Prisma repositories and Prisma-backed services adapt domain operations to PostgreSQL.
- Migrations and compatibility scripts under `prisma/` and `scripts/` protect deployment continuity.

Do not create parallel JSON files, client stores, caches, or configuration records that compete with persisted customer or operational data.

### 4. Platform content layer

Git-versioned platform content includes executable theme/template definitions, starter content, supported sections, defaults, migrations, documentation, and architecture decisions.

The Template Content Source and registry are the authoritative contract for platform template content. Database template/theme records hold operational state and supported overrides, not an independent renderer contract.

### 5. Operational layer

- Package scripts define build, validation, database deployment, seed, backup, and restore commands.
- GitHub Actions validates type safety, linting, focused tests, diagnostics, and production builds.
- Railway-compatible startup uses the safe database deployment command before starting the application.

## Primary sources of truth

| Concern | Source of truth |
|---|---|
| Platform code and platform-owned content | Git repository |
| Database shape | `prisma/schema.prisma` |
| Customer and operational runtime data | PostgreSQL through Prisma |
| Platform template content and executable compatibility | Template Content Source, theme definitions, template definitions, and `theme-registry.ts` |
| Template operational state and supported overrides | PostgreSQL `Theme` and `Template` records constrained by the code-defined contract |
| Customer site content | tenant-scoped normalized site tables, media metadata, and content snapshots in PostgreSQL |
| Uploaded binary image content | approved storage provider; ownership and metadata remain in PostgreSQL |
| Authentication sessions | `Session` rows plus hashed opaque cookie tokens |
| Admin authorization | role/permission definitions and server-side admin permission guards |
| Subscription/trial state | tenant, subscription, lifecycle services, and admin lifecycle settings |
| Public URL | platform URL resolver and site slug/domain records |
| Architectural rationale | `docs/ARCHITECTURE_DECISIONS.md` |
| Development conventions | `docs/PROJECT_CONVENTIONS.md` |
| Change history | Git history, audit logs, and `docs/CHANGELOG.md` |

## Data ownership boundary

Platform-owned definitions and customer-owned content must remain separate.

- Git owns platform definitions and defaults.
- PostgreSQL owns customer and operational records.
- Starter content is materialized into customer records during provisioning.
- Later template changes must not silently overwrite customer content.
- Destructive content replacement requires an explicit workflow and a prior content snapshot.

## Multi-tenancy

A `User` owns one or more `Tenant` records. Tenant-owned data includes sites, media assets, subscriptions, payments, notifications, support cases, audit records, feature flags, and lifecycle events. Queries and mutations must remain tenant-scoped.

## Compatibility principles

- Existing sites must continue to render after template or schema evolution.
- Soft-deleted records must remain excluded from normal reads.
- Template version and content snapshots must be considered before changing a template contract.
- Deployment scripts must protect databases that may have drifted across previous Prisma versions.
- Public routes must not depend on admin-only or client-only state.
- Stable template codes, routes, slugs, enum values, and persisted identifiers must not be reused for incompatible behavior.

## Architectural change rule

Any change that adds a layer, moves data ownership, changes module boundaries, changes a source of truth, or changes a cross-module contract must update this file, `DATA_FLOW.md`, the related domain document, `CHANGELOG.md`, and `ARCHITECTURE_DECISIONS.md` when the decision itself changes, all within the same commit.

If this document and the implementation disagree, inspect the code first and restore alignment before completing the task.