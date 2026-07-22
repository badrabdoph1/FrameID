import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
const models = ["ProductDefinition","CatalogOffering","CatalogPrice","CapabilityDefinition","OfferingCapability","BundleComponent","TrialPolicy","WorkflowTemplate","CatalogRevision","Acquisition","AcquisitionLine","FulfillmentRun","Entitlement","ProductInstance","TrialGrant","UsageLedger","ServiceSubscription","RecommendationRule","RecommendationDecision","ProductAnalyticsEvent","ServicesOutboxEvent"];
const enums = ["ProductPublicationStatus","ProductReleaseStage","OfferingType","SalesMode","FulfillmentMode","ActivationMode","PriceBillingInterval","AcquisitionStatus","FulfillmentStatus","EntitlementStatus","ProductInstanceStatus","TrialGrantStatus","ServiceSubscriptionStatus","RecommendationRuleStatus","ServicesOutboxStatus"];

describe("Services Platform Prisma contract", () => {
  it.each(models)("declares model %s", model => expect(schema).toContain(`model ${model} {`));
  it.each(enums)("declares enum %s", item => expect(schema).toContain(`enum ${item} {`));
  it("keeps Communication Core weakly coupled", () => {
    const block = schema.slice(schema.indexOf("model Acquisition {"), schema.indexOf("model AcquisitionLine {"));
    expect(block).toContain("conversationId");
    expect(block).not.toContain("CommunicationConversation");
  });
  it("contains scale and idempotency indexes", () => {
    expect(schema).toContain("@@unique([tenantId, idempotencyKey])");
    expect(schema).toContain("@@index([tenantId, status, createdAt])");
    expect(schema).toContain("@@index([status, availableAt, leaseExpiresAt])");
    expect(schema).toContain("@@index([tenantId, capabilityKey, createdAt])");
  });
});
