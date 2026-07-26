import type { createCommunicationCore } from "@/modules/communication-core";

import type { ServicesCommunicationPort } from "./acquisition-service";

type CommunicationCore = ReturnType<typeof createCommunicationCore>;

export function createServicesCommunicationAdapter(core: CommunicationCore): ServicesCommunicationPort {
  return {
    async openServiceRequest(input) {
      const opened = await core.openConversation({
        sourceModule: "services",
        idempotencyKey: input.idempotencyKey,
        mode: "DIRECT",
        tenantId: input.tenantId,
        typeKey: "service_request",
        subject: `طلب خدمة: ${input.offeringName}`,
        actor: { type: "CUSTOMER", userId: input.userId },
        firstEntry: {
          body: input.customerMessage,
          idempotencyKey: `${input.idempotencyKey}:entry`,
          metadata: { acquisitionId: input.context.entityId },
        },
        workItem: input.workItemRequired ? { queueKey: "services", priority: "NORMAL", slaPolicyKey: "services.default" } : null,
        contexts: [input.context],
        correlationId: input.correlationId,
      });
      return { conversationId: opened.conversationId, workItemId: opened.workItemId };
    },
  };
}
