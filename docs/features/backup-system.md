# Backup System

## Goal

Protect PostgreSQL data, uploaded files, and complete recoverable platform state through verified backup and restore workflows.

## Components

- backup job orchestration;
- database dumping;
- uploads/content packaging;
- manifests and checksums;
- restore jobs;
- scheduling, retention, locks, verification, and storage providers.

## Data Flow

An admin, script, or scheduler creates a backup job. The service collects the requested artifacts, packages them, writes integrity metadata, persists job state, verifies output, and applies retention. Restore validates the selected artifact before applying database or file changes.

## Important Files

- `src/modules/backups/`
- `src/scripts/backup-run.ts`
- `src/scripts/backup-restore.ts`
- `prisma/schema.prisma`
- `docs/BACKUP_ARCHITECTURE.md`

## Development Notes

Keep orchestration in backup services, never bypass verification for destructive restore operations, document storage or retention changes, and preserve compatibility with existing backup artifacts where feasible.
