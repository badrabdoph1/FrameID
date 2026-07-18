-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('MEDIA_SCAN', 'MEDIA_CLEANUP', 'MEDIA_PURGE', 'MEDIA_RESTORE', 'MEDIA_RESYNC', 'MEDIA_REPAIR', 'MEDIA_THUMBNAIL_REBUILD', 'MEDIA_COMPRESSION', 'BACKUP_INTEGRITY_CHECK');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('PENDING', 'RUNNING', 'PAUSE_REQUESTED', 'PAUSED', 'CANCEL_REQUESTED', 'CANCELLED', 'SUCCEEDED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "OperationItemStatus" AS ENUM ('PENDING', 'RUNNING', 'SKIPPED', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OperationEventLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "MediaLifecycleStatus" AS ENUM ('ACTIVE', 'IN_TRASH', 'PURGED');

-- CreateEnum
CREATE TYPE "MediaUsageStatus" AS ENUM ('USED', 'UNUSED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MediaCatalogSource" AS ENUM ('CUSTOMER_MEDIA', 'PLATFORM_MEDIA', 'STATIC_FILE', 'STORAGE_OBJECT', 'BACKUP_OBJECT');

-- CreateEnum
CREATE TYPE "MediaFindingType" AS ENUM ('UNUSED_MEDIA', 'DUPLICATE_MEDIA', 'CORRUPT_MEDIA', 'MISSING_OBJECT', 'MISSING_DATABASE_RECORD', 'DATABASE_REFERENCE_MISSING_OBJECT', 'OVERSIZED_MEDIA', 'INVALID_DIMENSIONS', 'STORAGE_BACKUP_MISMATCH');

-- CreateEnum
CREATE TYPE "MediaFindingSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MediaFindingStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "type" "OperationType" NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),
    "requestedByAdminId" TEXT,
    "requestedByName" TEXT,
    "cancellable" BOOLEAN NOT NULL DEFAULT true,
    "resumable" BOOLEAN NOT NULL DEFAULT true,
    "checkpoint" JSONB,
    "input" JSONB,
    "result" JSONB,
    "errorSummary" TEXT,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "retryOfOperationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationEvent" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "level" "OperationEventLevel" NOT NULL DEFAULT 'INFO',
    "code" TEXT,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationItem" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemType" TEXT,
    "status" "OperationItemStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "checkpoint" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaSettings" (
    "key" TEXT NOT NULL DEFAULT 'default',
    "trashRetentionDays" INTEGER NOT NULL DEFAULT 30,
    "autoPurgeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaSettings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MediaCatalogEntry" (
    "id" TEXT NOT NULL,
    "sourceKind" "MediaCatalogSource" NOT NULL,
    "sourceId" TEXT,
    "tenantId" TEXT,
    "siteId" TEXT,
    "providerId" TEXT NOT NULL DEFAULT 'unknown',
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "checksumSha256" TEXT,
    "originalName" TEXT,
    "metadata" JSONB,
    "lifecycleStatus" "MediaLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "usageStatus" "MediaUsageStatus" NOT NULL DEFAULT 'UNKNOWN',
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "trashedAt" TIMESTAMP(3),
    "purgeEligibleAt" TIMESTAMP(3),
    "purgedAt" TIMESTAMP(3),
    "trashReason" TEXT,
    "trashActorId" TEXT,
    "trashOperationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaCatalogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaReference" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedOperationId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "MediaReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaFinding" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT,
    "operationId" TEXT,
    "type" "MediaFindingType" NOT NULL,
    "severity" "MediaFindingSeverity" NOT NULL DEFAULT 'INFO',
    "status" "MediaFindingStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MediaFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaLifecycleEvent" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "operationId" TEXT,
    "actorAdminId" TEXT,
    "fromLifecycleStatus" "MediaLifecycleStatus",
    "toLifecycleStatus" "MediaLifecycleStatus",
    "fromUsageStatus" "MediaUsageStatus",
    "toUsageStatus" "MediaUsageStatus",
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaLifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Operation_type_status_createdAt_idx" ON "Operation"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Operation_status_leaseExpiresAt_idx" ON "Operation"("status", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "Operation_requestedByAdminId_createdAt_idx" ON "Operation"("requestedByAdminId", "createdAt");

-- CreateIndex
CREATE INDEX "OperationEvent_operationId_createdAt_idx" ON "OperationEvent"("operationId", "createdAt");

-- CreateIndex
CREATE INDEX "OperationEvent_level_createdAt_idx" ON "OperationEvent"("level", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OperationItem_operationId_itemKey_key" ON "OperationItem"("operationId", "itemKey");

-- CreateIndex
CREATE INDEX "OperationItem_operationId_status_idx" ON "OperationItem"("operationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MediaCatalogEntry_sourceKind_sourceId_key" ON "MediaCatalogEntry"("sourceKind", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaCatalogEntry_providerId_storageKey_key" ON "MediaCatalogEntry"("providerId", "storageKey");

-- CreateIndex
CREATE INDEX "MediaCatalogEntry_tenantId_lifecycleStatus_usageStatus_idx" ON "MediaCatalogEntry"("tenantId", "lifecycleStatus", "usageStatus");

-- CreateIndex
CREATE INDEX "MediaCatalogEntry_siteId_lifecycleStatus_idx" ON "MediaCatalogEntry"("siteId", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "MediaCatalogEntry_checksumSha256_idx" ON "MediaCatalogEntry"("checksumSha256");

-- CreateIndex
CREATE INDEX "MediaCatalogEntry_lifecycleStatus_purgeEligibleAt_idx" ON "MediaCatalogEntry"("lifecycleStatus", "purgeEligibleAt");

-- CreateIndex
CREATE INDEX "MediaCatalogEntry_lastVerifiedAt_idx" ON "MediaCatalogEntry"("lastVerifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaReference_mediaId_sourceType_sourceId_fieldPath_key" ON "MediaReference"("mediaId", "sourceType", "sourceId", "fieldPath");

-- CreateIndex
CREATE INDEX "MediaReference_sourceType_sourceId_idx" ON "MediaReference"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "MediaReference_active_lastSeenAt_idx" ON "MediaReference"("active", "lastSeenAt");

-- CreateIndex
CREATE INDEX "MediaFinding_mediaId_status_createdAt_idx" ON "MediaFinding"("mediaId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MediaFinding_operationId_createdAt_idx" ON "MediaFinding"("operationId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaFinding_type_status_idx" ON "MediaFinding"("type", "status");

-- CreateIndex
CREATE INDEX "MediaLifecycleEvent_mediaId_createdAt_idx" ON "MediaLifecycleEvent"("mediaId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaLifecycleEvent_operationId_createdAt_idx" ON "MediaLifecycleEvent"("operationId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaLifecycleEvent_actorAdminId_createdAt_idx" ON "MediaLifecycleEvent"("actorAdminId", "createdAt");

-- AddForeignKey
ALTER TABLE "OperationEvent" ADD CONSTRAINT "OperationEvent_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationItem" ADD CONSTRAINT "OperationItem_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaReference" ADD CONSTRAINT "MediaReference_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaCatalogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFinding" ADD CONSTRAINT "MediaFinding_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaCatalogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLifecycleEvent" ADD CONSTRAINT "MediaLifecycleEvent_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaCatalogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
