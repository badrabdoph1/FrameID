-- Prevent concurrent active fulfillment runs while preserving historical failed/succeeded attempts.
WITH ranked_active_runs AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "acquisitionId"
      ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
    ) AS active_rank
  FROM "FulfillmentRun"
  WHERE "status" IN ('PENDING', 'RUNNING', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'READY')
)
UPDATE "FulfillmentRun" AS run
SET
  "status" = 'CANCELLED',
  "lastError" = 'Superseded while enforcing one active fulfillment run per acquisition.',
  "finishedAt" = CURRENT_TIMESTAMP,
  "leaseOwner" = NULL,
  "leaseExpiresAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP
FROM ranked_active_runs AS ranked
WHERE run."id" = ranked."id" AND ranked.active_rank > 1;

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
