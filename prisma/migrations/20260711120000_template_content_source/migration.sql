-- Template Content Source support.
-- Idempotent for production-safe deploys.

ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "version" TEXT NOT NULL DEFAULT '1.0.0';

ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "templateCode" TEXT;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "templateVersion" TEXT;

CREATE INDEX IF NOT EXISTS "Site_templateCode_templateVersion_idx"
  ON "Site"("templateCode", "templateVersion");

CREATE TABLE IF NOT EXISTS "SiteContentSnapshot" (
  "id" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "templateCode" TEXT,
  "templateVersion" TEXT,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SiteContentSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SiteContentSnapshot_siteId_createdAt_idx"
  ON "SiteContentSnapshot"("siteId", "createdAt");

CREATE INDEX IF NOT EXISTS "SiteContentSnapshot_templateCode_templateVersion_idx"
  ON "SiteContentSnapshot"("templateCode", "templateVersion");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'SiteContentSnapshot_siteId_fkey'
  ) THEN
    ALTER TABLE "SiteContentSnapshot"
      ADD CONSTRAINT "SiteContentSnapshot_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "Site"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
