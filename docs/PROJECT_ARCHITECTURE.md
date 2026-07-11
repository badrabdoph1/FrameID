# Project Architecture

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

- `prisma/schema.prisma` is the database contract.
- Prisma repositories and Prisma-backed services adapt domain operations to PostgreSQL.
- Migrations and compatibility scripts under `prisma/` and `scripts/` protect deployment continuity.

Do not create parallel JSON files or client stores that compete with persisted domain data.

### 4. Operational layer

- package scripts define build, validation, database deployment, seed, backup, and restore commands.
- GitHub Actions validates type safety, linting, focused tests, diagnostics, and production builds.
- Railway-compatible startup uses the safe database deployment command before starting the application.

## Primary sources of truth

| Concern | Source of truth |
|---|---|
| Database shape | `prisma/schema.prisma` |
| Runtime persistence | PostgreSQL through Prisma |
| Theme/template code registry | theme definitions and `theme-registry.ts` |
| Template instances managed by admin | `Template` records plus code-defined compatibility contract |
| Customer site content | normalized site tables, media assets, and content snapshots |
| Authentication sessions | `Session` rows plus hashed cookie tokens |
| Admin authorization | role/permission definitions and admin permission guards |
| Subscription/trial state | tenant, subscription, lifecycle services, and admin lifecycle settings |
| Public URL | platform URL resolver and site slug/domain records |
| Change history | Git history, audit logs, and `docs/CHANGELOG.md` |

## Multi-tenancy

A `User` owns one or more `Tenant` records. Tenant-owned data includes sites, media assets, subscriptions, payments, notifications, support cases, audit records, feature flags, and lifecycle events. Queries and mutations must remain tenant-scoped.

## Compatibility principles

- Existing sites must continue to render after template or schema evolution.
- Soft-deleted records must remain excluded from normal reads.
- Template version and content snapshots must be considered before changing a template contract.
- Deployment scripts must protect databases that may have drifted across previous Prisma versions.
- Public routes must not depend on admin-only or client-only state.

## Architectural change rule

Any change that adds a new layer, moves ownership of data, changes module boundaries, or changes a cross-module contract must update this file, `DATA_FLOW.md`, `CHANGELOG.md`, and the related domain document in the same commit.