ALTER TABLE "ContactProfile"
ADD COLUMN IF NOT EXISTS "workLocation" TEXT DEFAULT 'فريلانسر';

UPDATE "ContactProfile"
SET "workLocation" = 'فريلانسر'
WHERE "workLocation" IS NULL OR BTRIM("workLocation") = '';
