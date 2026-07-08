# Disaster Recovery Playbook

> الإجراء الكامل لاستعادة النظام بالكامل بعد فقدان البنية التحتية

## Overview

This playbook documents the complete procedure to recover the FrameID platform
from a total infrastructure loss (e.g., Railway account deleted, database
dropped, volume wiped, migration to new hosting).

**Recovery Time Objective (RTO):** < 30 minutes with latest backup
**Recovery Point Objective (RPO):** Depends on backup schedule
  - Database: Daily at 02:00 UTC
  - Uploads: Daily at 03:00 UTC
  - Full: Weekly on Sunday at 04:00 UTC

---

## Prerequisites

Before a disaster occurs, ensure:

| Item | Status | Notes |
|---|---|---|
| GitHub repository access | ✅ | Source code in Git |
| Latest backup on GitHub branch | ⚠️ | Requires BACKUP_GITHUB_TOKEN |
| Database credentials | ✅ | In .env / Railway variables |
| Node.js 20+ | ✅ | Documented in .nvmrc |
| PostgreSQL 16 | ⚠️ | New instance needed after disaster |
| pg_dump / pg_restore | ✅ | Bundled with PostgreSQL |
| gzip / tar | ✅ | Available on all Unix systems |

---

## Recovery Procedure

### Scenario: Total Railway Loss

If Railway account/project is completely deleted:

### Step 1: Clone Repository

```bash
git clone <repository-url> frameid
cd frameid
nvm use 20
npm install
```

### Step 2: Create PostgreSQL Database

```bash
# Option A: Local Docker
docker run -d \
  --name frameid-postgres \
  -e POSTGRES_USER=frameid \
  -e POSTGRES_PASSWORD=<password> \
  -e POSTGRES_DB=frameid \
  -p 5432:5432 \
  postgres:16-alpine

# Option B: Railway (new project)
# 1. Create new Railway project
# 2. Add PostgreSQL plugin
# 3. Copy DATABASE_URL

# Option C: Any VPS
# apt install postgresql-16
# sudo -u postgres createuser frameid -P
# sudo -u postgres createdb frameid -O frameid
```

### Step 3: Configure Environment

```bash
cp .env.example .env
# Edit .env with:
# - DATABASE_URL from new PostgreSQL
# - SESSION_SECRET (generate new: openssl rand -hex 32)
# - NEXT_PUBLIC_APP_URL
```

### Step 4: Restore from Backup

**If backup is on local filesystem:**

```bash
# List available backups
ls -la backups/

# Full restore (database + uploads + content)
npm run restore -- 2026-07-08_02-00 FULL

# Or step by step:
npm run restore -- 2026-07-08_02-00 DATABASE
npm run restore -- 2026-07-08_02-00 UPLOADS
```

**If backup is on GitHub branch:**

```bash
# Clone the backups branch
git clone --branch platform-backups <repository-url> frameid-backups

# Copy the desired backup
cp -r frameid-backups/backups/2026-07-08_02-00 frameid/backups/

# Run restore
cd frameid
npm run restore -- 2026-07-08_02-00 FULL
```

**Manual restore (if CLI is unavailable):**

```bash
# 1. Restore database
gunzip -c backups/2026-07-08_02-00/database.sql.gz | psql "$DATABASE_URL"

# 2. Restore uploads
tar -xzf backups/2026-07-08_02-00/uploads.tar.gz -C public/uploads/

# 3. Restore content
tar -xzf backups/2026-07-08_02-00/content.tar.gz -C content/

# 4. Verify checksum
cd backups/2026-07-08_02-00
sha256sum -c checksum.sha256
```

### Step 5: Deploy

```bash
# Build the application
npm run build

# Run database migrations (if any schema changes since backup)
npm run db:migrate

# Start the application
npm run start
```

### Step 6: Verify Recovery

```bash
# Check health endpoint
curl https://<your-domain>/api/health

# Run post-restore validation
npm run restore -- 2026-07-08_02-00 --verify-only
```

---

## Backup File Structure

Each backup is stored in:

```
backups/
  YYYY-MM-DD_HH-mm/
    database.sql.gz      # PostgreSQL dump (pg_dump custom format, gzip compressed)
    uploads.tar.gz       # Uploaded files archive
    content.tar.gz       # Content JSON files archive
    manifest.json        # Backup metadata and integrity information
    checksum.sha256      # SHA-256 hash of manifest.json
```

### manifest.json Structure

