-- CreateTable: RestoreJob
CREATE TABLE IF NOT EXISTS "RestoreJob" (
    "id" TEXT NOT NULL,
    "backupId" TEXT NOT NULL,
    "backupJobId" TEXT,
    "type" "BackupType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "initiatedById" TEXT,
    "manifest" JSONB,
    "validationJson" JSONB,
    "resultJson" JSONB,
    "postValidationJson" JSONB,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RestoreJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RestoreJob_backupId_createdAt_idx" ON "RestoreJob"("backupId", "createdAt");
CREATE INDEX IF NOT EXISTS "RestoreJob_status_createdAt_idx" ON "RestoreJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "RestoreJob" ADD CONSTRAINT "RestoreJob_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
