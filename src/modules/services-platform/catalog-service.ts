import type { ProductRegistry } from "./product-registry";

export type CatalogPublicationStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "PAUSED" | "RETIRED";
export type CatalogReleaseStage = "ANNOUNCED" | "PRIVATE_PREVIEW" | "BETA" | "GA" | "DEPRECATED";

export type ProductDraftPrice = {
  id: string;
  amount: number;
  currency: string;
  billingInterval: "ONE_TIME" | "MONTHLY" | "YEARLY";
  isActive: boolean;
};

export type ProductDraftOffering = {
  id: string;
  code: string;
  name: string;
  type?: "PLAN" | "ADD_ON" | "ONE_TIME_SERVICE" | "MANAGED_SERVICE" | "BUNDLE" | "CUSTOM_QUOTE";
  publicationStatus: CatalogPublicationStatus;
  prices: ProductDraftPrice[];
  capabilityKeys: string[];
};

export type ProductDraft = {
  id: string;
  code: string;
  registryKey: string;
  name: string;
  shortDescription: string;
  category: string;
  publicationStatus: CatalogPublicationStatus;
  releaseStage: CatalogReleaseStage;
  offerings: ProductDraftOffering[];
};

export type CatalogRevisionInput = {
  productId: string;
  revision: number;
  snapshot: ProductDraft;
  actorId?: string;
  actorName: string;
  changeNote?: string;
  publishedAt: Date;
};

export interface CatalogRepository {
  getProductDraft(productId: string): Promise<ProductDraft | null>;
  getNextRevision(productId: string): Promise<number>;
  saveRevision(input: CatalogRevisionInput): Promise<{ id: string; revision: number }>;
  publishProduct(input: { productId: string; revision: number; publishedAt: Date }): Promise<void>;
  pauseProduct(productId: string): Promise<void>;
  retireProduct(productId: string): Promise<void>;
}

export class CatalogValidationError extends Error {
  readonly validationErrors: string[];

  constructor(errors: string[]) {
    super(`Catalog publication failed: ${errors.join("; ")}`);
    this.name = "CatalogValidationError";
    this.validationErrors = errors;
  }
}

function validateDraft(draft: ProductDraft, registry: ProductRegistry): string[] {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push("Product name is required");
  if (!draft.shortDescription.trim()) errors.push("Product short description is required");
  if (!registry.has(draft.registryKey)) errors.push(`Product adapter is not registered: ${draft.registryKey}`);
  if (!draft.offerings.length) errors.push("At least one offering is required");

  const adapter = registry.has(draft.registryKey) ? registry.get(draft.registryKey) : null;
  for (const offering of draft.offerings) {
    const priceOptional = offering.type === "CUSTOM_QUOTE";
    if (!priceOptional && !offering.prices.some((price) => price.isActive && price.amount >= 0)) {
      errors.push(`Offering ${offering.code} requires an active price`);
    }
    if (adapter) {
      for (const capabilityKey of offering.capabilityKeys) {
        if (!adapter.supportedCapabilities.includes(capabilityKey)) {
          errors.push(`Product adapter does not support capability: ${capabilityKey}`);
        }
      }
    }
  }
  return errors;
}

export function createCatalogService(
  repository: CatalogRepository,
  registry: ProductRegistry,
  now: () => Date = () => new Date(),
) {
  async function loadDraft(productId: string) {
    const draft = await repository.getProductDraft(productId);
    if (!draft) throw new CatalogValidationError([`Product not found: ${productId}`]);
    return draft;
  }

  return {
    async preview(productId: string) {
      const snapshot = await loadDraft(productId);
      return { snapshot, validationErrors: validateDraft(snapshot, registry) };
    },
    async publish(input: { productId: string; actorId?: string; actorName: string; changeNote?: string }) {
      const snapshot = await loadDraft(input.productId);
      const validationErrors = validateDraft(snapshot, registry);
      if (validationErrors.length) throw new CatalogValidationError(validationErrors);

      const revision = await repository.getNextRevision(input.productId);
      const publishedAt = now();
      const saved = await repository.saveRevision({
        productId: input.productId,
        revision,
        snapshot: structuredClone(snapshot),
        actorId: input.actorId,
        actorName: input.actorName,
        changeNote: input.changeNote,
        publishedAt,
      });
      await repository.publishProduct({ productId: input.productId, revision, publishedAt });
      return { revisionId: saved.id, revision: saved.revision };
    },
    pause(productId: string) { return repository.pauseProduct(productId); },
    retire(productId: string) { return repository.retireProduct(productId); },
  };
}
