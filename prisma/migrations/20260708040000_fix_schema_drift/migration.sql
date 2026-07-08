-- AlterTable: ExtraService
ALTER TABLE "ExtraService" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "ExtraService" ADD COLUMN IF NOT EXISTS "imageAssetId" TEXT;
ALTER TABLE "ExtraService" ADD COLUMN IF NOT EXISTS "isHighlighted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: GalleryImage
ALTER TABLE "GalleryImage" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: ContactProfile - Extended fields
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "studioName" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "longDescription" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "workingHours" JSONB;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "avatarAssetId" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "coverAssetId" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "tiktok" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "snapchat" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "youtube" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "behance" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "fiveHundredPx" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "linkedin" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "telegram" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "xTwitter" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "threads" TEXT;
ALTER TABLE "ContactProfile" ADD COLUMN IF NOT EXISTS "website" TEXT;

-- AddForeignKey: ExtraService -> MediaAsset
CREATE INDEX IF NOT EXISTS "ExtraService_imageAssetId_idx" ON "ExtraService"("imageAssetId");

-- AddForeignKey: ContactProfile -> MediaAsset
CREATE INDEX IF NOT EXISTS "ContactProfile_avatarAssetId_idx" ON "ContactProfile"("avatarAssetId");
CREATE INDEX IF NOT EXISTS "ContactProfile_coverAssetId_idx" ON "ContactProfile"("coverAssetId");
