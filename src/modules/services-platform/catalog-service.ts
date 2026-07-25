import type { ProductRegistry } from "./product-registry";

export type CatalogPublicationStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "PAUSED" | "RETIRED";
export type CatalogReleaseStage = "ANNOUNCED" | "PRIVATE_PREVIEW" | "BETA" | "GA" | "DEPRECATED";

export type ProductDraftPrice = {
  id: string;
  amount: number;
  currency: string;
  marketCode: string;
  billingInterval: "ONE_TIME" | "MONTHLY" | "YEARLY";
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
};

export type ProductDraftCapability = {
  capabilityId: string;
  capabilityKey: string;
  value: unknown;
};

export type ProductDraftOffering = {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  description: string | null;
  type?: "PLAN" | "ADD_ON" | "ONE_TIME_SERVICE" | "MANAGED_SERVICE" | "BUNDLE" | "CUSTOM_QUOTE";
  salesMode: "SELF_SERVE" | "REQUEST" | "QUOTE_ONLY" | "CONTACT_ONLY";
  fulfillmentMode: "AUTOMATIC" | "MANUAL" | "HYBRID" | "EXTERNAL";
  activationMode: "INSTANT" | "AFTER_PAYMENT" | "AFTER_APPROVAL" | "SCHEDULED";
  publicationStatus: CatalogPublicationStatus;
  releaseStage: CatalogReleaseStage;
  accessTier: string;
  requirements: unknown;
  eligibilityPolicy: unknown;
  sortOrder: number;
  workflowTemplateKey: string | null;
  workflowTemplateVersion: number | null;
  prices: ProductDraftPrice[];
  capabilityKeys: string[];
  capabilities: ProductDraftCapability[];
  bundleComponents: Array<{
    offeringId: string;
    offeringCode: string;
    offeringName: string;
    publicationStatus: CatalogPublicationStatus;
    productId: string | null;
    productPublicationStatus: CatalogPublicationStatus | null;
    productCode: string | null;
    quantity: number;
    required: boolean;
    capabilities: ProductDraftCapability[];
  }>;
};

export type ProductDraft = {
  id: string;
  code: string;
  registryKey: string;
  name: string;
  shortDescription: string;
  description: string | null;
  category: string;
  tags: unknown;
  media: unknown;
  publicationStatus: CatalogPublicationStatus;
  releaseStage: CatalogReleaseStage;
  accessTier: string;
  eligibilityPolicy: unknown;
  sortOrder: number;
  isFeatured: boolean;
  schemaVersion: 2;
  offerings: ProductDraftOffering[];
};

export function parsePublishedCatalogSnapshot(value: unknown): ProductDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshot = value as Partial<ProductDraft>;
  if (snapshot.schemaVersion !== 2 || typeof snapshot.id !== "string" || typeof snapshot.code !== "string" || !Array.isArray(snapshot.offerings)) return null;
  return snapshot as ProductDraft;
}

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
  publishRevision(input: Omit<CatalogRevisionInput, "revision">): Promise<{ id: string; revision: number }>;
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
    if (!offering.workflowTemplateKey) errors.push(`Offering ${offering.code} requires a workflow template`);
    const priceOptional = offering.type === "CUSTOM_QUOTE";
    if (!priceOptional && !offering.prices.some((price) => price.isActive && price.amount >= 0)) {
      errors.push(`Offering ${offering.code} requires an active price`);
    }
    if (offering.type === "BUNDLE") {
      if (!offering.bundleComponents.length) errors.push(`Bundle ${offering.code} requires at least one component`);
      for (const component of offering.bundleComponents) {
        const publishedWithCurrentProduct = component.productId === draft.id && !["PAUSED", "RETIRED"].includes(component.publicationStatus);
        const externallyPublished = component.productId !== draft.id
          && component.publicationStatus === "PUBLISHED"
          && (!component.productPublicationStatus || component.productPublicationStatus === "PUBLISHED");
        if (!publishedWithCurrentProduct && !externallyPublished) errors.push(`Bundle component is not publishable: ${component.offeringCode}`);
      }
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

      const publishedAt = now();
      const saved = await repository.publishRevision({
        productId: input.productId,
        snapshot: structuredClone(snapshot),
        actorId: input.actorId,
        actorName: input.actorName,
        changeNote: input.changeNote,
        publishedAt,
      });
      return { revisionId: saved.id, revision: saved.revision };
    },
    pause(productId: string) { return repository.pauseProduct(productId); },
    retire(productId: string) { return repository.retireProduct(productId); },
  };
}
