CREATE TYPE "CustomerIssueStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED', 'CLOSED');
CREATE TYPE "CustomerIssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "CustomerIssueSource" AS ENUM ('CUSTOMER_REPORT', 'INTERNAL_AUTO', 'ADMIN_REPORT');

CREATE TABLE "CustomerIssue" (
  "id" TEXT NOT NULL,
  "number" SERIAL NOT NULL,
  "status" "CustomerIssueStatus" NOT NULL DEFAULT 'NEW',
  "priority" "CustomerIssuePriority" NOT NULL DEFAULT 'MEDIUM',
  "source" "CustomerIssueSource" NOT NULL DEFAULT 'CUSTOMER_REPORT',
  "title" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "customerNote" TEXT,
  "resolutionNote" TEXT,
  "userId" TEXT,
  "tenantId" TEXT,
  "siteId" TEXT,
  "sessionId" TEXT,
  "assigneeAdminUserId" TEXT,
  "resolvedByAdminUserId" TEXT,
  "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewStartedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "customerNotifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerIssueEvent" (
  "id" TEXT NOT NULL,
  "issueId" TEXT NOT NULL,
  "actorAdminId" TEXT,
  "type" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerIssueEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ErrorLog"
  ADD COLUMN "issueId" TEXT,
  ADD COLUMN "errorType" TEXT,
  ADD COLUMN "fingerprint" TEXT,
  ADD COLUMN "method" TEXT,
  ADD COLUMN "url" TEXT,
  ADD COLUMN "stack" TEXT,
  ADD COLUMN "digest" TEXT,
  ADD COLUMN "cause" TEXT,
  ADD COLUMN "tenantId" TEXT,
  ADD COLUMN "siteId" TEXT,
  ADD COLUMN "sessionId" TEXT,
  ADD COLUMN "adminUserId" TEXT,
  ADD COLUMN "sourceArea" TEXT,
  ADD COLUMN "sourceFile" TEXT,
  ADD COLUMN "sourceLine" INTEGER,
  ADD COLUMN "sourceColumn" INTEGER,
  ADD COLUMN "ipAddress" TEXT,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "browser" TEXT,
  ADD COLUMN "device" TEXT,
  ADD COLUMN "os" TEXT,
  ADD COLUMN "language" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "screenSize" TEXT,
  ADD COLUMN "referrer" TEXT,
  ADD COLUMN "connectionStatus" TEXT,
  ADD COLUMN "environment" TEXT,
  ADD COLUMN "releaseVersion" TEXT,
  ADD COLUMN "buildVersion" TEXT,
  ADD COLUMN "templateCode" TEXT,
  ADD COLUMN "lastAction" TEXT;

CREATE UNIQUE INDEX "CustomerIssue_number_key" ON "CustomerIssue"("number");
CREATE INDEX "CustomerIssue_status_priority_createdAt_idx" ON "CustomerIssue"("status", "priority", "createdAt");
CREATE INDEX "CustomerIssue_fingerprint_status_updatedAt_idx" ON "CustomerIssue"("fingerprint", "status", "updatedAt");
CREATE INDEX "CustomerIssue_tenantId_siteId_status_idx" ON "CustomerIssue"("tenantId", "siteId", "status");
CREATE INDEX "CustomerIssue_userId_status_idx" ON "CustomerIssue"("userId", "status");
CREATE INDEX "CustomerIssue_assigneeAdminUserId_status_idx" ON "CustomerIssue"("assigneeAdminUserId", "status");
CREATE INDEX "CustomerIssueEvent_issueId_createdAt_idx" ON "CustomerIssueEvent"("issueId", "createdAt");
CREATE INDEX "CustomerIssueEvent_actorAdminId_createdAt_idx" ON "CustomerIssueEvent"("actorAdminId", "createdAt");
CREATE INDEX "ErrorLog_fingerprint_createdAt_idx" ON "ErrorLog"("fingerprint", "createdAt");
CREATE INDEX "ErrorLog_issueId_createdAt_idx" ON "ErrorLog"("issueId", "createdAt");
CREATE INDEX "ErrorLog_tenantId_siteId_createdAt_idx" ON "ErrorLog"("tenantId", "siteId", "createdAt");

ALTER TABLE "CustomerIssue" ADD CONSTRAINT "CustomerIssue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerIssue" ADD CONSTRAINT "CustomerIssue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerIssue" ADD CONSTRAINT "CustomerIssue_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerIssue" ADD CONSTRAINT "CustomerIssue_assigneeAdminUserId_fkey" FOREIGN KEY ("assigneeAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerIssue" ADD CONSTRAINT "CustomerIssue_resolvedByAdminUserId_fkey" FOREIGN KEY ("resolvedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerIssueEvent" ADD CONSTRAINT "CustomerIssueEvent_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CustomerIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerIssueEvent" ADD CONSTRAINT "CustomerIssueEvent_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CustomerIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
