import type { ClaimedServicesEvent } from "./outbox-worker";
import type { RecommendationContext, RecommendationRuleInput } from "./recommendation-engine";

export type ExternalRecommendation = {
  offeringId: string;
  score: number;
  reasonCodes: readonly string[];
  attributionMetadata?: Record<string, unknown>;
};

/** Extension seam for a future ML recommender. The rules engine remains the default implementation. */
export interface RecommendationProvider {
  recommend(input: { context: RecommendationContext; rules: readonly RecommendationRuleInput[]; limit: number }): Promise<ExternalRecommendation[]>;
}

/** Extension seam for a future warehouse or event stream sink. */
export interface ProductAnalyticsSink {
  publish(event: ClaimedServicesEvent): Promise<void>;
}

/** Extension seam for product-specific provisioning without coupling the platform core to product code. */
export interface ProductProvisioningAdapter {
  productRegistryKey: string;
  provision(input: { tenantId: string; productId: string; acquisitionId: string; instanceKey: string; configuration: unknown }): Promise<{ externalRef?: string | null }>;
  suspend?(input: { tenantId: string; instanceKey: string; reason: string }): Promise<void>;
  deprovision?(input: { tenantId: string; instanceKey: string; reason: string }): Promise<void>;
}

/** Transport-neutral publisher seam for a future split into services. */
export interface ServicesDomainEventPublisher {
  publish(event: ClaimedServicesEvent): Promise<void>;
}
