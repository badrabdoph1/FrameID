import { describe, expect, it } from "vitest";

import { createAcquisitionService, type AcquisitionRepository, type ServicesCommunicationPort } from "@/modules/services-platform/acquisition-service";
import { assertAcquisitionTransition } from "@/modules/services-platform/acquisition-state-machine";

describe("acquisition lifecycle", () => {
  it("accepts valid lifecycle paths and rejects skipped payment/fulfillment states", () => {
    expect(() => assertAcquisitionTransition("REQUESTED", "QUALIFYING")).not.toThrow();
    expect(() => assertAcquisitionTransition("AWAITING_PAYMENT", "PAID")).not.toThrow();
    expect(() => assertAcquisitionTransition("PAID", "FULFILLED")).toThrow();
    expect(() => assertAcquisitionTransition("CANCELLED", "REQUESTED")).toThrow();
  });

  it("creates the acquisition first, then an idempotent Communication Core conversation and WorkItem", async () => {
    const events: string[] = [];
    const repository: AcquisitionRepository = {
      async createFromCatalog(input) { events.push(`create:${input.idempotencyKey}`); return { id: "acq_1", tenantId: input.tenantId, offeringId: input.offeringId, offeringName: "Logo design", status: "DRAFT", correlationId: "corr_1", conversationId: null, workItemRequired: true }; },
      async attachConversation(input) { events.push(`attach:${input.conversationId}`); return { id: input.acquisitionId, status: "REQUESTED", conversationId: input.conversationId }; },
      async getState() { return { status: "REQUESTED" }; },
      async transition() { throw new Error("unused"); },
    };
    const communication: ServicesCommunicationPort = {
      async openServiceRequest(input) {
        events.push(`conversation:${input.context.entityId}:${input.idempotencyKey}`);
        return { conversationId: "conversation_1", workItemId: "work_1" };
      },
    };
    const service = createAcquisitionService(repository, communication);

    const result = await service.requestOffering({ tenantId: "tenant_1", userId: "user_1", offeringId: "offering_1", idempotencyKey: "request_1", attributionId: "recommendation_1", customerMessage: "I need a logo" });

    expect(result).toMatchObject({ id: "acq_1", status: "REQUESTED", conversationId: "conversation_1", workItemId: "work_1" });
    expect(events).toEqual(["create:request_1", "conversation:acq_1:services:request_1", "attach:conversation_1"]);
  });

  it("does not open a second conversation when an idempotent retry already has one", async () => {
    const repository: AcquisitionRepository = {
      async createFromCatalog(input) { return { id: "acq_1", tenantId: input.tenantId, offeringId: input.offeringId, offeringName: "Existing", status: "REQUESTED", correlationId: "corr", conversationId: "conversation_1", workItemRequired: true }; },
      async attachConversation() { throw new Error("must not attach"); },
      async getState() { return { status: "REQUESTED" }; },
      async transition() { throw new Error("unused"); },
    };
    const communication: ServicesCommunicationPort = { async openServiceRequest() { throw new Error("must not open"); } };

    await expect(createAcquisitionService(repository, communication).requestOffering({ tenantId: "t", userId: "u", offeringId: "o", idempotencyKey: "same" })).resolves.toMatchObject({ conversationId: "conversation_1" });
  });
});
