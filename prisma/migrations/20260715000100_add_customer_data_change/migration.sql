-- CreateTable
CREATE TABLE "CustomerDataChange" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "tenantId" TEXT,
    "siteId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "source" TEXT NOT NULL DEFAULT 'customer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerDataChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerDataChange_entityType_entityId_createdAt_idx" ON "CustomerDataChange"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerDataChange_tenantId_createdAt_idx" ON "CustomerDataChange"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerDataChange_siteId_createdAt_idx" ON "CustomerDataChange"("siteId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerDataChange_createdAt_idx" ON "CustomerDataChange"("createdAt");
