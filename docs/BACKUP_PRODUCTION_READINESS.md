# Backup production readiness

## Architecture decision

FrameID uses GitHub as the only external backup store in the current architecture.

- Git is the source of truth for platform code, templates, themes, public platform content, documentation, and platform configuration stored in the repository.
- PostgreSQL and uploaded files are the source of truth for customer data.
- Customer backups are stored externally in GitHub backup branches.
- Object storage providers are intentionally outside the scope of this architecture.

Default backup branches:

- `frameid-backups-database`
- `frameid-backups-full`

The repository can be overridden with `BACKUP_GITHUB_REPOSITORY`. GitHub access requires `BACKUP_GITHUB_TOKEN` with permission to read and write the backup branches.

## Completion contract

A backup is not marked `COMPLETED` until all of these steps succeed:

1. Create the local database dump and optional uploads archive.
2. Create the manifest and checksums.
3. Verify the local artifact.
4. Upload the artifact to GitHub.
5. Read and verify the artifact from GitHub.
6. Store the GitHub location and verification metadata in the database.
7. Mark the backup `COMPLETED`.

Any failure before step 7 marks the backup `FAILED`. Local filesystem success alone is never treated as backup success.

## Automatic backups

`startProductionBackupRunner()` starts from `src/instrumentation.ts` with the production Node server. It runs immediately after restart and then polls every minute by default. It does not depend on opening the admin panel, visiting the public site, or invoking a Server Action.

`BackupSettings.nextRunAt` is claimed atomically before execution to prevent duplicate scheduled runs under normal multi-instance operation.

Environment controls:

- `BACKUP_SCHEDULER_ENABLED=false` disables the runner.
- `BACKUP_SCHEDULER_INTERVAL_MS` changes the polling interval.

## Verification

Local verification checks the manifest, checksum file, required files, non-empty database dump, and required uploads archive for `FULL` backups.

Remote verification reads the uploaded artifact from GitHub and checks the manifest, checksum, required files, and sizes before the database record is completed.

Restore validation additionally checks that the PostgreSQL custom dump can be read by `pg_restore --list`.

## Restore behavior

The admin restore workflow uses GitHub as the official external source.

- When the local artifact exists, it is verified before restore.
- When the local artifact is missing, the system downloads it from GitHub, verifies it locally, and then restores it.
- A corrupt, incomplete, or unverifiable backup is rejected.
- Concurrent restore jobs are rejected.
- Restore lifecycle events are written to `AuditLog`.
- PostgreSQL custom dumps are restored with `pg_restore`, not `psql`.

Legacy local-only automatic restore is disabled. Legacy local-only snapshot creation is also disabled. The migration action in the admin workspace creates a normal `FULL` backup through the official GitHub pipeline.

## Retention

Retention is applied to GitHub and local cache copies after a verified successful upload:

- Keep the latest 20 `DATABASE` backups.
- Keep the latest 10 `FULL` backups.

Older artifacts are removed automatically from their corresponding GitHub backup branch.

## Migration runbook

A complete migration requires:

1. Clone the Git commit recorded in the backup manifest, or a compatible later commit.
2. Provision a new PostgreSQL database and set `DATABASE_URL`.
3. Configure `BACKUP_GITHUB_TOKEN` and the backup repository/branch settings.
4. Install PostgreSQL client tools (`pg_dump`, `pg_restore`, `psql`) and `tar`.
5. Select the latest verified `FULL` backup from the admin backup workspace.
6. Download from GitHub automatically if the artifact is not present locally.
7. Verify the artifact.
8. Restore PostgreSQL and uploads.
9. Run Prisma deployment compatibility steps.
10. Run post-restore validation and application smoke tests.

A `DATABASE` backup does not contain uploads. A `FULL` backup is required to restore customer database data and uploaded files together.

## Production readiness status

The code path is production-ready when the required GitHub token and repository permissions are configured in the production environment. Without valid GitHub credentials, backup jobs intentionally fail and are never reported as completed.
