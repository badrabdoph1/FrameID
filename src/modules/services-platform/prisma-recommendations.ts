import { Prisma, type PrismaClient } from "@prisma/client";

import type { EligibilityPolicy } from "./eligibility";
import { evaluateRecommendationRules, type RecommendationContext, type RecommendationRuleInput } from "./recommendation-engine";
import { getCustomerCatalogReadModel } from "./prisma-catalog-repository";
import { resolveCommerceMarket } from "./commerce-market";

function stringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function getTenantRecommendations(prisma: PrismaClient, input: {
  context: RecommendationContext;
  placement: string;
  limit?: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const commerceMarket = resolveCommerceMarket(input.context);
  const [rules, priorDecisions, catalog] = await Promise.all([
    prisma.recommendationRule.findMany({
      where: { status: "ACTIVE", OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.recommendationDecision.findMany({
      where: { tenantId: input.context.tenantId, placement: input.placement, createdAt: { gte: new Date(now.getTime() - 30 * 86_400_000) } },
      include: { rule: { select: { key: true, cooldownHours: true, frequencyCap: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    getCustomerCatalogReadModel(prisma, { context: input.context, ...commerceMarket, now }),
  ]);
  const eligibleOfferingIds = new Set(catalog.products.flatMap((product) => product.offerings.filter((offering) => offering.eligible && offering.purchasable).map((offering) => offering.id)));
  const dismissedRuleKeys = priorDecisions.flatMap((decision) => {
    if (!decision.rule?.key || !decision.dismissedAt) return [];
    const cooldownMs = (decision.rule.cooldownHours ?? 24 * 30) * 3_600_000;
    return decision.dismissedAt.getTime() + cooldownMs > now.getTime() ? [decision.rule.key] : [];
  });
  const decisionCountByRule = new Map<string, number>();
  for (const decision of priorDecisions) {
    if (decision.rule?.key) decisionCountByRule.set(decision.rule.key, (decisionCountByRule.get(decision.rule.key) ?? 0) + 1);
  }
  const frequencyCappedRuleKeys = priorDecisions.flatMap((decision) => {
    const key = decision.rule?.key;
    const cap = decision.rule?.frequencyCap;
    return key && cap != null && (decisionCountByRule.get(key) ?? 0) >= cap ? [key] : [];
  });
  const mapped: RecommendationRuleInput[] = rules.flatMap((rule) => {
    const action = rule.action as { offeringId: string; score?: number };
    if (!eligibleOfferingIds.has(action.offeringId)) return [];
    return [{
    id: rule.id,
    key: rule.key,
    status: rule.status,
    priority: rule.priority,
    conditions: rule.conditions as EligibilityPolicy,
    action,
    placements: stringArray(rule.placements),
    reasonCodes: stringArray(rule.reasonCodes),
    startsAt: rule.startsAt,
    endsAt: rule.endsAt,
    }];
  });
  const evaluated = evaluateRecommendationRules({
    context: {
      ...input.context,
      dismissedRuleKeys: [...new Set([...input.context.dismissedRuleKeys, ...dismissedRuleKeys])],
      excludedRuleKeys: [...new Set([...(input.context.excludedRuleKeys ?? []), ...frequencyCappedRuleKeys])],
    },
    rules: mapped,
    placement: input.placement,
    now,
  }).slice(0, input.limit ?? 6);
  const day = now.toISOString().slice(0, 10);
  const decisions = await Promise.all(evaluated.map((decision) => {
    const attributionId = `rec:${input.context.tenantId}:${decision.ruleId}:${decision.offeringId}:${input.placement}:${day}`;
    return prisma.recommendationDecision.upsert({
      where: { attributionId },
      update: { score: decision.score, reasonCodes: decision.reasonCodes as Prisma.InputJsonValue, expiresAt: new Date(now.getTime() + 24 * 3_600_000) },
      create: {
        tenantId: input.context.tenantId,
        ruleId: decision.ruleId,
        offeringId: decision.offeringId,
        attributionId,
        placement: input.placement,
        score: decision.score,
        reasonCodes: decision.reasonCodes as Prisma.InputJsonValue,
        expiresAt: new Date(now.getTime() + 24 * 3_600_000),
      },
      include: { offering: { include: { product: { select: { code: true, name: true } }, prices: { where: { isActive: true }, orderBy: { effectiveFrom: "desc" }, take: 1 } } } },
    });
  }));
  return decisions;
}

export async function dismissRecommendation(prisma: PrismaClient, input: { tenantId: string; attributionId: string; dismissedAt?: Date }) {
  const result = await prisma.recommendationDecision.updateMany({
    where: { tenantId: input.tenantId, attributionId: input.attributionId },
    data: { status: "DISMISSED", dismissedAt: input.dismissedAt ?? new Date() },
  });
  if (result.count !== 1) throw new Error("Recommendation was not found.");
}
