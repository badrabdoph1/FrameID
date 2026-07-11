# Backup production readiness

## Current production execution

The application starts `startProductionBackupRunner()` from `src/instrumentation.ts` when the Node.js production server starts. The runner executes immediately after every restart and then every minute. It does not depend on an admin page, a user visit, or a Server Action.

`BackupSettings.nextRunAt` is used as a database-backed claim. `updateMany` atomically moves the next run before executing a backup, preventing two application instances from claiming the same scheduled run in normal operation.

Environment controls:

- `BACKUP_SCHEDULER_ENABLED=false` disables the runner.
- `BACKUP_SCHEDULER_INTERVAL_MS` changes the polling interval. Default: 60000.

## Restore safety

Before restore the system now verifies:

- the backup record is completed;
- the artifact path is inside the configured backup root;
- the manifest exists and parses;
- the manifest checksum matches;
- all required files exist;
- the PostgreSQL custom dump can be read by `pg_restore --list`;
- no other restore is PENDING or RUNNING.

Database restore uses `pg_restore`, not `psql`, because backups are produced by `pg_dump --format=custom` and then gzip-compressed.

Restore lifecycle events are written to AuditLog: RESTORE_STARTED, RESTORE_COMPLETED, RESTORE_FAILED, and RESTORE_REJECTED.

## Critical remaining production requirement

Backup artifacts are still stored on the application filesystem under `backups/`. This is not sufficient for disaster recovery if the Railway project or its storage is deleted.

Before claiming full disaster recovery readiness, configure an external durable storage provider outside Railway, such as Cloudflare R2, Amazon S3, or Backblaze B2, and ensure every completed backup is uploaded and periodically restore-tested from that provider.

Until external durable storage is configured and tested, deleting the Railway project can delete the only copy of backup artifacts.

## Migration runbook

A complete migration requires:

1. Clone the matching Git commit recorded in the manifest.
2. Provision PostgreSQL and set `DATABASE_URL`.
3. Install PostgreSQL client tools (`pg_dump`, `pg_restore`, `psql`) and `tar`.
4. Obtain the FULL backup artifact from durable external storage.
5. Run restore against the new database and uploads directory.
6. Run Prisma deployment compatibility steps for the target commit.
7. Run post-restore validation and application smoke tests.

A DATABASE-only backup does not include uploads. A FULL backup is required for complete migration.
