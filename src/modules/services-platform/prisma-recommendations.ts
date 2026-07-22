import { Prisma, type PrismaClient } from "@prisma/client";

import type { EligibilityPolicy } from "./eligibility";
import { evaluateRecommendationRules, type RecommendationContext, type RecommendationRuleInput } from "./recommendation-engine";

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
  const [rules, priorDecisions] = await Promise.all([
    prisma.recommendationRule.findMany({
      where: { status: "ACTIVE", OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.recommendationDecision.findMany({
      where: { tenantId: input.context.tenantId, placement: input.placement, status: "DISMISSED" },
      include: { rule: { select: { key: true, cooldownHours: true } } },
      orderBy: { dismissedAt: "desc" },
      take: 100,
    }),
  ]);
  const dismissedRuleKeys = priorDecisions.flatMap((decision) => {
    if (!decision.rule?.key || !decision.dismissedAt) return [];
    const cooldownMs = (decision.rule.cooldownHours ?? 24 * 30) * 3_600_000;
    return decision.dismissedAt.getTime() + cooldownMs > now.getTime() ? [decision.rule.key] : [];
  });
  const mapped: RecommendationRuleInput[] = rules.map((rule) => ({
    id: rule.id,
    key: rule.key,
    status: rule.status,
    priority: rule.priority,
    conditions: rule.conditions as EligibilityPolicy,
    action: rule.action as { offeringId: string; score?: number },
    placements: stringArray(rule.placements),
    reasonCodes: stringArray(rule.reasonCodes),
    startsAt: rule.startsAt,
    endsAt: rule.endsAt,
  }));
  const evaluated = evaluateRecommendationRules({
    context: { ...input.context, dismissedRuleKeys: [...new Set([...input.context.dismissedRuleKeys, ...dismissedRuleKeys])] },
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
