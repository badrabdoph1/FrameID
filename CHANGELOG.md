# Changelog

## 2026-07-11 — Backup and disaster recovery

- Rebuilt the super-admin backup workspace and fixed the Prisma field mismatch that crashed the page.
- Made GitHub the mandatory external backup destination for completed backups.
- Added local verification before upload and remote verification after upload.
- Added restore-from-GitHub when the local artifact is missing.
- Enforced GitHub retention of the latest 20 database backups and 10 full backups.
- Added restore locking, audit events, path validation, and `pg_restore` validation for PostgreSQL custom dumps.
- Added a production backup runner that starts with the Node process and does not depend on user traffic.
- Routed migration-package creation through the normal verified `FULL` backup pipeline.
- Disabled legacy local-only snapshot and automatic-restore behavior.
- Updated backup production-readiness documentation and recorded the GitHub storage architecture decision.
