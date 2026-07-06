import { describe, expect, it } from "vitest";

import {
  createBillingActivationService,
  type BillingActivationRepository
} from "@/modules/billing/billing-activation-service";

function createRepository(): BillingActivationRepository & {
  events: string[];
} {
  const events: string[] = [];

  return {
    events,
    async createPaymentRequest(input) {
      events.push(
        `payment:${input.tenantId}:${input.method}:${input.amount}:${input.proofAssetId ?? "no-proof"}`
      );
      return {
        id: "payment_1",
        status: "PENDING"
      };
    },
    async approvePayment(input) {
      events.push(`approve:${input.paymentRequestId}:${input.reviewerId}`);
      return {
        tenantId: "tenant_1",
        subscriptionId: "subscription_1"
      };
    },
    async rejectPayment(input) {
      events.push(`reject:${input.paymentRequestId}:${input.reviewerId}`);
      return {
        tenantId: "tenant_1"
      };
    },
    async activateSubscription(input) {
      events.push(`activate:${input.tenantId}:${input.subscriptionId}`);
    },
    async recordAudit(input) {
      events.push(`audit:${input.action}:${input.entityId}`);
    }
  };
}

describe("billing activation service", () => {
  it("creates a pending manual payment request for activation", async () => {
    const repository = createRepository();
    const service = createBillingActivationService({ repository });

    await expect(
      service.requestManualActivation({
        tenantId: "tenant_1",
        subscriptionId: "subscription_1",
        method: "INSTAPAY",
        amount: 120000,
        currency: "EGP",
        reference: "ali-payment",
        proofAssetId: "asset_1"
      })
    ).resolves.toEqual({
      paymentRequestId: "payment_1",
      status: "PENDING"
    });

    expect(repository.events).toEqual([
      "payment:tenant_1:INSTAPAY:120000:asset_1",
      "audit:PAYMENT_REQUEST_CREATED:payment_1"
    ]);
  });

  it("approves payment and activates the tenant subscription", async () => {
    const repository = createRepository();
    const service = createBillingActivationService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    await service.approveManualPayment({
      paymentRequestId: "payment_1",
      reviewerId: "admin_1",
      adminNote: "Verified"
    });

    expect(repository.events).toEqual([
      "approve:payment_1:admin_1",
      "activate:tenant_1:subscription_1",
      "audit:PAYMENT_APPROVED:payment_1",
      "audit:SUBSCRIPTION_ACTIVATED:subscription_1"
    ]);
  });

  it("rejects a manual payment request with a review audit trail", async () => {
    const repository = createRepository();
    const service = createBillingActivationService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    await service.rejectManualPayment({
      paymentRequestId: "payment_1",
      reviewerId: "admin_1",
      adminNote: "Reference mismatch"
    });

    expect(repository.events).toEqual([
      "reject:payment_1:admin_1",
      "audit:PAYMENT_REJECTED:payment_1"
    ]);
  });
});
