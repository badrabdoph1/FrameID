import { Prisma, type PrismaClient } from "@prisma/client";

export const productAnalyticsEventNames = [
  "catalog.viewed", "offering.viewed", "recommendation.shown", "recommendation.clicked", "recommendation.dismissed",
  "acquisition.requested", "payment.started", "payment.submitted", "payment.approved", "acquisition.fulfilled", "subscription.cancelled",
] as const;

export const clientProductAnalyticsEventNames = [
  "catalog.viewed", "offering.viewed", "recommendation.shown", "recommendation.clicked", "recommendation.dismissed", "payment.started",
] as const satisfies readonly ProductAnalyticsEventName[];

export type ProductAnalyticsEventName = typeof productAnalyticsEventNames[number];

export async function trackProductAnalyticsEvent(prisma: PrismaClient, input: {
  name: ProductAnalyticsEventName;
  idempotencyKey: string;
  tenantId?: string | null;
  userId?: string | null;
  productId?: string | null;
  offeringId?: string | null;
  acquisitionId?: string | null;
  attributionId?: string | null;
  sessionKey?: string | null;
  properties?: Record<string, unknown> | null;
  occurredAt?: Date;
}) {
  return prisma.productAnalyticsEvent.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    update: {},
    create: {
      ...input,
      properties: input.properties == null ? undefined : input.properties as Prisma.InputJsonValue,
      occurredAt: input.occurredAt ?? new Date(),
    },
    select: { id: true, name: true, occurredAt: true },
  });
}
