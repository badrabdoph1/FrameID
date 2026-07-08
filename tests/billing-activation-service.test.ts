import { describe, expect, it } from "vitest";

import {
  createBillingActivationService,
  type BillingActivationRepository
} from "@/modules/billing/billing-activation-service";

function createRepository(): BillingActivationRepository & {
  events: string[];
  setPaymentStatus(s: string): void;
} {
  const events: string[] = [];
  let paymentStatus = "DRAFT";

  return {
    events,
    setPaymentStatus(s: string) { paymentStatus = s; },
    async createDraftPaymentRequest(input) {
      events.push(
        `draft:${input.tenantId}:${input.method}:${input.amount}`
      );
      return { id: "payment_1", status: "DRAFT" };
    },
    async updatePaymentRequest(id, data) {
      events.push(`update:${id}:ref=${data.reference ?? "none"}`);
    },
    async uploadProof(id, proofAssetId) {
      events.push(`proof:${id}:${proofAssetId}`);
    },
    async removeProof(id) {
      events.push(`remove-proof:${id}`);
    },
    async submitPaymentRequest(id, submittedAt) {
      events.push(`submit:${id}:${submittedAt.toISOString()}`);
      return { tenantId: "tenant_1", subscriptionId: "subscription_1" };
    },
    async getCustomerActivePaymentRequest(tenantId) {
      return null;
    },
    async approvePayment(paymentRequestId, reviewerId, adminNote, reviewedAt) {
      events.push(`approve:${paymentRequestId}:${reviewerId}`);
      return { tenantId: "tenant_1", subscriptionId: "subscription_1", planId: "plan_1" };
    },
    async rejectPayment(paymentRequestId, reviewerId, reason, reviewedAt) {
      events.push(`reject:${paymentRequestId}:${reviewerId}:${reason}`);
      return { tenantId: "tenant_1" };
    },
    async requestReupload(paymentRequestId, reviewerId, note) {
      events.push(`reupload:${paymentRequestId}:${reviewerId}:${note}`);
    },
    async activateSubscription(tenantId, subscriptionId, planId, activatedAt) {
      events.push(`activate:${tenantId}:${subscriptionId}`);
    },
    async getPaymentRequestById(id) {
      events.push(`get-by-id:${id}`);
      return {
        id,
        status: paymentStatus,
        tenantId: "tenant_1",
        subscriptionId: "subscription_1",
        method: "INSTAPAY",
        amount: 120000,
        planId: null,
        reference: null,
        proofAssetId: null,
        submittedAt: null,
        adminNote: null,
        rejectionReason: null,
        tenant: { id: "tenant_1", status: "TRIAL" },
        plan: null,
        paymentAccount: null,
        proofAsset: null
      };
    },
    async cancelPaymentRequest(id, cancelledAt) {
      events.push(`cancel-request:${id}:${cancelledAt.toISOString()}`);
      return { tenantId: "tenant_1", subscriptionId: "subscription_1" };
    },
    async cancelSubscription(subscriptionId) {
      events.push(`cancel:${subscriptionId}`);
    },
    async extendTrial(tenantId, days) {
      events.push(`extend-trial:${tenantId}:${days}`);
      return { newEndDate: new Date() };
    },
    async endTrial(tenantId) {
      events.push(`end-trial:${tenantId}`);
    },
    async addLog(paymentRequestId, action, actorUserId, actorName, note) {
      events.push(`log:${paymentRequestId}:${action}:${note ?? ""}`);
    },
    async getLogs(paymentRequestId) {
      return [];
    },
    async createNotification(tenantId, type, title, body) {
      events.push(`notify:${tenantId}:${type}:${title}`);
    },
    async createNotificationLog(type, title, body, category) {
      events.push(`notify-log:${type}:${title}`);
    },
    async recordAudit(actorUserId, tenantId, action, entityType, entityId) {
      events.push(`audit:${action}:${entityId}`);
    },
    async recordSubscriptionChange(subscriptionId, fromPlanId, toPlanId, fromStatus, toStatus, changeType) {
      events.push(`change:${subscriptionId}:${fromStatus}->${toStatus}`);
    },
    async getPlan(planId) {
      events.push(`get-plan:${planId}`);
      return { id: planId, billingInterval: "MONTHLY", priceAmount: 120000 };
    },
    async getTrialInfo(tenantId) {
      return null;
    },
    daysRemaining(trialEndsAt) {
      return 7;
    }
  };
}

describe("billing activation service", () => {
  it("creates a pending manual payment request for activation", async () => {
    const repository = createRepository();
    const service = createBillingActivationService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

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
      status: "SUBMITTED"
    });

    expect(repository.events).toContain("draft:tenant_1:INSTAPAY:120000");
    expect(repository.events).toContain("update:payment_1:ref=ali-payment");
    expect(repository.events).toContain("proof:payment_1:asset_1");
    expect(repository.events).toContain("submit:payment_1:2026-07-06T12:00:00.000Z");
    expect(repository.events).toContain("audit:PAYMENT_REQUEST_CREATED:payment_1");
    expect(repository.events).toContain("log:payment_1:SUBMITTED:تم تقديم طلب الدفع (يدوي)");
  });

  it("approves payment and activates the tenant subscription", async () => {
    const repository = createRepository();
    repository.setPaymentStatus("UNDER_REVIEW");
    const service = createBillingActivationService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    await service.approveManualPayment({
      paymentRequestId: "payment_1",
      reviewerId: "admin_1",
      adminNote: "Verified"
    });

    expect(repository.events).toContain("approve:payment_1:admin_1");
    expect(repository.events).toContain("activate:tenant_1:subscription_1");
    expect(repository.events).toContain("log:payment_1:APPROVED:Verified");
    expect(repository.events).toContain("audit:PAYMENT_APPROVED:payment_1");
    expect(repository.events).toContain("audit:SUBSCRIPTION_ACTIVATED:subscription_1");
    expect(repository.events).toContain("change:subscription_1:UNDER_REVIEW->ACTIVE");
    expect(repository.events).toContain("notify:tenant_1:payment_approved:تم قبول طلب الدفع");
    expect(repository.events).toContain("notify-log:payment_approved:تم قبول طلب الدفع");
  });

  it("rejects a manual payment request with a review audit trail", async () => {
    const repository = createRepository();
    repository.setPaymentStatus("UNDER_REVIEW");
    const service = createBillingActivationService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    await service.rejectManualPayment({
      paymentRequestId: "payment_1",
      reviewerId: "admin_1",
      adminNote: "Reference mismatch"
    });

    expect(repository.events).toContain("reject:payment_1:admin_1:Reference mismatch");
    expect(repository.events).toContain("log:payment_1:REJECTED:Reference mismatch");
    expect(repository.events).toContain("audit:PAYMENT_REJECTED:payment_1");
    expect(repository.events).toContain("notify:tenant_1:payment_rejected:تم رفض طلب الدفع");
    expect(repository.events).toContain("notify-log:payment_rejected:تم رفض طلب الدفع");
  });
});
