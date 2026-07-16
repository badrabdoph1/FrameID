-- Keep Prisma's reviewedByUserId field compatible with the legacy production
-- column name created by the initial payment migrations.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'PaymentRequest'
      AND column_name = 'reviewedByUserId'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'PaymentRequest'
      AND column_name = 'reviewedById'
  ) THEN
    ALTER TABLE "PaymentRequest" RENAME COLUMN "reviewedByUserId" TO "reviewedById";
  END IF;
END $$;

ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PaymentRequest_reviewedById_fkey'
  ) THEN
    ALTER TABLE "PaymentRequest"
      ADD CONSTRAINT "PaymentRequest_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS "PaymentRequest_reviewedById_idx"
  ON "PaymentRequest"("reviewedById");
