# Database Architecture

## Database contract

FrameID uses PostgreSQL through Prisma. `prisma/schema.prisma` is the authoritative schema. Generated Prisma types, repositories, migrations, compatibility scripts, seeds, and this document must remain aligned.

## Core model groups

### Identity and sessions

- `User` — account identity, role, optional password hash, verification, soft deletion.
- `Session` — hashed session token, expiry, revocation, activity and client metadata.
- `PasswordResetToken` — single-use, expiring password recovery token.

### Tenant and lifecycle

- `Tenant` — customer workspace, owner, status, trial dates/days, grace period.
- `Subscription` — commercial state and trial/active/expired lifecycle.
- `LifecycleEvent` — recorded lifecycle transitions.
- `FeatureFlag` — platform, tenant, or site-scoped behavior flags.

### Site and publishing

- `Site` — tenant site, theme, slug, template code/version, publication state/version/timestamp.
- `Domain` — custom hostname and verification state.
- `SiteThemeConfig` — site/theme-specific configuration.
- `SiteSection` — ordered, visible structured sections.
- `SiteContentSnapshot` — append-only content state captured for recovery/compatibility reasons.
- `SEOSettings` — title, description, social image, canonical and indexing configuration.

### Themes and templates

- `Theme` — code, version, status, category, default configuration, content schema.
- `Template` — theme-linked template code, version, status, showroom order, optional cover asset, preview data and settings.

Code-defined registry and database records serve different roles: code defines the executable compatibility contract; database records manage operational/admin state. They must not drift.

### Customer content

- `ContactProfile` — studio identity, biography, contact/social links, location and avatar/cover references.
- `Package` and `ExtraService` — customer commercial offerings.
- `GalleryAlbum` and `GalleryImage` — ordered portfolio content and cover/featured state.
- `MediaAsset` — tenant-owned stored media metadata and safe storage reference.

### Payments, support and operations

- `PaymentRequest`, payment account/settings models, and related enums.
- `Notification`, `SupportCase`, `AdminNote`, and `AuditLog`.
- `BackupJob` and `RestoreJob` for operational recovery.
- `ImpersonationSession` for controlled support access.

## Relationship rules

- Tenant-owned records must be queried through their tenant or site boundary.
- A site belongs to one tenant and one theme.
- Template records belong to themes, while sites persist template code/version for compatibility.
- Media assets belong to tenants; domain records reference media by ID rather than user-provided storage paths.
- Gallery images reference both album and media asset.
- Sessions and password-reset tokens reference users.

## Soft deletion

Many models contain `deletedAt`. Normal reads must exclude soft-deleted rows. Hard deletion should be reserved for approved cleanup, privacy, or operational workflows that understand relations and retained artifacts.

## Indexing principles

Existing indexes target common boundaries and lifecycle queries, including:

- role/status plus deletion state
- tenant/site ownership
- session expiry/revocation
- site publication status
- template/theme ordering
- gallery ordering
- media tenant/kind/creation time
- template code/version snapshots

New high-volume query patterns require an index review and documentation update.

## Schema evolution

1. Update `prisma/schema.prisma`.
2. Determine whether the change is additive, compatible, or breaking.
3. Add an explicit migration or compatibility/recovery script where needed.
4. Update repositories, services, seeds, tests, deployment scripts, and documentation.
5. Record the change in `CHANGELOG.md`, including migration and breaking-change status.
6. Validate against databases that may contain historic drift before production deployment.

The current deployment process runs schema compatibility logic, targeted recovery SQL, Prisma push, and seed. Changes to that sequence are operational architecture changes and require explicit documentation.

## Prohibited patterns

- parallel persistence in local JSON for data already owned by Prisma;
- unscoped tenant queries;
- raw SQL in application requests when Prisma can express the operation;
- changing enums or required columns without a compatibility plan;
- deleting historical changelog or snapshot data to hide schema evolution.