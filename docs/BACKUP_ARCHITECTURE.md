# Backup Architecture — FrameID V3

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backup Types](#2-backup-types)
3. [System Components](#3-system-components)
4. [Data Flow](#4-data-flow)
5. [Auto-Backup (Scheduler)](#5-auto-backup-scheduler)
6. [Auto-Restore](#6-auto-restore)
7. [Disaster Recovery](#7-disaster-recovery)
8. [Restore Validation (Trial Restore)](#8-restore-validation-trial-restore)
9. [Startup Health Check](#9-startup-health-check)
10. [Health Dashboard](#10-health-dashboard)
11. [Encryption](#11-encryption)
12. [Retention Policy](#12-retention-policy)
13. [Concurrency Locks](#13-concurrency-locks)
14. [Storage Providers](#14-storage-providers)
15. [GitHub Storage](#15-github-storage)
16. [Prisma Schema](#16-prisma-schema)
17. [Environment Variables](#17-environment-variables)
18. [Migration: Railway → Any Host](#18-migration-railway--any-host)
19. [Step-by-Step Restore](#19-step-by-step-restore)
20. [External Dependencies](#20-external-dependencies)
21. [Security Notes](#21-security-notes)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Backup Job Service                           │
│                    (backup-job-service.ts)                          │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌────────────────┐  │
│   │ Database │  │ Uploads  │  │  Content   │  │   Artifact     │  │
│   │  Dumper  │  │ Packager │  │  Packager  │  │    Writer      │  │
│   └────┬─────┘  └────┬─────┘  └─────┬──────┘  └───────┬────────┘  │
│        │              │              │                  │           │
│        ▼              ▼              ▼                  ▼           │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │                 Backup Package Creator                   │     │
│   │     copies artifacts → computes SHA256 → writes dir     │     │
│   └────────────────────────┬────────────────────────────────┘      │
│                            │                                       │
│                            ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │              Retention Service (cleanup)                 │     │
│   └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│   Prisma: BackupJob → BackupManifest → RestoreJob → AuditLog       │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory Layout

```
backups/
├── 2026-07-08_14-30/         # backupId = UTC timestamp
│   ├── manifest.json         # metadata + checksum
│   ├── checksum.sha256       # SHA-256 of manifest.json
│   ├── database.sql.gz       # pg_dump | gzip (custom format)
│   ├── uploads.tar.gz        # tar -czf of public/uploads/
│   └── content.tar.gz        # tar -czf of content/
│
└── 2026-07-08_02-00/
    └── ...
```

### File Inventory (`src/modules/backups/`)

| File | Role |
|------|------|
| `backup-job-service.ts` | **Orchestrator** — coordinates full backup pipeline |
| `backup-package-creator.ts` | Creates timestamped dir, copies artifacts, computes checksum |
| `backup-restore-service.ts` | Validates, previews, executes restores (psql + tar) |
| `backup-encryption.ts` | AES-256-GCM + PBKDF2 (600k iterations, SHA-512) |
| `backup-startup-health.ts` | 15+ health checks on start |
| `backup-center-view-model.ts` | Admin dashboard view model with metrics |
| `backup-restore-validator.ts` | Trial restore in isolated temp DB |
| `backup-snapshot-service.ts` | Ad-hoc FULL snapshots outside job system |
| `backup-verification-service.ts` | Verifies individual/all backups (dir, manifest, checksum, files) |
| `backup-manifest.ts` | `BackupManifest` type, create/validate, SHA-256, file integrity |
| `backup-database-dumper.ts` | `pg_dump` piped through gzip |
| `backup-content-packager.ts` | `tar -czf` of `content/` |
| `backup-uploads-packager.ts` | `tar -czf` of `public/uploads/` |
| `local-backup-artifact-writer.ts` | Writes manifest.json + checksum.sha256, lists/reads dirs |
| `prisma-backup-job-repository.ts` | Prisma implementation of `BackupJobRepository` |
| `backup-auto-restore-service.ts` | Detects empty DB → auto-restores latest backup |
| `backup-retention.ts` | Retention policy enforcer |
| `backup-scheduler.ts` | Cron-expression matcher + scheduled executor |
| `backup-locks.ts` | In-memory + DB-backed mutex locks |
| `backup-storage-github.ts` | GitHub as backup storage (orphan branches) |
| `storage/storage-provider.ts` | Abstract `StorageProvider` interface |
| `storage/local-storage-provider.ts` | Filesystem implementation |
| `storage/storage-factory.ts` | Factory (local, future S3/R2/B2) |

---

## 2. Backup Types

| Type | Contents | Use case |
|------|----------|----------|
| `DATABASE` | `database.sql.gz` | Frequent (every 6h) |
| `UPLOADS` | `uploads.tar.gz` | Media files (every 24h) |
| `FULL` | `database.sql.gz` + `uploads.tar.gz` + `content.tar.gz` | Daily full snapshot |

---

## 3. System Components

### 3.1 BackupJobService (`backup-job-service.ts`)

The central orchestrator. Accepts a `BackupJobRepository` (Prisma), creates jobs, coordinates dump → package → write → verify → retain → audit.

Key method: `_executeBackup()` (private, shared by `runManualBackup` and `runScheduledBackup`)

```typescript
createBackupJobService({
  repository,       // BackupJobRepository
  databaseUrl,      // postgresql://...
  uploadsDir,       // default: public/uploads/
  contentDir,       // default: content/
  backupRoot,       // default: backups/
  backupEncryptionKey, // optional AES key
  platformVersion,  // npm_package_version
  gitCommitSha,     // optional
})
```

### 3.2 BackupPackageCreator (`backup-package-creator.ts`)

- Generates `backupId` as `YYYY-MM-DD_HH-MM` (UTC)
- Creates `${backupRoot}/${backupId}/` dir
- Copies artifacts: `database.sql.gz`, `uploads.tar.gz`, `content.tar.gz`
- Writes `manifest.json` (with `BackupManifest` type)
- Computes SHA-256 of manifest → writes `checksum.sha256`

### 3.3 DatabaseDumper (`backup-database-dumper.ts`)

- Uses `spawn` (not execSync) with argument array (no shell injection)
- Pipes: `pg_dump --format=custom --no-owner --compress=0` → `gzip`
- Also reads migration version from `_Migration` table

### 3.4 UploadsPackager / ContentPackager

- Uses `spawn('tar', ['-czf', dest, '-C', parentDir, dirName])`
- Safe: argument array, not string interpolation

### 3.5 VerificationService (`backup-verification-service.ts`)

Per-backup checks:
- Backup directory exists
- `manifest.json` exists + valid JSON
- `checksum.sha256` exists + matches manifest SHA-256
- `database.sql.gz` exists + non-empty (unless UPLOADS-only)
- `uploads.tar.gz` exists + non-empty (unless DATABASE-only)
- `content.tar.gz` exists + non-empty (FULL only)

### 3.6 SnapshotService (`backup-snapshot-service.ts`)

Creates ad-hoc FULL backups independent of the job system. Used for manual snapshots via admin UI.

### 3.7 RetentionService (`backup-retention.ts`)

- Sorts backup dirs by mtime (newest first)
- Deletes oldest beyond `retentionCount`
- Returns count of deleted backups

---

## 4. Data Flow

### Backup Creation Flow

```
User/API/Scheduler
     │
     ▼
BackupJobService.executeBackup()
     │
     ├── repository.createJob()          ─── BackupJob (RUNNING)
     ├── repository.recordAudit()        ─── AuditLog
     │
     ├── repository.collectStats()       ─── user/tenant/site/media counts
     │
     ├── DatabaseDumper.dumpDatabase()   ─── database.sql.gz (spawn pg_dump | gzip)
     ├── UploadsPackager.packageUploads()─── uploads.tar.gz     (spawn tar)
     ├── ContentPackager.packageContent()─── content.tar.gz     (spawn tar)
     │
     ├── DatabaseDumper.getMigrationVersion()
     │
     ├── createBackupManifest()          ─── typed BackupManifest
     ├── addChecksumToManifest()         ─── SHA-256 of manifest
     │
     ├── createBackupPackage()           ─── copies to backups/<backupId>/
     ├── writer.writeBackup()            ─── manifest.json + checksum.sha256
     │
     ├── repository.saveManifest()       ─── BackupManifest (DB)
     ├── repository.markCompleted()      ─── BackupJob (COMPLETED)
     ├── repository.recordAudit()        ─── AuditLog
     │
     └── RetentionService.cleanup()      ─── delete oldest if > retentionCount
```

### Restore Flow

```
Admin UI / API
     │
     ▼
RestoreService.executeRestore(options)
     │
     ├── validateBackup()                ─── checks manifest + checksum + files
     │
     ├── [DATABASE] spawn psql           ─── gunzip → psql --dbname=<target>
     ├── [UPLOADS]  spawn tar -xzf       ─── tar → public/uploads/
     └── [FULL]     spawn tar -xzf       ─── tar → content/
```

### Verification Flow

```
VerificationService.verifyBackup(backupId, backupRoot)
     │
     ├── backupDir exists?
     ├── manifest.json exists? + valid JSON?
     ├── checksum.sha256 exists?
     ├── SHA-256(manifest.json) === checksum.sha256?
     ├── database.sql.gz exists? + non-empty?
     ├── uploads.tar.gz exists? + non-empty?
     └── content.tar.gz exists? + non-empty?
```

### Health Check Flow

```
runBackupHealthCheck({ prisma, backupRoot })
     │
     ├── Prisma: SELECT 1                       ─── DB connection?
     ├── which pg_dump / psql / tar             ─── Tools available?
     ├── existsSync(backupRoot)                 ─── Storage readable?
     ├── writeFile + unlink test file           ─── Storage writable?
     ├── readdir + stat(backupRoot)             ─── Total backup count
     ├── du -sb backupRoot/                     ─── Storage used
     ├── verifyAllBackups(backupRoot)           ─── Corrupted count
     ├── Prisma: last BackupJob                 ─── Last backup age
     ├── Prisma: last RestoreJob                ─── Last restore age
     ├── Prisma: count enabled settings         ─── Scheduler active?
     └── Build issue list                       ─── healthStatus
```

---

## 5. Auto-Backup (Scheduler)

### Cron Expressions

Settings stored in `BackupSettings` table:

| Field | Example | Description |
|-------|---------|-------------|
| `type` | `DATABASE` | Backup type |
| `enabled` | `true` | Active? |
| `schedule` | `0 */6 * * *` | Standard 5-field cron (UTC) |
| `retentionCount` | `10` | Max backups to keep |

The `scheduled/route.ts` endpoint:
1. Reads all enabled `BackupSettings`
2. For each, checks `shouldRunNow()` — hour + dayOfWeek + cooldown (≥23h since last run)
3. If time matches, creates backup job service and runs `runManualBackup`

To trigger: `GET /api/backups/scheduled` with `Authorization: Bearer <CRON_SECRET>`

### External Cron Setup

```bash
# Every hour, let the app decide what to run
curl -X GET https://your-app.com/api/backups/scheduled \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

#### Railway Cron
```json
{
  "cron": {
    "schedule": "0 * * * *",
    "path": "/api/backups/scheduled"
  }
}
```

---

## 6. Auto-Restore

### Trigger
When the database is detected as **empty** (0 tables in `information_schema.tables`).

### Flow
```
AutoRestoreService.checkAndRestore({ databaseUrl, backupRoot, uploadsDir, contentDir })
     │
     ├── isDatabaseEmpty(url)?             ─── psql COUNT(information_schema.tables)
     │
     ├── if NOT empty → return (needed: false)
     │
     ├── listBackupDirs(backupRoot)        ─── find latest backup
     │   └── if no backups → return (needed: true, restored: false)
     │
     ├── validateBackup(latest)            ─── integrity check
     │   └── if invalid → return (needed: true, restored: false)
     │
     └── executeRestore(latest, FULL/DATABASE)  ─── restore to production DB
```

### Use Case
- Fresh deployment on new host (Railway, VPS, Docker)
- Corrupted database after failed migration
- Restoring from backup after data loss

---

## 7. Disaster Recovery

### Recovery Process

```bash
# 1. Set up environment
export DATABASE_URL="postgresql://..."
export BACKUP_DIR="./backups"

# 2. Copy backup directory to new host
scp -r backups/ user@new-host:/app/backups/

# 3. Run auto-restore check (if DB is empty)
# The app will auto-detect on startup or via admin UI

# 4. Manual restore via UI
# Admin → Backups → Select backup → Restore → FULL

# 5. Verify
# Admin → Backups → Health Dashboard shows green
```

### What Gets Restored

| Component | Source | Target |
|-----------|--------|--------|
| PostgreSQL database | `database.sql.gz` (pg_dump custom format → gunzip → psql) | `DATABASE_URL` |
| Uploaded media | `uploads.tar.gz` (tar -xzf) | `public/uploads/` |
| Content files | `content.tar.gz` (tar -xzf) | `content/` |

### Post-Restore Validation

After restore, `validatePostRestore()` runs 17 queries to verify data integrity:
- User, Tenant, Site, MediaAsset, Subscription counts
- PaymentRequest, BackupSettings, Theme, Template counts
- SEOSettings, GalleryAlbum, GalleryImage, Package, ExtraService counts
- ContactProfile, AdminUser counts

---

## 8. Restore Validation (Trial Restore)

### Purpose
Validate backup integrity without touching production data.

### Flow
```
RestoreValidationScheduler.runTrialRestore({ backupId, databaseUrl, backupRoot })
     │
     ├── Backup validation (manifest + checksum + files)
     │
     ├── Create temp database:
     │     <original_db>_test_restore_<timestamp>
     │
     ├── Create temp directories:
     │     /tmp/frameid-trial-restore-<random>/
     │
     ├── Full restore into temp environment
     │
     ├── Post-restore validation (17 table counts)
     │
     └── Cleanup (always in `finally`):
           ├── Drop test database (pg_terminate_backend + dropdb)
           └── rm -rf temp directory
```

### Garbage Collection
- Test database: `pg_terminate_backend()` + `dropdb --if-exists`
- Temp directory: `rm()` with `recursive: true`
- Both run in `finally` block — guaranteed cleanup even on failure

---

## 9. Startup Health Check

### Endpoint: `GET /api/health`

Checks run on every application start via `backup-startup-health.ts`:

| Check | Method | Failure Impact |
|-------|--------|---------------|
| DB Connection | `SELECT 1` | Critical |
| pg_dump available | `which pg_dump` | Can't backup DB |
| psql available | `which psql` | Can't restore DB |
| tar available | `which tar` | Can't package/extract archives |
| Storage readable | `existsSync(backupRoot)` | Can't read backups |
| Storage writable | `writeFileSync` + `unlinkSync` | Can't write backups |
| Last backup age | Prisma query | Warning if >48h |
| Last restore age | Prisma query | Info |
| Corrupted backups | `verifyAllBackups()` | Warning if found |
| Overdue backups | Prisma query | Warning |
| Scheduler active | Prisma count | Info |
| Total backup count | readdir + stat | Info |
| Storage used | `du -sb` | Info |

---

## 10. Health Dashboard

### Endpoint: `buildBackupCenterViewModel()`

Returns `BackupCenterViewModel` with:

```
healthStatus: "healthy" | "warning" | "critical"
healthMetrics: [
  Total Backups, Valid, Corrupted, Success Rate (30d),
  Restore Success Rate, Avg Duration, Avg Size,
  Storage Used, Last Backup, Last Restore,
  Scheduler, pg_dump / psql / tar, DB Connection, Storage
]
backupSummary: { total, valid, invalid, totalSizeBytes, storageUsedBytes, averageDurationMs, averageSizeBytes }
restoreSummary: { total, successful, failed }
schedulerStatus: { active, enabledCount }
storageStatus: { readable, writable, pgDumpAvailable, psqlAvailable, tarAvailable }
recentActivity: [ { id, type, status, timestamp, sizeBytes } ]
issues: string[]
```

### UI: `/admin/backups`

- Alert banner for critical/warning issues
- 16 health cards in responsive grid
- Quick actions: Create Snapshot, Auto-Restore Check, Verify All
- Create backup buttons (DATABASE / UPLOADS / FULL)
- Settings editor (schedule, retention, enabled toggle)
- Local backup list with restore/verify/delete actions
- Job history panel
- Restore history panel

---

## 11. Encryption

### Algorithm
- **Cipher**: AES-256-GCM
- **Key derivation**: PBKDF2 with SHA-512, 600,000 iterations
- **Salt**: 32 random bytes
- **IV**: 16 random bytes
- **Auth tag**: 16 bytes (GCM provides authentication)

### File Format
```
┌─────────────────────────────────────────────────┐
│ Salt (32B) │ IV (16B) │ Auth Tag (16B) │ Data   │
└─────────────────────────────────────────────────┘
```

### Usage
```typescript
const result = await encryptBackupFile("/path/to/dump.sql.gz", encryptionKey);
// result.encryptedFilePath → "/path/to/dump.sql.gz.encrypted"

const decrypted = await decryptBackupFile("/path/to/dump.sql.gz.encrypted", encryptionKey);
```

### Key Generation
```typescript
const key = generateEncryptionKey();  // 64 hex chars (32 bytes)
```

### Configuration
Set `BACKUP_ENCRYPTION_KEY` environment variable to enable encryption.
Encryption status is recorded in manifest: `encryptionEnabled: boolean`.

---

## 12. Retention Policy

### Service: `backup-retention.ts`

```typescript
retention.cleanup(backupRoot, retentionCount)
```

- Reads all directories in `backupRoot`
- Sorts by modification time (newest first)
- If count > `retentionCount`, deletes oldest entries with `rm({ recursive: true })`

### Default retention: 10 backups
### Configured per `BackupSettings.retentionCount`

---

## 13. Concurrency Locks

### Two implementations:

**MemoryBackupLock** (`backup-locks.ts`)
- In-process Map with 30-minute TTL
- Used for single-instance deployments

**DatabaseBackupLock**
- Checks for `RUNNING` BackupJobs within 30 minutes
- Used for multi-instance deployments

```typescript
const lock = createMemoryBackupLock();
const acquired = await lock.acquire("DATABASE");  // false if already running
// ... do backup ...
await lock.release("DATABASE");
```

---

## 14. Storage Providers

### Interface: `StorageProvider`

```typescript
type StorageProvider = {
  name: string;
  upload({ backupDir, backupId, files }): Promise<{ url, sizeBytes }>;
  download({ backupId, destDir }): Promise<string>;
  listBackups(): Promise<BackupFile[]>;
  deleteBackup(backupId): Promise<void>;
  getBackupSize(backupId): Promise<number>;
};
```

### Implementations

| Provider | Status | Description |
|----------|--------|-------------|
| `LocalStorageProvider` | ✅ Active | Filesystem storage at `backupRoot` |
| GitHub | ✅ Active | Orphan git branches (see §15) |
| S3 / R2 / B2 | 🔜 Future | Via `StorageFactory` |

### Factory: `storage-factory.ts`

```typescript
createStorageProvider({ type: "local" }, backupRoot)
// Future: createStorageProvider({ type: "s3", ... }, backupRoot)
```

---

## 15. GitHub Storage

### File: `backup-storage-github.ts`

Uses **orphan git branches** as backup storage. Each backup push creates a new commit on an orphan branch with only backup files.

### Flow

```
uploadBackup(backupDir, backupId, branch)
     │
     ├── git init temp repo
     ├── git checkout --orphan <branch>
     ├── cp -r backupDir/* .
     ├── git add -A
     ├── git commit -m "backup <backupId>"
     └── git push --force origin <branch>
```

### Security
- Token never embedded in clone URL
- Uses `GIT_ASKPASS` environment variable instead of URL embedding
- All git operations use `spawn` with argument arrays

### Configuration
```
BACKUP_GITHUB_TOKEN=ghp_...
BACKUP_GITHUB_REPO=owner/repo
BACKUP_GITHUB_BRANCH=platform-backups
```

---

## 16. Prisma Schema

### BackupSettings
```prisma
model BackupSettings {
  id             String     @id @default(cuid())
  type           BackupType @unique
  enabled        Boolean    @default(false)
  schedule       String
  retentionCount Int        @default(10)
  compression    String     @default("zstd")
  encryption     Boolean    @default(true)
  githubBranch   String     @default("platform-backups")
  lastRunAt      DateTime?
  nextRunAt      DateTime?
  updatedAt      DateTime   @updatedAt
}
```

### BackupJob
```prisma
model BackupJob {
  id             String            @id @default(cuid())
  type           BackupType
  status         BackupStatus      @default(PENDING)
  trigger        String
  initiatedById  String?
  note           String?
  sizeBytes      Int?
  checksumSha256 String?
  localPath      String?
  githubPath     String?
  startedAt      DateTime?
  completedAt    DateTime?
  createdAt      DateTime          @default(now())
  manifest       BackupManifest?
  initiatedBy    User?             @relation("BackupInitiator")
}
```

### BackupManifest
```prisma
model BackupManifest {
  id                       String    @id @default(cuid())
  backupJobId              String    @unique
  platformVersion          String
  gitCommitSha             String?
  databaseMigrationVersion String?
  usersCount               Int
  tenantsCount             Int
  sitesCount               Int
  mediaFilesCount          Int
  compressedSizeBytes      Int
  compressionAlgorithm     String
  encryptionEnabled        Boolean
  sha256Checksum           String
  localVerificationStatus  String
  githubUploadStatus       String
  durationMs               Int?
  uploadDurationMs         Int?
  createdAt                DateTime  @default(now())
  backupJob                BackupJob @relation
}
```

### RestoreJob
```prisma
model RestoreJob {
  id                String    @id @default(cuid())
  backupId          String
  backupJobId       String?
  type              BackupType
  status            String    @default("PENDING")
  initiatedById     String?
  manifest          Json?
  validationJson    Json?
  resultJson        Json?
  postValidationJson Json?
  startedAt         DateTime?
  completedAt       DateTime?
  errorMessage      String?
  createdAt         DateTime  @default(now())
  initiatedBy      User?     @relation("RestoreInitiator")
}
```

---

## 17. Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

### Backup-Specific
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BACKUP_DIR` | Local backup storage path | `./backups` | No |
| `BACKUP_ENCRYPTION_KEY` | AES-256-GCM key (64 hex chars) | — | No |
| `BACKUP_GITHUB_TOKEN` | GitHub token for git backup | — | No |
| `BACKUP_GITHUB_REPO` | Repo slug for git backup | auto-detect | No |
| `BACKUP_GITHUB_BRANCH` | Orphan branch name | `platform-backups` | No |
| `CRON_SECRET` | Auth token for scheduled endpoint | — | Recommended |

### Platform
| Variable | Description |
|----------|-------------|
| `npm_package_version` | Used as `platformVersion` in manifests |

---

## 18. Migration: Railway → Any Host

### Step 1: Copy backups

```bash
# From Railway
railway run cat backups/manifest.json
railway run tar -czf /tmp/backups.tar.gz backups/
railway run cat /tmp/backups.tar.gz > ./backups.tar.gz

# To new host
tar -xzf backups.tar.gz
```

### Step 2: Set environment variables

```bash
export DATABASE_URL="postgresql://..."
export BACKUP_DIR="/app/backups"
export CRON_SECRET="your-secret"
```

### Step 3: Install system dependencies

```bash
# Ubuntu/Debian
apt-get install postgresql-client tar

# Alpine
apk add postgresql-client tar

# Docker
FROM node:20-slim
RUN apt-get update && apt-get install -y postgresql-client tar
```

### Step 4: Set up cron

```bash
# crontab -e
0 * * * * curl -X GET https://your-app.com/api/backups/scheduled -H "Authorization: Bearer ${CRON_SECRET}"
```

### Railway-Specific Notes

- `railway.json` healthcheck path is `/api/health` (standard)
- No Railway-specific imports in code
- No `RAILWAY_*` env vars required
- `DATABASE_URL` is a standard PostgreSQL URL (provided by Railway but works everywhere)

---

## 19. Step-by-Step Restore

### Via Admin UI

1. Navigate to `/admin/backups`
2. Find the backup in "النسخ المحلية" section
3. Click:
   - `استعادة قاعدة البيانات` — restore only DB
   - `استعادة الملفات` — restore only uploads
   - `استعادة الكل` — full restore
4. Wait for completion
5. Check "سجل الاستعادة" for status

### Via API

```bash
curl -X POST https://your-app.com/api/backups/restore \
  -H "Content-Type: application/json" \
  -d '{
    "backupId": "2026-07-08_14-30",
    "type": "FULL"
  }'
```

### Manual via CLI (backup files exist)

```bash
# Database
gunzip -c backups/2026-07-08_14-30/database.sql.gz | \
  psql "$DATABASE_URL"

# Uploads
tar -xzf backups/2026-07-08_14-30/uploads.tar.gz \
  -C public/uploads/

# Content
tar -xzf backups/2026-07-08_14-30/content.tar.gz \
  -C content/
```

### Verify After Restore

```bash
# Check table counts
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\""
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"Site\""
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"MediaAsset\""
```

Or run the built-in health check:
```bash
curl https://your-app.com/api/health
```

---

## 20. External Dependencies

### System Tools (MUST be installed)

| Tool | Used By | Installation |
|------|---------|-------------|
| `pg_dump` | Database backup | `postgresql-client` package |
| `psql` | Database restore + validation | `postgresql-client` package |
| `tar` | File packaging + extraction | Usually pre-installed |
| `git` | GitHub storage | `git` package |
| `which` | Tool availability check | Usually pre-installed |
| `du` | Storage size calculation | Usually pre-installed |
| `createdb` | Trial restore setup | `postgresql-client` package |
| `dropdb` | Trial restore cleanup | `postgresql-client` package |

### Runtime

| Dependency | Purpose |
|------------|---------|
| Node.js ≥18 | Runtime |
| PostgreSQL ≥14 | Target database |
| Prisma ORM | Database access layer |

### Optional

| Dependency | Purpose |
|------------|---------|
| GitHub Token (`BACKUP_GITHUB_TOKEN`) | Remote backup storage |
| Cron daemon | Scheduled backup trigger |

---

## 21. Security Notes

### Hardening Applied (V2 → V3)

| Issue | Fix |
|-------|-----|
| `tar -C "/"` in restore | Fixed to `-C targetDir` via `spawn` argument array |
| `verifyFileChecksum` was no-op | Replaced with real SHA-256 file hash |
| Command injection in packagers | Replaced `execSync` with `spawn` + argument arrays |
| MD5-based IV derivation | Replaced with PBKDF2/SHA-512, 600k iterations |
| GitHub token in clone URL | Uses `GIT_ASKPASS` env var instead |
| Unauthenticated backup endpoint | Requires `Authorization: Bearer <CRON_SECRET>` |

### Authentication

- `POST /api/backups/run` — requires `Authorization: Bearer <CRON_SECRET>`
- `GET /api/backups/scheduled` — requires `Authorization: Bearer <CRON_SECRET>`
- Admin UI — protected by `requireSuperAdminSession()`

### Encryption At Rest

- AES-256-GCM with per-file random IV and salt
- 600,000 PBKDF2 iterations (SHA-512)
- Enabled by setting `BACKUP_ENCRYPTION_KEY`

---

## Appendix: Quick Reference

### Key API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/backups/run` | POST | `CRON_SECRET` | Trigger backup |
| `/api/backups/scheduled` | GET | `CRON_SECRET` | Run scheduled backups |
| `/api/health` | GET | Public | Health check |

### Key Server Actions (Admin UI)

All in `admin/backups/actions.ts`:
- `runBackupAction` — Create backup
- `restoreBackupAction` — Restore from backup
- `verifyBackupAction` / `verifyAllBackupsAction` — Verify integrity
- `deleteBackupAction` — Delete backup
- `createSnapshotAction` — Create ad-hoc snapshot
- `checkAutoRestoreAction` — Check if auto-restore needed
- `updateBackupSettingsAction` — Update schedule/retention/enabled

### Common Commands

```bash
# List backups
ls -1 backups/

# Check health
curl https://your-app.com/api/health | jq .

# Trigger backup
curl -X POST https://your-app.com/api/backups/run \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type": "DATABASE"}'

# Verify all backups
curl -X POST https://your-app.com/api/backups/verify-all \
  -H "Authorization: Bearer $CRON_SECRET"
```
