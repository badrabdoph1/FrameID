import { describe, expect, it } from "vitest";

import { createServicesPaymentService, type ServicesPaymentRepository } from "@/modules/services-platform/payment-integration";

describe("services payment integration", () => {
  it("uses the immutable acquisition total and emits an outbox event on approval", async () => {
    const events: string[] = [];
    const repository: ServicesPaymentRepository = {
      async getPayableAcquisition() { return { id: "acq_1", tenantId: "tenant_1", status: "AWAITING_PAYMENT", acceptedTotal: 49000, acceptedCurrency: "EGP" }; },
      async createDraft(input) { events.push(`draft:${input.amount}:${input.currency}`); return { id: "payment_1", status: "DRAFT" }; },
      async approve(input) { events.push(`approve:${input.paymentRequestId}`); return { acquisitionId: "acq_1", tenantId: "tenant_1" }; },
      async reject() { throw new Error("unused"); },
      async refund() { throw new Error("unused"); },
    };
    const service = createServicesPaymentService(repository);

    const draft = await service.createDraft({ acquisitionId: "acq_1", tenantId: "tenant_1", method: "INSTAPAY", paymentAccountId: "account_1", reference: "ref" });
    const approved = await service.approve({ paymentRequestId: draft.id, reviewerId: "admin_1", idempotencyKey: "approve_1" });

    expect(events).toEqual(["draft:49000:EGP", "approve:payment_1"]);
    expect(approved).toEqual({ acquisitionId: "acq_1", tenantId: "tenant_1" });
  });

  it("refuses cross-tenant payment creation", async () => {
    const repository: ServicesPaymentRepository = {
      async getPayableAcquisition() { return { id: "acq", tenantId: "owner", status: "AWAITING_PAYMENT", acceptedTotal: 1, acceptedCurrency: "EGP" }; },
      async createDraft() { throw new Error("unused"); }, async approve() { throw new Error("unused"); }, async reject() { throw new Error("unused"); }, async refund() { throw new Error("unused"); },
    };
    await expect(createServicesPaymentService(repository).createDraft({ acquisitionId: "acq", tenantId: "attacker", method: "INSTAPAY" })).rejects.toThrow(/ownership/i);
  });
});
