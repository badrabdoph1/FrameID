-- CreateEnum
CREATE TYPE "ProductPublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'PAUSED', 'RETIRED');

-- CreateEnum
CREATE TYPE "ProductReleaseStage" AS ENUM ('ANNOUNCED', 'PRIVATE_PREVIEW', 'BETA', 'GA', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "OfferingType" AS ENUM ('PLAN', 'ADD_ON', 'ONE_TIME_SERVICE', 'MANAGED_SERVICE', 'BUNDLE', 'CUSTOM_QUOTE');

-- CreateEnum
CREATE TYPE "SalesMode" AS ENUM ('SELF_SERVE', 'REQUEST', 'QUOTE_ONLY', 'CONTACT_ONLY');

-- CreateEnum
CREATE TYPE "FulfillmentMode" AS ENUM ('AUTOMATIC', 'MANUAL', 'HYBRID', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ActivationMode" AS ENUM ('INSTANT', 'AFTER_PAYMENT', 'AFTER_APPROVAL', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "PriceBillingInterval" AS ENUM ('ONE_TIME', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "AcquisitionStatus" AS ENUM ('DRAFT', 'REQUESTED', 'QUALIFYING', 'ACCEPTED', 'AWAITING_PAYMENT', 'PAID', 'FULFILLING', 'FULFILLED', 'DECLINED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'RUNNING', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'READY', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ProductInstanceStatus" AS ENUM ('PROVISIONING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'DEPROVISIONED');

-- CreateEnum
CREATE TYPE "TrialGrantStatus" AS ENUM ('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'CONVERTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ServiceSubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD', 'CANCELLED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RecommendationRuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ServicesOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'DEAD_LETTER');

-- AlterTable
ALTER TABLE "PaymentRequest" ADD COLUMN     "acquisitionId" TEXT;

-- CreateTable
CREATE TABLE "ProductDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "registryKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "media" JSONB,
    "publicationStatus" "ProductPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "releaseStage" "ProductReleaseStage" NOT NULL DEFAULT 'ANNOUNCED',
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "eligibilityPolicy" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedRevision" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fulfillmentMode" "FulfillmentMode" NOT NULL,
    "steps" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogOffering" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "workflowTemplateId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT,
    "type" "OfferingType" NOT NULL,
    "salesMode" "SalesMode" NOT NULL DEFAULT 'REQUEST',
    "fulfillmentMode" "FulfillmentMode" NOT NULL DEFAULT 'MANUAL',
    "activationMode" "ActivationMode" NOT NULL DEFAULT 'AFTER_APPROVAL',
    "publicationStatus" "ProductPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "releaseStage" "ProductReleaseStage" NOT NULL DEFAULT 'ANNOUNCED',
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "requirements" JSONB,
    "eligibilityPolicy" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CatalogOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogPrice" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "amount" INTEGER NOT NULL,
    "billingInterval" "PriceBillingInterval" NOT NULL,
    "marketCode" TEXT NOT NULL DEFAULT 'GLOBAL',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'BOOLEAN',
    "unit" TEXT,
    "aggregationPolicy" TEXT NOT NULL DEFAULT 'REPLACE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapabilityDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingCapability" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OfferingCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleComponent" (
    "id" TEXT NOT NULL,
    "bundleOfferingId" TEXT NOT NULL,
    "componentOfferingId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BundleComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialPolicy" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "offeringId" TEXT,
    "name" TEXT NOT NULL,
    "durationDays" INTEGER,
    "usageLimit" INTEGER,
    "usageCapabilityKey" TEXT,
    "oncePerTenant" BOOLEAN NOT NULL DEFAULT true,
    "requiresPaymentMethod" BOOLEAN NOT NULL DEFAULT false,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "eligibilityPolicy" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogRevision" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" "ProductPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "changeNote" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acquisition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "status" "AcquisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "source" TEXT NOT NULL DEFAULT 'SERVICE_CENTER',
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "attributionId" TEXT,
    "conversationId" TEXT,
    "acceptedCurrency" TEXT,
    "acceptedTotal" INTEGER,
    "declineReasonCode" TEXT,
    "cancellationReason" TEXT,
    "metadata" JSONB,
    "requestedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Acquisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcquisitionLine" (
    "id" TEXT NOT NULL,
    "acquisitionId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "priceId" TEXT,
    "snapshotCode" TEXT NOT NULL,
    "snapshotName" TEXT NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL,
    "billingInterval" "PriceBillingInterval" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcquisitionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfillmentRun" (
    "id" TEXT NOT NULL,
    "acquisitionId" TEXT NOT NULL,
    "workflowKey" TEXT NOT NULL,
    "workflowVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "checkpoint" JSONB,
    "result" JSONB,
    "lastError" TEXT,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FulfillmentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT,
    "offeringId" TEXT,
    "capabilityId" TEXT,
    "capabilityKey" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "value" JSONB NOT NULL,
    "quantity" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInstance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "acquisitionId" TEXT,
    "status" "ProductInstanceStatus" NOT NULL DEFAULT 'PROVISIONING',
    "instanceKey" TEXT NOT NULL,
    "externalRef" TEXT,
    "configuration" JSONB,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "deprovisionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialGrant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT,
    "offeringId" TEXT NOT NULL,
    "status" "TrialGrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "idempotencyKey" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "graceEndsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageConsumed" INTEGER NOT NULL DEFAULT 0,
    "convertedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLedger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entitlementId" TEXT,
    "capabilityKey" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "acquisitionId" TEXT,
    "trialGrantId" TEXT,
    "status" "ServiceSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "idempotencyKey" TEXT NOT NULL,
    "provider" TEXT,
    "providerSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "gracePeriodEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecommendationRuleStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "placements" JSONB NOT NULL,
    "reasonCodes" JSONB NOT NULL,
    "frequencyCap" INTEGER,
    "cooldownHours" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationDecision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT,
    "offeringId" TEXT NOT NULL,
    "attributionId" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasonCodes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SHOWN',
    "expiresAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "productId" TEXT,
    "offeringId" TEXT,
    "acquisitionId" TEXT,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "attributionId" TEXT,
    "sessionKey" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "properties" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicesOutboxEvent" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "correlationId" TEXT,
    "causationId" TEXT,
    "status" "ServicesOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicesOutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductDefinition_code_key" ON "ProductDefinition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDefinition_registryKey_key" ON "ProductDefinition"("registryKey");

-- CreateIndex
CREATE INDEX "ProductDefinition_publicationStatus_releaseStage_sortOrder_idx" ON "ProductDefinition"("publicationStatus", "releaseStage", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductDefinition_category_publicationStatus_idx" ON "ProductDefinition"("category", "publicationStatus");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_key_isActive_version_idx" ON "WorkflowTemplate"("key", "isActive", "version");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_key_version_key" ON "WorkflowTemplate"("key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogOffering_code_key" ON "CatalogOffering"("code");

-- CreateIndex
CREATE INDEX "CatalogOffering_productId_publicationStatus_sortOrder_idx" ON "CatalogOffering"("productId", "publicationStatus", "sortOrder");

-- CreateIndex
CREATE INDEX "CatalogOffering_type_publicationStatus_releaseStage_idx" ON "CatalogOffering"("type", "publicationStatus", "releaseStage");

-- CreateIndex
CREATE INDEX "CatalogOffering_workflowTemplateId_idx" ON "CatalogOffering"("workflowTemplateId");

-- CreateIndex
CREATE INDEX "CatalogPrice_offeringId_isActive_effectiveFrom_effectiveTo_idx" ON "CatalogPrice"("offeringId", "isActive", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "CatalogPrice_currency_marketCode_isActive_idx" ON "CatalogPrice"("currency", "marketCode", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogPrice_offeringId_version_currency_marketCode_key" ON "CatalogPrice"("offeringId", "version", "currency", "marketCode");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityDefinition_key_key" ON "CapabilityDefinition"("key");

-- CreateIndex
CREATE INDEX "OfferingCapability_capabilityId_offeringId_idx" ON "OfferingCapability"("capabilityId", "offeringId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferingCapability_offeringId_capabilityId_key" ON "OfferingCapability"("offeringId", "capabilityId");

-- CreateIndex
CREATE INDEX "BundleComponent_componentOfferingId_idx" ON "BundleComponent"("componentOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "BundleComponent_bundleOfferingId_componentOfferingId_key" ON "BundleComponent"("bundleOfferingId", "componentOfferingId");

-- CreateIndex
CREATE INDEX "TrialPolicy_productId_isActive_idx" ON "TrialPolicy"("productId", "isActive");

-- CreateIndex
CREATE INDEX "TrialPolicy_offeringId_isActive_idx" ON "TrialPolicy"("offeringId", "isActive");

-- CreateIndex
CREATE INDEX "CatalogRevision_productId_status_createdAt_idx" ON "CatalogRevision"("productId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogRevision_productId_revision_key" ON "CatalogRevision"("productId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "Acquisition_correlationId_key" ON "Acquisition"("correlationId");

-- CreateIndex
CREATE INDEX "Acquisition_tenantId_status_createdAt_idx" ON "Acquisition"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Acquisition_offeringId_status_createdAt_idx" ON "Acquisition"("offeringId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Acquisition_conversationId_idx" ON "Acquisition"("conversationId");

-- CreateIndex
CREATE INDEX "Acquisition_attributionId_idx" ON "Acquisition"("attributionId");

-- CreateIndex
CREATE UNIQUE INDEX "Acquisition_tenantId_idempotencyKey_key" ON "Acquisition"("tenantId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "AcquisitionLine_acquisitionId_createdAt_idx" ON "AcquisitionLine"("acquisitionId", "createdAt");

-- CreateIndex
CREATE INDEX "AcquisitionLine_offeringId_priceId_idx" ON "AcquisitionLine"("offeringId", "priceId");

-- CreateIndex
CREATE UNIQUE INDEX "FulfillmentRun_idempotencyKey_key" ON "FulfillmentRun"("idempotencyKey");

-- CreateIndex
CREATE INDEX "FulfillmentRun_acquisitionId_status_createdAt_idx" ON "FulfillmentRun"("acquisitionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "FulfillmentRun_status_leaseExpiresAt_idx" ON "FulfillmentRun"("status", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "Entitlement_tenantId_status_endsAt_idx" ON "Entitlement"("tenantId", "status", "endsAt");

-- CreateIndex
CREATE INDEX "Entitlement_tenantId_capabilityKey_status_idx" ON "Entitlement"("tenantId", "capabilityKey", "status");

-- CreateIndex
CREATE INDEX "Entitlement_sourceType_sourceId_idx" ON "Entitlement"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_tenantId_capabilityKey_sourceType_sourceId_key" ON "Entitlement"("tenantId", "capabilityKey", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ProductInstance_tenantId_productId_status_idx" ON "ProductInstance"("tenantId", "productId", "status");

-- CreateIndex
CREATE INDEX "ProductInstance_acquisitionId_idx" ON "ProductInstance"("acquisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInstance_tenantId_instanceKey_key" ON "ProductInstance"("tenantId", "instanceKey");

-- CreateIndex
CREATE INDEX "TrialGrant_tenantId_status_endsAt_idx" ON "TrialGrant"("tenantId", "status", "endsAt");

-- CreateIndex
CREATE INDEX "TrialGrant_offeringId_status_idx" ON "TrialGrant"("offeringId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TrialGrant_tenantId_idempotencyKey_key" ON "TrialGrant"("tenantId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "UsageLedger_idempotencyKey_key" ON "UsageLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "UsageLedger_tenantId_capabilityKey_createdAt_idx" ON "UsageLedger"("tenantId", "capabilityKey", "createdAt");

-- CreateIndex
CREATE INDEX "UsageLedger_entitlementId_createdAt_idx" ON "UsageLedger"("entitlementId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceSubscription_tenantId_status_currentPeriodEnd_idx" ON "ServiceSubscription"("tenantId", "status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "ServiceSubscription_offeringId_status_idx" ON "ServiceSubscription"("offeringId", "status");

-- CreateIndex
CREATE INDEX "ServiceSubscription_gracePeriodEndsAt_idx" ON "ServiceSubscription"("gracePeriodEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSubscription_tenantId_idempotencyKey_key" ON "ServiceSubscription"("tenantId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSubscription_provider_providerSubscriptionId_key" ON "ServiceSubscription"("provider", "providerSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationRule_key_key" ON "RecommendationRule"("key");

-- CreateIndex
CREATE INDEX "RecommendationRule_status_priority_startsAt_endsAt_idx" ON "RecommendationRule"("status", "priority", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationDecision_attributionId_key" ON "RecommendationDecision"("attributionId");

-- CreateIndex
CREATE INDEX "RecommendationDecision_tenantId_placement_status_createdAt_idx" ON "RecommendationDecision"("tenantId", "placement", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RecommendationDecision_offeringId_status_createdAt_idx" ON "RecommendationDecision"("offeringId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RecommendationDecision_ruleId_createdAt_idx" ON "RecommendationDecision"("ruleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAnalyticsEvent_idempotencyKey_key" ON "ProductAnalyticsEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_name_occurredAt_idx" ON "ProductAnalyticsEvent"("name", "occurredAt");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_tenantId_name_occurredAt_idx" ON "ProductAnalyticsEvent"("tenantId", "name", "occurredAt");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_productId_offeringId_name_occurredAt_idx" ON "ProductAnalyticsEvent"("productId", "offeringId", "name", "occurredAt");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_attributionId_occurredAt_idx" ON "ProductAnalyticsEvent"("attributionId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServicesOutboxEvent_deduplicationKey_key" ON "ServicesOutboxEvent"("deduplicationKey");

-- CreateIndex
CREATE INDEX "ServicesOutboxEvent_status_availableAt_leaseExpiresAt_idx" ON "ServicesOutboxEvent"("status", "availableAt", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "ServicesOutboxEvent_aggregateType_aggregateId_createdAt_idx" ON "ServicesOutboxEvent"("aggregateType", "aggregateId", "createdAt");

-- CreateIndex
CREATE INDEX "ServicesOutboxEvent_correlationId_createdAt_idx" ON "ServicesOutboxEvent"("correlationId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentRequest_acquisitionId_status_idx" ON "PaymentRequest"("acquisitionId", "status");

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_acquisitionId_fkey" FOREIGN KEY ("acquisitionId") REFERENCES "Acquisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogOffering" ADD CONSTRAINT "CatalogOffering_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogOffering" ADD CONSTRAINT "CatalogOffering_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "WorkflowTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogPrice" ADD CONSTRAINT "CatalogPrice_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingCapability" ADD CONSTRAINT "OfferingCapability_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingCapability" ADD CONSTRAINT "OfferingCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "CapabilityDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleComponent" ADD CONSTRAINT "BundleComponent_bundleOfferingId_fkey" FOREIGN KEY ("bundleOfferingId") REFERENCES "CatalogOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleComponent" ADD CONSTRAINT "BundleComponent_componentOfferingId_fkey" FOREIGN KEY ("componentOfferingId") REFERENCES "CatalogOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialPolicy" ADD CONSTRAINT "TrialPolicy_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialPolicy" ADD CONSTRAINT "TrialPolicy_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogRevision" ADD CONSTRAINT "CatalogRevision_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acquisition" ADD CONSTRAINT "Acquisition_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acquisition" ADD CONSTRAINT "Acquisition_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcquisitionLine" ADD CONSTRAINT "AcquisitionLine_acquisitionId_fkey" FOREIGN KEY ("acquisitionId") REFERENCES "Acquisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcquisitionLine" ADD CONSTRAINT "AcquisitionLine_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcquisitionLine" ADD CONSTRAINT "AcquisitionLine_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "CatalogPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfillmentRun" ADD CONSTRAINT "FulfillmentRun_acquisitionId_fkey" FOREIGN KEY ("acquisitionId") REFERENCES "Acquisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "CapabilityDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInstance" ADD CONSTRAINT "ProductInstance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInstance" ADD CONSTRAINT "ProductInstance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInstance" ADD CONSTRAINT "ProductInstance_acquisitionId_fkey" FOREIGN KEY ("acquisitionId") REFERENCES "Acquisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialGrant" ADD CONSTRAINT "TrialGrant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialGrant" ADD CONSTRAINT "TrialGrant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialGrant" ADD CONSTRAINT "TrialGrant_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLedger" ADD CONSTRAINT "UsageLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLedger" ADD CONSTRAINT "UsageLedger_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSubscription" ADD CONSTRAINT "ServiceSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSubscription" ADD CONSTRAINT "ServiceSubscription_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSubscription" ADD CONSTRAINT "ServiceSubscription_acquisitionId_fkey" FOREIGN KEY ("acquisitionId") REFERENCES "Acquisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSubscription" ADD CONSTRAINT "ServiceSubscription_trialGrantId_fkey" FOREIGN KEY ("trialGrantId") REFERENCES "TrialGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationDecision" ADD CONSTRAINT "RecommendationDecision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationDecision" ADD CONSTRAINT "RecommendationDecision_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RecommendationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationDecision" ADD CONSTRAINT "RecommendationDecision_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CatalogOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_acquisitionId_fkey" FOREIGN KEY ("acquisitionId") REFERENCES "Acquisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;


