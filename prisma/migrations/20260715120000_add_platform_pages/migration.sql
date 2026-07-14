CREATE TYPE "PlatformPageKind" AS ENUM ('EDITORIAL', 'LEGAL', 'AUTH', 'FUNCTIONAL');

CREATE TABLE "PlatformPage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "kind" "PlatformPageKind" NOT NULL,
    "document" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "updatedByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformPageRevision" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "document" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "changeSummary" TEXT,
    "restoredFromRevisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformPageRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformMediaAsset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "focusX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "focusY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "zoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "originalName" TEXT NOT NULL,
    "alt" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PlatformMediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformPage_key_key" ON "PlatformPage"("key");
CREATE UNIQUE INDEX "PlatformPage_route_key" ON "PlatformPage"("route");
CREATE INDEX "PlatformPage_kind_updatedAt_idx" ON "PlatformPage"("kind", "updatedAt");
CREATE INDEX "PlatformPage_updatedById_updatedAt_idx" ON "PlatformPage"("updatedById", "updatedAt");
CREATE UNIQUE INDEX "PlatformPageRevision_pageId_version_key" ON "PlatformPageRevision"("pageId", "version");
CREATE INDEX "PlatformPageRevision_pageId_createdAt_idx" ON "PlatformPageRevision"("pageId", "createdAt");
CREATE INDEX "PlatformPageRevision_actorId_createdAt_idx" ON "PlatformPageRevision"("actorId", "createdAt");
CREATE UNIQUE INDEX "PlatformMediaAsset_storageKey_key" ON "PlatformMediaAsset"("storageKey");
CREATE INDEX "PlatformMediaAsset_deletedAt_createdAt_idx" ON "PlatformMediaAsset"("deletedAt", "createdAt");
CREATE INDEX "PlatformMediaAsset_createdById_createdAt_idx" ON "PlatformMediaAsset"("createdById", "createdAt");

ALTER TABLE "PlatformPageRevision"
ADD CONSTRAINT "PlatformPageRevision_pageId_fkey"
FOREIGN KEY ("pageId") REFERENCES "PlatformPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
