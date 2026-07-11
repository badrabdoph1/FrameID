-- Safe pre-push migration: adds columns that prisma db push cannot add
-- to tables with existing data. Idempotent (uses IF NOT EXISTS).

-- 1. PaymentAccount: add method and displayName with defaults
ALTER TABLE "PaymentAccount" ADD COLUMN IF NOT EXISTS "method" "PaymentMethod" NOT NULL DEFAULT 'INSTAPAY';
ALTER TABLE "PaymentAccount" ADD COLUMN IF NOT EXISTS "displayName" TEXT NOT NULL DEFAULT '';

-- 2. PaymentRequest: add updatedAt with default
ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. PaymentRequestLog: rename paymentRequestId -> requestId if needed, or add requestId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PaymentRequestLog' AND column_name = 'paymentRequestId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PaymentRequestLog' AND column_name = 'requestId'
  ) THEN
    ALTER TABLE "PaymentRequestLog" RENAME COLUMN "paymentRequestId" TO "requestId";
  END IF;
END $$;

-- Also add requestId if neither column exists (fresh DB edge case)
ALTER TABLE "PaymentRequestLog" ADD COLUMN IF NOT EXISTS "requestId" TEXT NOT NULL DEFAULT '';

-- 4. SubscriptionChange: add tenantId if missing
ALTER TABLE "SubscriptionChange" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT '';

-- 5. BackupSettings: ensure type column exists as TEXT (handles type change from enum to text)
-- This only runs if the column type is incompatible; prisma db push handles the rest.
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'BackupSettings' AND column_name = 'type';

  -- If the column doesn't exist at all, add it
  IF col_type IS NULL THEN
    ALTER TABLE "BackupSettings" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'DATABASE';
  END IF;
END $$;
