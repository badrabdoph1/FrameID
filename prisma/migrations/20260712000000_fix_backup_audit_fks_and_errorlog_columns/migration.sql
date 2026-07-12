-- Fix: Remove broken FK constraints where AdminUser IDs were stored
-- but the FK referenced the User table.
-- Also add missing ErrorLog columns that Prisma schema expects.

-- 1. Drop FK constraints that cause FK violations on backup/audit/restore
ALTER TABLE "BackupJob" DROP CONSTRAINT IF EXISTS "BackupJob_triggeredById_fkey";
ALTER TABLE "RestoreJob" DROP CONSTRAINT IF EXISTS "RestoreJob_triggeredById_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorId_fkey";

-- 2. Add all missing ErrorLog columns
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "errorType" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "fingerprint" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "method" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "url" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "stack" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "digest" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "cause" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "siteId" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "adminUserId" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "sourceArea" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "sourceFile" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "sourceLine" INTEGER;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "sourceColumn" INTEGER;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "browser" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "device" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "os" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "language" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "timezone" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "screenSize" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "referrer" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "connectionStatus" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "environment" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "releaseVersion" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "buildVersion" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "templateCode" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "lastAction" TEXT;
ALTER TABLE "ErrorLog" ADD COLUMN IF NOT EXISTS "issueId" TEXT;

-- 3. Add missing ErrorLog indexes
CREATE INDEX IF NOT EXISTS "ErrorLog_fingerprint_createdAt_idx" ON "ErrorLog"("fingerprint", "createdAt");
CREATE INDEX IF NOT EXISTS "ErrorLog_issueId_createdAt_idx" ON "ErrorLog"("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "ErrorLog_tenantId_siteId_createdAt_idx" ON "ErrorLog"("tenantId", "siteId", "createdAt");

-- 4. Add missing Theme.updatedAt column (required by Prisma schema)
ALTER TABLE "Theme" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW();