```json
{
  "version": 1,
  "schemaVersion": 1,
  "backupType": "DATABASE | UPLOADS | FULL",
  "backupJobId": "cuid...",
  "createdAt": "2026-07-08T02:00:00.000Z",
  "appVersion": "0.1.0",
  "gitCommitSha": "abc123...",
  "databaseVersion": "20260708040000_add_restore_job",
  "usersCount": 150,
  "tenantsCount": 45,
  "sitesCount": 60,
  "mediaFilesCount": 1200,
  "databaseSizeBytes": 52428800,
  "uploadsSizeBytes": 104857600,
  "contentSizeBytes": 102400,
  "totalSizeBytes": 157696000,
  "compressionAlgorithm": "gzip",
  "encryptionEnabled": false,
  "files": {
    "database": "database.sql.gz",
    "uploads": "uploads.tar.gz",
    "content": "content.tar.gz",
    "manifest": "manifest.json",
    "checksum": "checksum.sha256"
  },
  "checksum": "sha256hex..."
}
```

---

## Data Classification

| Data Type | Storage | Backed Up? | Restorable? |
|---|---|---|---|
| **Runtime Data** | PostgreSQL | ✅ pg_dump | ✅ Full restore |
| **Uploaded Files** | public/uploads/ | ✅ tar.gz | ✅ Full restore |
| **Content JSON** | content/ | ✅ tar.gz | ✅ Full restore |
| **Environment** | Railway Config | ✅ .env.backup | Manual |
| **Git History** | GitHub.com | ✅ Always | ✅ Clone |
| **Dependencies** | package-lock.json | ✅ Always | ✅ npm ci |

**Runtime Data includes:**
- Users, Tenants, Sites
- Sessions, Password Reset Tokens
- Subscriptions, Payments
- Gallery Albums, Gallery Images
- Packages, Extra Services
- SEO Settings, Social Links, Contact Data
- Themes, Templates, Site Theme Config
- Site Sections
- Audit Logs, Admin Notes, Support Cases
- Feature Flags, Error Logs, Notification Logs
- Backup Settings, Backup Jobs, Restore Jobs

**Not backed up (regenerated):**
- node_modules/ (recreated via npm install)
- .next/ (recreated via npm run build)
- Docker volumes (recreated by Docker)
- Session tokens (users re-login)

---

## Restoration Validation

Before restoration, the system validates:

1. **Manifest Integrity** - JSON is valid and contains all required fields
2. **Checksum Verification** - SHA-256 of manifest matches checksum.sha256
3. **File Integrity** - All required backup files exist
4. **Version Compatibility** - Manifest version is supported
5. **Schema Compatibility** - Schema version is compatible

After restoration, the system validates:

1. **User count** - All users restored
2. **Tenant count** - All tenants restored
3. **Site count** - All sites restored
4. **Media count** - All media assets restored
5. **Subscription count** - All subscriptions restored
6. **Content files** - All content JSON files restored
7. **Backup settings** - Configuration preserved

---

## Backup Retention Policy

| Type | Schedule | Retention | Locations |
|---|---|---|---|
| Database | Daily 02:00 UTC | 14 most recent | Local + GitHub (if configured) |
| Uploads | Daily 03:00 UTC | 14 most recent | Local + GitHub (if configured) |
| Full | Weekly Sunday 04:00 UTC | 8 most recent | Local + GitHub (if configured) |

Old backups are automatically cleaned up based on retention count.

---

## Security Considerations

- **Encryption:** Optional AES-256-CBC encryption when BACKUP_ENCRYPTION_KEY is set
- **Access:** Super Admin only in admin UI
- **GitHub:** Dedicated branch `platform-backups` (separate from main code)
- **Concurrent Backups:** Prevented via distributed locking (database-level)
- **Audit Trail:** All backup and restore operations are logged in AuditLog

---

## Monitoring

- Backup Center UI: `/admin/backups`
- Cron endpoint: `GET /api/backups/scheduled` (requires CRON_SECRET)
- Health check: `GET /api/health`
- Audit logs for all backup operations

---

## Failure Scenarios

| Scenario | Impact | Recovery |
|---|---|---|
| Railway account deleted | Total loss | DR Playbook Step 1-6 |
| Database corrupted | Data unavailable | Restore DATABASE backup |
| Uploads volume lost | Missing images | Restore UPLOADS backup |
| GitHub token expired | Can't push backups | Renew token, update .env |
| Disk full | Backup fails | Free space, or change backup root |
| Encryption key lost | Can't decrypt | Must have key backup in .env.backup |
