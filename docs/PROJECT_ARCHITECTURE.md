# Project Architecture

## Responsibility

This file describes how FrameID is currently structured across system boundaries. Architectural rationale belongs in [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md); implementation rules belong in [PROJECT_CONVENTIONS.md](PROJECT_CONVENTIONS.md); subsystem detail belongs under [docs/features/](features/README.md).

## Official Reference Model

The repository code is the **Executable Source of Truth** because it represents the behavior that actually runs.

The `docs/` directory is the **Official Knowledge Base** for understanding that implementation, its architecture, decisions, feature boundaries, conventions, roadmap, and delivery rules.

Documentation is not a competing runtime source of truth. If code and documentation differ, inspect the code first, identify the mismatch, correct the wrong side, and restore alignment before completing the task.

## System Purpose

FrameID is a multi-tenant SaaS platform that provisions and publishes photographer websites. It includes customer onboarding and dashboard workflows, public sites, reusable themes/templates, subscriptions and lifecycle controls, media management, payment workflows, backups, and a role-based administration area.

## Runtime Stack

- Next.js 15 App Router
- React 19 and TypeScript
- Prisma 6
- PostgreSQL
- Server Components, Client Components, Route Handlers, and Server Actions
- Vitest for tests and ESLint for static analysis
- Node.js 20+

## High-Level Layers

### 1. Presentation Layer

Located primarily under `src/app/` and `src/components/`.

- Marketing and public routes
- Customer dashboard routes
- Admin routes
- Public site route under the site slug
- Client components for interactivity, preview, uploads, and guided flows

Presentation code must not become a second owner of business rules.

### 2. Application/Domain Layer

Located primarily under `src/modules/`.

This layer owns reusable behavior such as:

- authentication and session resolution;
- signup provisioning;
- customer lifecycle synchronization;
- theme/template registry and starter content;
- media upload validation and persistence coordination;
- admin RBAC and guards;
- public-site read models;
- payments, backups, and operational workflows.

Business rules should be implemented here when they are reused or represent product policy.

### 3. Persistence Layer

- `prisma/schema.prisma` is the database-shape contract.
- PostgreSQL is the authoritative runtime store for customer and operational data.
- Prisma repositories and Prisma-backed services adapt domain operations to PostgreSQL.
- Migrations and compatibility scripts under `prisma/` and `scripts/` protect deployment continuity.

Do not create parallel JSON files, client stores, caches, or configuration records that compete with persisted customer or operational data.

### 4. Platform Content Layer

Git-versioned platform content includes executable theme/template definitions, starter content, supported sections, defaults, migrations, documentation, and architecture decisions.

The Template Content Source and registry are the authoritative contract for platform template content. Database template/theme records hold operational state and supported overrides, not an independent renderer contract.

### 5. Operational Layer

- Package scripts define build, validation, database deployment, seed, backup, and restore commands.
- GitHub Actions validates type safety, linting, focused tests, diagnostics, and production builds.
- Railway-compatible startup uses the safe database deployment command before starting the application.

## Primary Runtime and Knowledge Owners

| Concern | Official owner |
|---|---|
| Executable behavior | Repository code |
| Official system understanding and governance | `docs/` Official Knowledge Base |
| Platform code and platform-owned content | Git repository |
| Database shape | `prisma/schema.prisma` |
| Customer and operational runtime data | PostgreSQL through Prisma |
| Platform template content and executable compatibility | Template Content Source, theme/template definitions, and `theme-registry.ts` |
| Template operational state and supported overrides | PostgreSQL `Theme` and `Template` records constrained by the code contract |
| Customer site content | Tenant-scoped normalized site tables, media metadata, and content snapshots in PostgreSQL |
| Uploaded binary content | Approved storage provider; ownership and metadata remain in PostgreSQL |
| Authentication sessions | `Session` rows plus hashed opaque cookie tokens |
| Admin authorization | Role/permission definitions and server-side admin permission guards |
| Subscription/trial state | Tenant, subscription, lifecycle services, and admin lifecycle settings |
| Public URL | Platform URL resolver and site slug/domain records |
| Architectural rationale | `docs/ARCHITECTURE_DECISIONS.md` |
| Development conventions | `docs/PROJECT_CONVENTIONS.md` |
| Feature delivery status | `docs/ROADMAP.md` |
| Change history | Git history, audit logs, and `docs/CHANGELOG.md` |

## Data Ownership Boundary

Platform-owned definitions and customer-owned content must remain separate.

- Git owns platform definitions and defaults.
- PostgreSQL owns customer and operational records.
- Starter content is materialized into customer records during provisioning.
- Later template changes must not silently overwrite customer content.
- Destructive content replacement requires an explicit workflow and a prior content snapshot.

## Multi-Tenancy

A `User` owns one or more `Tenant` records. Tenant-owned data includes sites, media assets, subscriptions, payments, notifications, support cases, audit records, feature flags, and lifecycle events. Queries and mutations must remain tenant-scoped.

## Compatibility Principles

- Existing sites must continue to render after template or schema evolution.
- Soft-deleted records must remain excluded from normal reads.
- Template version and content snapshots must be considered before changing a template contract.
- Deployment scripts must protect databases that may have drifted across previous Prisma versions.
- Public routes must not depend on admin-only or client-only state.
- Stable template codes, routes, slugs, enum values, and persisted identifiers must not be reused for incompatible behavior.

## Documentation Scope Rule

Core architecture files describe cross-system boundaries only. Detailed subsystem behavior belongs in the matching file under [docs/features/](features/README.md). Do not copy feature manuals into this file.

## Architectural Change Rule

Any change that adds a layer, moves data ownership, changes module boundaries, changes a runtime owner, or changes a cross-module contract must update in the same commit:

- this file;
- [DATA_FLOW.md](DATA_FLOW.md) when flow changes;
- the related domain and feature documentation;
- [CHANGELOG.md](CHANGELOG.md);
- [ROADMAP.md](ROADMAP.md) when delivery status changes;
- [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) when the decision changes.

If this document and the implementation disagree, inspect the code first and restore alignment before completing the task.
