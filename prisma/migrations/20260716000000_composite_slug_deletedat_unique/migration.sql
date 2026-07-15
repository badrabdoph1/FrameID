-- Drop the existing unique constraint on slug
ALTER TABLE "Site" DROP CONSTRAINT IF EXISTS "Site_slug_key";

-- Create a composite unique constraint on (slug, deletedAt)
-- This allows soft-deleted sites to share slugs with active sites
CREATE UNIQUE INDEX "Site_slug_deletedAt_key" ON "Site"("slug", "deletedAt");
