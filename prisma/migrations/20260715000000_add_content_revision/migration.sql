-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "before" JSONB,
    "after" JSONB,
    "commitId" TEXT,
    "gitStatus" TEXT NOT NULL DEFAULT 'not-configured',
    "gitError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentRevision_type_createdAt_idx" ON "ContentRevision"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ContentRevision_createdAt_idx" ON "ContentRevision"("createdAt");

-- CreateIndex
CREATE INDEX "ContentRevision_actorId_createdAt_idx" ON "ContentRevision"("actorId", "createdAt");
