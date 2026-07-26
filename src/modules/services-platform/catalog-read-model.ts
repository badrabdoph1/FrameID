import type { EligibilityContext, EligibilityPolicy } from "./eligibility";
import { evaluateOfferingEligibility } from "./eligibility";

type ReleaseStage = "ANNOUNCED" | "PRIVATE_PREVIEW" | "BETA" | "GA" | "DEPRECATED";
type SalesMode = "SELF_SERVE" | "REQUEST" | "QUOTE_ONLY" | "CONTACT_ONLY";

export type CatalogReadPrice = {
  id: string;
  amount: number;
  currency: string;
  marketCode: string;
  billingInterval: "ONE_TIME" | "MONTHLY" | "YEARLY";
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type CatalogReadOffering = {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  description: string | null;
  type: string;
  salesMode: SalesMode;
  releaseStage: ReleaseStage;
  accessTier: string;
  eligibilityPolicy: EligibilityPolicy | null;
  sortOrder: number;
  prices: CatalogReadPrice[];
  capabilityKeys: string[];
  capabilities?: Array<{ capabilityId: string; capabilityKey: string; value: unknown }>;
  bundleComponents?: Array<{ offeringId: string; offeringCode: string; offeringName: string; quantity: number; required: boolean }>;
  trialPolicies?: Array<{ id: string; durationDays: number | null; usageLimit: number | null; usageCapabilityKey: string | null; graceDays: number; requiresPaymentMethod: boolean; isActive: boolean }>;
};

export type CatalogReadProduct = {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  description: string | null;
  category: string;
  tags: unknown;
  media: unknown;
  releaseStage: ReleaseStage;
  accessTier: string;
  eligibilityPolicy: EligibilityPolicy | null;
  sortOrder: number;
  isFeatured: boolean;
  offerings: CatalogReadOffering[];
};

function currentPrice(prices: CatalogReadPrice[], marketCode: string, currency: string, now: Date) {
  const available = prices.filter((price) =>
    price.currency === currency
      && price.effectiveFrom <= now
      && (!price.effectiveTo || price.effectiveTo > now)
      && (price.marketCode === marketCode || price.marketCode === "GLOBAL"),
  );
  return available.sort((left, right) => {
    const marketPriority = Number(right.marketCode === marketCode) - Number(left.marketCode === marketCode);
    return marketPriority || right.effectiveFrom.getTime() - left.effectiveFrom.getTime();
  })[0] ?? null;
}

function ctaFor(offering: CatalogReadOffering, eligible: boolean) {
  if (!eligible) return "REQUEST_ACCESS" as const;
  if (offering.releaseStage === "BETA") return "JOIN_BETA" as const;
  if (offering.releaseStage === "ANNOUNCED") return "COMING_SOON" as const;
  if (offering.salesMode === "SELF_SERVE") return "BUY" as const;
  if (offering.salesMode === "REQUEST") return "REQUEST" as const;
  if (offering.salesMode === "QUOTE_ONLY") return "REQUEST_QUOTE" as const;
  return "CONTACT" as const;
}

function hasAccessTier(context: EligibilityContext, accessTier: string) {
  return accessTier === "STANDARD" || Boolean(context.accessTiers?.includes(accessTier));
}

export function buildCatalogReadModel(input: {
  products: CatalogReadProduct[];
  context: EligibilityContext;
  marketCode: string;
  currency: string;
  now: Date;
}) {
  const products = input.products
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .flatMap((product) => {
      const productEligibility = evaluateOfferingEligibility(input.context, product.eligibilityPolicy);
      if (!productEligibility.visible) return [];
      const productTierAllowed = hasAccessTier(input.context, product.accessTier);

      const offerings = product.offerings
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .flatMap((offering) => {
          const eligibility = evaluateOfferingEligibility(input.context, offering.eligibilityPolicy);
          if (!eligibility.visible) return [];
          const price = currentPrice(offering.prices, input.marketCode, input.currency, input.now);
          const offeringTierAllowed = hasAccessTier(input.context, offering.accessTier);
          const eligible = productEligibility.eligible && eligibility.eligible && productTierAllowed && offeringTierAllowed;
          return [{
            id: offering.id,
            code: offering.code,
            name: offering.name,
            shortDescription: offering.shortDescription,
            description: offering.description,
            type: offering.type,
            releaseStage: offering.releaseStage,
            accessTier: offering.accessTier,
            capabilityKeys: offering.capabilityKeys,
            capabilities: offering.capabilities ?? [],
            bundleComponents: offering.bundleComponents ?? [],
            trialPolicies: (offering.trialPolicies ?? []).filter((policy) => policy.isActive),
            eligible,
            purchasable: eligible && offering.releaseStage !== "ANNOUNCED",
            recommended: productEligibility.recommended || eligibility.recommended,
            reasonCodes: [...new Set([
              ...productEligibility.reasonCodes,
              ...eligibility.reasonCodes,
              ...(!productTierAllowed || !offeringTierAllowed ? ["ACCESS_TIER_REQUIRED"] : []),
            ])],
            ctaMode: ctaFor(offering, eligible),
            displayPrice: price ? {
              amount: price.amount,
              currency: price.currency,
              billingInterval: price.billingInterval,
            } : null,
          }];
        });

      return [{
        id: product.id,
        code: product.code,
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        category: product.category,
        tags: product.tags,
        media: product.media,
        releaseStage: product.releaseStage,
        accessTier: product.accessTier,
        featured: product.isFeatured,
        beta: product.releaseStage === "BETA",
        comingSoon: product.releaseStage === "ANNOUNCED",
        deprecated: product.releaseStage === "DEPRECATED",
        eligible: productEligibility.eligible && productTierAllowed,
        offerings,
      }];
    });

  return {
    generatedAt: input.now,
    products,
    featured: products.filter((product) => product.featured),
    beta: products.filter((product) => product.beta),
    comingSoon: products.filter((product) => product.comingSoon),
  };
}
