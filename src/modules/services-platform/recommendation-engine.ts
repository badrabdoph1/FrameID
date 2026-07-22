import type { EligibilityContext, EligibilityPolicy } from "./eligibility";
import { evaluateOfferingEligibility } from "./eligibility";

export type RecommendationContext = EligibilityContext & {
  ownedOfferingIds: readonly string[];
  dismissedRuleKeys: readonly string[];
  excludedRuleKeys?: readonly string[];
};

export type RecommendationRuleInput = {
  id: string;
  key: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  priority: number;
  conditions: EligibilityPolicy;
  action: { offeringId: string; score?: number };
  placements: readonly string[];
  reasonCodes: readonly string[];
  startsAt: Date | null;
  endsAt: Date | null;
};

export function evaluateRecommendationRules(input: {
  context: RecommendationContext;
  rules: readonly RecommendationRuleInput[];
  placement: string;
  now: Date;
}) {
  return input.rules.flatMap((rule) => {
    if (rule.status !== "ACTIVE") return [];
    if (!rule.placements.includes(input.placement)) return [];
    if (rule.startsAt && rule.startsAt > input.now) return [];
    if (rule.endsAt && rule.endsAt <= input.now) return [];
    if (input.context.ownedOfferingIds.includes(rule.action.offeringId)) return [];
    if (input.context.dismissedRuleKeys.includes(rule.key) || input.context.excludedRuleKeys?.includes(rule.key)) return [];
    const eligibility = evaluateOfferingEligibility(input.context, rule.conditions);
    if (!eligibility.visible || !eligibility.eligible) return [];
    return [{
      ruleId: rule.id,
      ruleKey: rule.key,
      offeringId: rule.action.offeringId,
      placement: input.placement,
      priority: rule.priority,
      score: rule.action.score ?? 0,
      reasonCodes: [...rule.reasonCodes],
    }];
  }).sort((left, right) => right.priority - left.priority || right.score - left.score || left.ruleKey.localeCompare(right.ruleKey));
}
