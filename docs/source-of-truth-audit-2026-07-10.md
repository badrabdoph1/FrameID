# Source of Truth Audit — 2026-07-10

## Scope

This audit reviews FrameID data flow, platform-content source of truth, customer-data source of truth, backup taxonomy, retention, and migration readiness.

## Decisions

### Platform data

Platform-owned content must be file-backed and Git-backed. This includes marketing homepage content, navigation, footer, FAQ, legal pages, SEO metadata, platform settings, template registry, themes, plans, and payment settings.

The canonical source is the Git repository. PostgreSQL may keep compatibility/operational rows for runtime joins and admin dashboards, but it must not be treated as the canonical source for platform content.

### Customer data

Customer-owned and tenant-owned data must stay outside the repository. The canonical source is PostgreSQL plus uploaded files and the backup artifacts. Customer data must not be written into project files.

### Backup taxonomy

Only two operational backup types are supported:

1. `DATABASE` — Data Backup. PostgreSQL dump only. Scheduled every 24 hours. Retain the latest 20 successful data backups.
2. `FULL` — Full Backup. PostgreSQL dump plus uploads. Scheduled every 72 hours. Retain the latest 10 successful full backups.

The old `UPLOADS` type is treated as a legacy database enum value only. It is no longer exposed in the UI, scheduler, seed settings, or manual backup actions.

## Findings and fixes

### 1. Platform content edits did not commit to GitHub

Finding: `content` edits wrote JSON files under `content/`, but did not automatically create a GitHub commit.

Fix: added GitHub content sync. When `GITHUB_CONTENT_TOKEN` or `BACKUP_GITHUB_TOKEN` is available, saves commit the changed content file and manifest back to GitHub.

### 2. Platform content edits had no revision history

Finding: revision history was only implicit via backup copies.

Fix: added file-backed revision history at `content/revisions/log.json` and an admin page at `/admin/revisions`.

### 3. Content save action lacked an explicit admin edit guard

Finding: the server action called `saveContent` directly.

Fix: `saveContentAction` now requires `content:edit` before writing files.

### 4. Backups exposed three types instead of two

Finding: the system exposed `DATABASE`, `UPLOADS`, and `FULL`.

Fix: introduced a backup policy module and restricted UI/actions/scheduler to `DATABASE` and `FULL` only.

### 5. Full Backup included project content files

Finding: operational `FULL` backups included `content.tar.gz`, mixing Git source-of-truth with customer data backups.

Fix: operational `FULL` backups now include PostgreSQL and uploads only. Project content remains Git-backed.

### 6. Retention was global, not type-aware

Finding: retention counted all backup directories together, which could delete the wrong type.

Fix: retention is type-aware and keeps the latest successful backup safe even when newer backups are invalid.

### 7. Backup validation expected content archives

Finding: validation expected `content.tar.gz`, which is no longer part of operational backups.

Fix: validation now checks required files by backup type: database for `DATABASE`, database plus uploads for `FULL`.

## Final verification answers

1. Is code the only source for platform content?

Yes for file-backed platform content. Edits now write files and attempt GitHub commits. Seeded operational compatibility rows still exist in PostgreSQL for runtime compatibility but are not the canonical source.

2. Is PostgreSQL the only source for customer data?

Yes for structured customer data. Uploaded files remain in uploads and are covered by Full Backup.

3. Is there a conflict between platform and customer data?

Operational backup flow no longer mixes project content into customer backups. The two flows are separated.

4. Does the system satisfy the requested architecture?

The main data-flow separation and backup taxonomy are enforced in code. The UI and scheduler now expose only Data Backup and Full Backup.

5. Remaining caveat

The Prisma enum still contains legacy `UPLOADS` for database compatibility with existing deployments. It is no longer used by the application surface. Removing it from PostgreSQL should be done later through a controlled migration if the database has no legacy rows.

## Required environment for automatic Git commits

Set one of:

- `GITHUB_CONTENT_TOKEN`
- `BACKUP_GITHUB_TOKEN`

Optional:

- `GITHUB_REPOSITORY=badrabdoph-cell/FrameID`
- `GITHUB_CONTENT_BRANCH=main`

Without a token, content edits still update local files and revision history, but Git sync status is `not-configured`.
