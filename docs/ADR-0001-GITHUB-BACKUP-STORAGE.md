# ADR-0001: GitHub is the official external backup store

Status: Accepted

Date: 2026-07-11

## Context

FrameID separates platform-owned content from customer-owned runtime data.

Platform code, templates, themes, public content, documentation, and repository-managed configuration belong in Git. Customer accounts, sites, subscriptions, orders, messages, uploaded files, and operational records belong in PostgreSQL and uploads.

The backup system must survive deletion of the Railway project without changing this source-of-truth model.

## Decision

GitHub is the only external backup store in the current architecture.

- `DATABASE` backups are stored in `frameid-backups-database` by default.
- `FULL` backups are stored in `frameid-backups-full` by default.
- A backup becomes `COMPLETED` only after local creation, local verification, GitHub upload, and remote GitHub verification.
- Restore downloads from GitHub when the local cache is missing.
- Retention is enforced remotely: 20 database backups and 10 full backups.
- Local-only snapshot and automatic restore paths are legacy-disabled because they bypass the verified GitHub pipeline.
- No S3, R2, B2, or other object-storage provider is part of this decision.

## Consequences

Production must provide a GitHub token with read/write permission to the backup repository and branches. Missing or invalid credentials cause backup jobs to fail rather than report a misleading success.

A complete customer-data migration requires a verified `FULL` backup because database-only backups do not include uploads.

Adding another storage provider requires a separate ADR and feature scope.
