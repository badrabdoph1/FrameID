# Backup Architecture

This document is the maintained backup and restore contract for FrameID. It must be updated in the same commit as any change to backup formats, storage, verification, scheduling, retention, restore, or operational recovery.

## Supported backup types

- `DATABASE` — PostgreSQL state.
- `UPLOADS` — files under the configured upload storage.
- `FULL` — coordinated database, uploads, and content recovery package.

Package commands are defined in `package.json`: `backup`, `restore`, `backup:db`, `backup:uploads`, and `backup:full`.

## Main components

The backup subsystem under `src/modules/backups/` contains the orchestration and adapters for:

- backup job execution;
- PostgreSQL dump and restore;
- uploads/content archive packaging;
- manifests and SHA-256 verification;
- local and provider-based artifact storage;
- encryption where configured;
- retention cleanup;
- scheduling and locking;
- startup health checks;
- trial restore/validation;
- admin backup-center read models;
- auto-restore safeguards.

The exact implementation files are the executable source of truth. This document governs their boundaries.

## Persistent operational state

Prisma models and enums record backup/restore execution and administrative settings. `BackupType` supports `DATABASE`, `UPLOADS`, and `FULL`. `BackupStatus` supports `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `VERIFICATION_FAILED`, and `UPLOAD_FAILED`.

A generated artifact is not considered recoverable until storage and verification complete successfully.

## Backup creation flow

1. An authorized admin, CLI command, or scheduler requests a backup.
2. A backup job is created and locked against conflicting execution.
3. The service collects relevant counts and platform metadata.
4. According to type, it creates a PostgreSQL dump and/or packages uploads/content.
5. A manifest records type, platform/schema information, artifact inventory, sizes, and checksums.
6. Artifacts are written through the configured storage provider.
7. Verification confirms manifest/checksum/artifact integrity.
8. The job is marked completed or with a precise failure state.
9. Audit and retention operations run.

## Restore flow

1. Resolve an eligible completed backup.
2. Verify the manifest, checksums, and required artifacts.
3. Create a separate restore job and acquire the restore lock.
4. Restore database and/or file artifacts into explicitly configured targets.
5. Run post-restore validation and record the outcome.
6. Release locks and retain diagnostics without leaking secrets.

Never restore from failed, unverified, missing, or incompatible artifacts.

## Database recovery

Database backups must be able to reconstruct the PostgreSQL state required by users, tenants, sites, templates, subscriptions, media metadata, content, admin state, and audit records. Restore tooling must use argument arrays rather than shell-interpolated commands and must not log credentials.

## Upload recovery

`MediaAsset` rows reference stored bytes through URLs and storage keys. Database and uploads must therefore be restored as a compatible pair. Restoring one side without the other can leave broken media references.

## Full backups

A full backup is the preferred disaster-recovery unit. Its manifest must unambiguously pair database, uploads, and content artifacts and identify platform/schema compatibility.

## Verification and health

Verification must check, as applicable:

- backup directory/provider object availability;
- valid manifest structure;
- checksum match;
- required artifact presence and non-zero size;
- compatibility metadata;
- restore-tool availability;
- storage readability/writability;
- age and status of the latest usable backup.

Trial restore is stronger evidence than archive existence and should be used before changing production recovery assumptions.

## Scheduling and locks

Backup schedules are stored in platform settings and triggered by the supported scheduled endpoint/runner. Scheduler authorization must use server-side secrets. Database/in-memory locks prevent overlapping backup or restore operations.

## Retention and cleanup

Retention must coordinate persistent job/manifest records with stored artifacts. Deleting only one side creates either storage leakage or false recoverability. Cleanup must be auditable and must never delete the only known usable backup without explicit policy.

## Security

- restrict backup and restore operations through admin RBAC;
- keep database URLs, encryption keys, provider tokens, and cron secrets server-only;
- avoid secrets and unnecessary personal data in logs/manifests;
- encrypt artifacts when required by the configured provider/policy;
- validate archive extraction paths and command arguments;
- audit manual backup, restore, deletion, and settings changes.

## Change checklist

Any backup change requires:

1. implementation and failure-mode tests;
2. schema/migration review;
3. restore compatibility review;
4. updates to this file and `DATA_FLOW.md`;
5. a `CHANGELOG.md` entry stating breaking and migration impact;
6. successful typecheck, lint, relevant tests, and production build.