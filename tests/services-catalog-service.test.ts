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
    category: "websites",
    publicationStatus: "DRAFT",
    releaseStage: "GA",
    offerings: [{
      id: "offering_1",
      code: "pricing-site-core",
      name: "Core",
      publicationStatus: "DRAFT",
      workflowTemplateKey: "payment_then_auto",
      prices: [{ id: "price_1", amount: 49000, currency: "EGP", billingInterval: "YEARLY", isActive: true }],
      capabilityKeys: ["pricing_site.access"],
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
