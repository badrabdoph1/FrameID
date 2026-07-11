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

-- 5. BackupSettings: convert enum type column to TEXT and restructure as @id
--    DB has: id TEXT PK, type "BackupType" ENUM (unique)
--    Schema wants: type TEXT PK (no id column)
DO $$
DECLARE
  col_type TEXT;
  constraint_exists BOOLEAN;
BEGIN
  -- Check if the type column exists and what its data type is
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'BackupSettings' AND column_name = 'type';

  -- If the type column is an enum, convert it to TEXT
  IF col_type = 'USER-DEFINED' THEN
    -- Create a new TEXT column
    ALTER TABLE "BackupSettings" ADD COLUMN IF NOT EXISTS "type_text" TEXT NOT NULL DEFAULT 'DATABASE';
    -- Copy data from enum to text
    UPDATE "BackupSettings" SET "type_text" = "type"::TEXT;
    -- Drop the old enum column and its unique constraint
    ALTER TABLE "BackupSettings" DROP CONSTRAINT IF EXISTS "BackupSettings_type_key";
    ALTER TABLE "BackupSettings" DROP COLUMN "type";
    -- Rename text column to type
    ALTER TABLE "BackupSettings" RENAME COLUMN "type_text" TO "type";
  END IF;

  -- Ensure type column exists as TEXT (handles fresh DB edge case)
  IF col_type IS NULL THEN
    ALTER TABLE "BackupSettings" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'DATABASE';
  END IF;

  -- Drop the id column if it exists and make type the PK
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'BackupSettings' AND column_name = 'id'
  ) THEN
    -- Drop old PK constraint
    SELECT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = '"BackupSettings"'::regclass
      AND contype = 'p'
    ) INTO constraint_exists;

    IF constraint_exists THEN
      ALTER TABLE "BackupSettings" DROP CONSTRAINT "BackupSettings_pkey";
    END IF;

    -- Drop the id column
    ALTER TABLE "BackupSettings" DROP COLUMN "id";

    -- Add createdAt if missing
    ALTER TABLE "BackupSettings" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

    -- Make type the primary key
    ALTER TABLE "BackupSettings" ADD CONSTRAINT "BackupSettings_pkey" PRIMARY KEY ("type");
  END IF;
END $$;
