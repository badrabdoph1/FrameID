-- Prevent concurrent active fulfillment runs while preserving historical failed/succeeded attempts.
CREATE UNIQUE INDEX IF NOT EXISTS "FulfillmentRun_one_active_per_acquisition_idx"
ON "FulfillmentRun" ("acquisitionId")
WHERE "status" IN ('PENDING', 'RUNNING', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'READY');

-- Speed up compatibility reconciliation from legacy subscriptions to product entitlements.
CREATE INDEX IF NOT EXISTS "Entitlement_legacy_subscription_source_idx"
ON "Entitlement" ("sourceType", "sourceId")
WHERE "sourceType" = 'LEGACY_SUBSCRIPTION';

-- Scope metered usage to a renewable grant period and make request idempotency tenant-safe.
ALTER TABLE "UsageLedger" ADD COLUMN IF NOT EXISTS "periodKey" TEXT NOT NULL DEFAULT 'lifetime';
DROP INDEX IF EXISTS "UsageLedger_idempotencyKey_key";
DROP INDEX IF EXISTS "UsageLedger_tenantId_capabilityKey_createdAt_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "UsageLedger_tenantId_idempotencyKey_key"
ON "UsageLedger" ("tenantId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "UsageLedger_tenantId_capabilityKey_periodKey_createdAt_idx"
ON "UsageLedger" ("tenantId", "capabilityKey", "periodKey", "createdAt");
