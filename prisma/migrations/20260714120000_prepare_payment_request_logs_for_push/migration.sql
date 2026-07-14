-- Preserve legacy PaymentRequestLog rows before Prisma reconciles the schema.
-- An older compatibility pass renamed paymentRequestId to requestId. Renaming
-- it back retains the existing relationship values and lets db push proceed
-- without resetting or deleting production data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'PaymentRequestLog'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PaymentRequestLog'
      AND column_name = 'requestId'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PaymentRequestLog'
      AND column_name = 'paymentRequestId'
  ) THEN
    ALTER TABLE "PaymentRequestLog"
      RENAME COLUMN "requestId" TO "paymentRequestId";
  END IF;
END $$;
