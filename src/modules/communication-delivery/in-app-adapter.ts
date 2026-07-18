import type { PrismaClient } from "@prisma/client";

import type { CommunicationDeliveryAdapter } from "./outbox-worker";

export function createInAppCommunicationDeliveryAdapter(
  prisma: PrismaClient,
  options: { now?: () => Date } = {},
): CommunicationDeliveryAdapter {
  const now = options.now ?? (() => new Date());
  return {
    channelKey: "IN_APP",
    async deliver(input) {
      const conversationId = typeof input.event.payload.conversationId === "string"
        ? input.event.payload.conversationId
        : input.event.aggregateType === "CommunicationConversation" ? input.event.aggregateId : null;
      if (!conversationId || !input.tenantId) throw new Error("حدث التسليم داخل المنصة بلا محادثة أو عميل.");
      const deliveredAt = now();
      await prisma.$transaction([
        prisma.communicationAudience.updateMany({
          where: { conversationId, tenantId: input.tenantId, deliveredAt: null, withdrawnAt: null },
          data: { deliveredAt },
        }),
        prisma.communicationCampaign.updateMany({
          where: { conversationId, status: { in: ["SCHEDULED", "PUBLISHING"] } },
          data: { status: "PUBLISHED", publishedAt: deliveredAt, publishingStartedAt: deliveredAt },
        }),
      ]);
      return { providerMessageId: null };
    },
  };
}
