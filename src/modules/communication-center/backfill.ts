import { Prisma, type PrismaClient } from "@prisma/client";

type LegacyBackfillBridge = {
  publishNotification(input: {
    sourceModule: string;
    sourceId: string;
    tenantId: string;
    type: string;
    title: string;
    body: string;
    context: { namespace: string; entityType: string; entityId: string; relationKey: string };
  }): Promise<unknown>;
  publishCustomerRequest(input: {
    requestId: string;
    tenantId: string;
    siteId: string;
    type: string;
    title: string;
    description: string | null;
  }): Promise<unknown>;
  publishSupportCase(input: {
    supportCaseId: string;
    tenantId: string;
    openedById: string | null;
    subject: string;
    description: string;
  }): Promise<unknown>;
  publishCampaign(input: {
    campaignId: string;
    tenantIds: string[];
    title: string;
    body: string;
    tone: string;
    audienceMode: string;
    filters: Record<string, unknown>;
    actor: { id: string; name: string };
  }): Promise<unknown>;
};

export async function runCommunicationLegacyBackfill(
  prisma: PrismaClient,
  bridge: LegacyBackfillBridge,
  options: { limit?: number } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const [notifications, customerRequests, supportCases, campaigns] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string; tenantId: string; type: string; title: string; body: string }>>(Prisma.sql`
      SELECT n."id", n."tenantId", n."type", n."title", n."body"
      FROM "Notification" n
      WHERE n."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "CommunicationContextReference" c
          WHERE c."namespace" = 'legacy' AND c."entityType" = 'notification' AND c."entityId" = n."id"
        )
      ORDER BY n."createdAt" ASC, n."id" ASC
      LIMIT ${limit}
    `),
    prisma.$queryRaw<Array<{ id: string; tenantId: string; siteId: string; type: string; title: string; description: string | null }>>(Prisma.sql`
      SELECT r."id", r."tenantId", r."siteId", r."type"::text, r."title", r."description"
      FROM "CustomerRequest" r
      WHERE NOT EXISTS (
        SELECT 1 FROM "CommunicationContextReference" c
        WHERE c."namespace" = 'customers' AND c."entityType" = 'customer_request' AND c."entityId" = r."id"
      )
      ORDER BY r."createdAt" ASC, r."id" ASC
      LIMIT ${limit}
    `),
    prisma.$queryRaw<Array<{ id: string; tenantId: string; openedById: string | null; subject: string; description: string }>>(Prisma.sql`
      SELECT s."id", s."tenantId", s."openedById", s."subject", s."description"
      FROM "SupportCase" s
      WHERE NOT EXISTS (
        SELECT 1 FROM "CommunicationContextReference" c
        WHERE c."namespace" = 'support' AND c."entityType" = 'support_case' AND c."entityId" = s."id"
      )
      ORDER BY s."createdAt" ASC, s."id" ASC
      LIMIT ${limit}
    `),
    prisma.$queryRaw<Array<{
      id: string;
      title: string;
      body: string;
      tone: string;
      audienceMode: string;
      audienceSnapshot: Record<string, unknown> | null;
      createdByAdminId: string;
      createdByName: string;
      tenantIds: string[];
    }>>(Prisma.sql`
      SELECT c."id", c."title", c."body", c."tone", c."audienceMode", c."audienceSnapshot",
             c."createdByAdminId", c."createdByName",
             ARRAY(
               SELECT r."tenantId" FROM "CustomerMessageRecipient" r
               WHERE r."campaignId" = c."id" AND r."tenantId" IS NOT NULL
               ORDER BY r."tenantId"
             ) AS "tenantIds"
      FROM "CustomerMessageCampaign" c
      WHERE NOT EXISTS (
        SELECT 1 FROM "CommunicationConversation" conversation
        WHERE conversation."sourceModule" = 'legacy-messages'
          AND conversation."idempotencyKey" = CONCAT('legacy-campaign:', c."id")
      )
      ORDER BY c."createdAt" ASC, c."id" ASC
      LIMIT ${limit}
    `),
  ]);
  const result = { notifications: 0, customerRequests: 0, supportCases: 0, campaigns: 0 };

  for (const notification of notifications) {
    await bridge.publishNotification({
      sourceModule: "legacy",
      sourceId: notification.id,
      tenantId: notification.tenantId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      context: { namespace: "legacy", entityType: "notification", entityId: notification.id, relationKey: "source" },
    });
    result.notifications += 1;
  }
  for (const request of customerRequests) {
    await bridge.publishCustomerRequest({
      requestId: request.id,
      tenantId: request.tenantId,
      siteId: request.siteId,
      type: request.type,
      title: request.title,
      description: request.description,
    });
    result.customerRequests += 1;
  }
  for (const supportCase of supportCases) {
    await bridge.publishSupportCase({
      supportCaseId: supportCase.id,
      tenantId: supportCase.tenantId,
      openedById: supportCase.openedById,
      subject: supportCase.subject,
      description: supportCase.description,
    });
    result.supportCases += 1;
  }
  for (const campaign of campaigns) {
    if (campaign.tenantIds.length === 0) continue;
    await bridge.publishCampaign({
      campaignId: campaign.id,
      tenantIds: campaign.tenantIds,
      title: campaign.title,
      body: campaign.body,
      tone: campaign.tone,
      audienceMode: campaign.audienceMode,
      filters: campaign.audienceSnapshot ?? {},
      actor: { id: campaign.createdByAdminId, name: campaign.createdByName },
    });
    result.campaigns += 1;
  }
  return result;
}
