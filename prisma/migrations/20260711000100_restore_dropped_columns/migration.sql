-- Restore columns and tables dropped by prisma db push --accept-data-loss
-- Uses EXCEPTION handling for idempotent constraint creation (works across sessions).

-- 1. PaymentRequestLog: rename requestId back to paymentRequestId (code uses this name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PaymentRequestLog' AND column_name = 'requestId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PaymentRequestLog' AND column_name = 'paymentRequestId'
  ) THEN
    ALTER TABLE "PaymentRequestLog" RENAME COLUMN "requestId" TO "paymentRequestId";
  END IF;
END $$;

-- 2. PaymentRequestLog: add note column
ALTER TABLE "PaymentRequestLog" ADD COLUMN IF NOT EXISTS "note" TEXT;

-- 3. Site: restore slugChangeUsed and publishedVersion
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "slugChangeUsed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "publishedVersion" INTEGER NOT NULL DEFAULT 1;

-- 4. PaymentRequest: restore subscriptionId, paymentAccountId, submittedAt, adminNote, rejectionReason
ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "paymentAccountId" TEXT;
ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- 5. Subscription: restore activatedAt, add deletedAt
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "activatedAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- 6. SubscriptionChange: restore subscriptionId, fromStatus, toStatus, changeType, initiatedById
ALTER TABLE "SubscriptionChange" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
ALTER TABLE "SubscriptionChange" ADD COLUMN IF NOT EXISTS "fromStatus" TEXT;
ALTER TABLE "SubscriptionChange" ADD COLUMN IF NOT EXISTS "toStatus" TEXT;
ALTER TABLE "SubscriptionChange" ADD COLUMN IF NOT EXISTS "changeType" TEXT;
ALTER TABLE "SubscriptionChange" ADD COLUMN IF NOT EXISTS "initiatedById" TEXT;

-- 7. Notification: restore priority
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'info';

-- 8. FeatureFlag: restore createdAt
ALTER TABLE "FeatureFlag" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 9. Template: restore createdAt
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 10. Theme: restore createdAt and updatedAt
ALTER TABLE "Theme" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Theme" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 11. BackupSettings: restore compression, encryption, githubBranch
ALTER TABLE "BackupSettings" ADD COLUMN IF NOT EXISTS "compression" TEXT NOT NULL DEFAULT 'zstd';
ALTER TABLE "BackupSettings" ADD COLUMN IF NOT EXISTS "encryption" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "BackupSettings" ADD COLUMN IF NOT EXISTS "githubBranch" TEXT NOT NULL DEFAULT 'platform-backups';

-- 12. Create PaymentSettings table (may be dropped by db push)
DO $$
BEGIN
  -- Only create table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'PaymentSettings'
  ) THEN
    CREATE TABLE "PaymentSettings" (
      "id" TEXT NOT NULL,
      "paymentMethod" "PaymentMethod" NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "label" TEXT,
      "description" TEXT,
      "config" JSONB NOT NULL DEFAULT '{}',
      "qrCodeAssetId" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PaymentSettings_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;

-- Add unique constraint for paymentMethod (exception-safe)
DO $$
BEGIN
  -- Check if constraint already exists before adding
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'PaymentSettings_paymentMethod_key'
  ) THEN
    ALTER TABLE "PaymentSettings" ADD CONSTRAINT "PaymentSettings_paymentMethod_key" UNIQUE ("paymentMethod");
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Add index for PaymentSettings (exception-safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'PaymentSettings_isActive_sortOrder_idx'
  ) THEN
    CREATE INDEX "PaymentSettings_isActive_sortOrder_idx" ON "PaymentSettings"("isActive", "sortOrder");
  END IF;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- 13. PaymentAccount: restore paymentSettingsId, label, instructions, notes, iban, swift
ALTER TABLE "PaymentAccount" ADD COLUMN IF NOT EXISTS "paymentSettingsId" TEXT;
ALTER TABLE "PaymentAccount" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "PaymentAccount" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "PaymentAccount" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "PaymentAccount" ADD COLUMN IF NOT EXISTS "iban" TEXT;
ALTER TABLE "PaymentAccount" ADD COLUMN IF NOT EXISTS "swift" TEXT;

-- Add index for PaymentAccount.paymentSettingsId (exception-safe)
DO $$
BEGIN
  CREATE INDEX "PaymentAccount_paymentSettingsId_idx" ON "PaymentAccount"("paymentSettingsId");
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- 14. Add foreign key constraints (exception-safe)
DO $$
BEGIN
  ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_paymentAccountId_fkey"
    FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "PaymentAccount" ADD CONSTRAINT "PaymentAccount_paymentSettingsId_fkey"
    FOREIGN KEY ("paymentSettingsId") REFERENCES "PaymentSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "PaymentSettings" ADD CONSTRAINT "PaymentSettings_qrCodeAssetId_fkey"
    FOREIGN KEY ("qrCodeAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
