import { describe, expect, it } from "vitest";

import {
  CatalogValidationError,
  createCatalogService,
  type CatalogRepository,
  type ProductDraft,
} from "@/modules/services-platform/catalog-service";
import { createProductRegistry } from "@/modules/services-platform/product-registry";

function validDraft(): ProductDraft {
  return {
    id: "product_1",
    code: "pricing-site",
    registryKey: "pricing-site",
    name: "Pricing Site",
    shortDescription: "Professional pricing pages",
    description: null,
    category: "websites",
    tags: [],
    media: [],
    publicationStatus: "DRAFT",
    releaseStage: "GA",
    accessTier: "STANDARD",
    eligibilityPolicy: null,
    sortOrder: 0,
    isFeatured: true,
    schemaVersion: 2,
    offerings: [{
      id: "offering_1",
      code: "pricing-site-core",
      name: "Core",
      shortDescription: "Core",
      description: null,
      publicationStatus: "DRAFT",
      salesMode: "SELF_SERVE",
      fulfillmentMode: "AUTOMATIC",
      activationMode: "AFTER_PAYMENT",
      releaseStage: "GA",
      accessTier: "STANDARD",
      requirements: null,
      eligibilityPolicy: null,
      sortOrder: 0,
      workflowTemplateKey: "payment_then_auto",
      workflowTemplateVersion: 1,
      prices: [{ id: "price_1", amount: 49000, currency: "EGP", marketCode: "EG", billingInterval: "YEARLY", effectiveFrom: "2026-01-01T00:00:00.000Z", effectiveTo: null, isActive: true }],
      capabilityKeys: ["pricing_site.access"],
      capabilities: [{ capabilityId: "cap_1", capabilityKey: "pricing_site.access", value: true }],
      bundleComponents: [],
    }],
  };
}

function repository(draft: ProductDraft): CatalogRepository & { published: number[] } {
  const published: number[] = [];
  return {
    published,
    async getProductDraft() { return draft; },
    async publishRevision() { published.push(3); return { id: "revision_3", revision: 3 }; },
    async pauseProduct() {},
    async retireProduct() {},
  };
}

describe("catalog draft / preview / publish", () => {
  it("publishes an immutable validated snapshot and advances the published revision", async () => {
    const draft = validDraft();
    const repo = repository(draft);
    const registry = createProductRegistry([{
      key: "pricing-site",
      productCode: "pricing-site",
      displayName: "Pricing Site",
      supportedCapabilities: ["pricing_site.access"],
      async provision() { return {}; },
    }]);
    const service = createCatalogService(repo, registry, () => new Date("2026-07-22T12:00:00.000Z"));

    const preview = await service.preview("product_1");
    const result = await service.publish({ productId: "product_1", actorId: "admin_1", actorName: "Admin", changeNote: "Launch" });

    expect(preview.validationErrors).toEqual([]);
    expect(result).toEqual({ revisionId: "revision_3", revision: 3 });
    expect(repo.published).toEqual([3]);
  });

  it("blocks publication when an adapter, active price or supported capability is missing", async () => {
    const draft = validDraft();
    draft.offerings[0].prices = [];
    const service = createCatalogService(repository(draft), createProductRegistry([]));

    await expect(service.publish({ productId: draft.id, actorName: "Admin" })).rejects.toBeInstanceOf(CatalogValidationError);
    await expect(service.publish({ productId: draft.id, actorName: "Admin" })).rejects.toThrow(/adapter|price/i);
  });
});
