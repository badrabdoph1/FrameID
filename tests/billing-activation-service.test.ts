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
    async getCustomerActivePaymentRequest() {
      return null;
    },
    async approvePayment(paymentRequestId, reviewerId) {
      events.push(`approve:${paymentRequestId}:${reviewerId}`);
      return { tenantId: "tenant_1", subscriptionId: "subscription_1", planId: "plan_1" };
    },
    async rejectPayment(paymentRequestId, reviewerId, reason) {
      events.push(`reject:${paymentRequestId}:${reviewerId}:${reason}`);
      return { tenantId: "tenant_1" };
    },
    async requestReupload(paymentRequestId, reviewerId, note) {
      events.push(`reupload:${paymentRequestId}:${reviewerId}:${note}`);
    },
    async activateSubscription(tenantId, subscriptionId) {
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
        currency: "EGP",
        planId: "plan_1",
        paymentAccountId: "account_1",
        reference: null,
        proofAssetId: "asset_1",
        submittedAt: null,
        adminNote: null,
        rejectionReason: null,
        tenant: { id: "tenant_1", status: "TRIAL" },
        subscription: { id: "subscription_1", status: "TRIAL", planId: null },
        plan: { id: "plan_1", name: "Pro" },
        paymentAccount: { id: "account_1", accountName: "Instapay" },
        proofAsset: { id: "asset_1", url: "https://example.com/proof.jpg" }
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
    async getLogs() {
      return [];
    },
    async createNotification(tenantId, type, title) {
      events.push(`notify:${tenantId}:${type}:${title}`);
    },
    async createNotificationLog(type, title) {
      events.push(`notify-log:${type}:${title}`);
    },
    async recordAudit(actorUserId, tenantId, action, entityType, entityId) {
      events.push(`audit:${action}:${entityId}`);
    },
    async recordSubscriptionChange(subscriptionId, fromPlanId, toPlanId, fromStatus, toStatus) {
      events.push(`change:${subscriptionId}:${fromStatus}->${toStatus}`);
    },
    async getPlan(planId) {
      events.push(`get-plan:${planId}`);
      return { id: planId, billingInterval: "MONTHLY", priceAmount: 120000 };
    },
    async getTrialInfo() {
      return null;
    },
    daysRemaining() {
      return 7;
    }
  };
}

describe("billing activation service", () => {
  it("creates a draft payment request for activation", async () => {
    const repository = createRepository();
    const service = createBillingActivationService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    await expect(
      service.createDraftPayment({
        tenantId: "tenant_1",
        subscriptionId: "subscription_1",
        method: "INSTAPAY",
        paymentAccountId: "account_1",
        amount: 120000,
        currency: "EGP",
        reference: "ali-payment"
      })
    ).resolves.toEqual({
      id: "payment_1",
      status: "DRAFT"
    });

    expect(repository.events).toContain("draft:tenant_1:INSTAPAY:120000");
    expect(repository.events).toContain("audit:PAYMENT_DRAFT_CREATED:payment_1");
    expect(repository.events).toContain("log:payment_1:DRAFT_CREATED:تم إنشاء مسودة طلب الدفع");
  });

  it("approves payment and activates the tenant subscription", async () => {
    const repository = createRepository();
    repository.setPaymentStatus("UNDER_REVIEW");
    const service = createBillingActivationService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    await service.approvePayment({
      paymentRequestId: "payment_1",
      reviewerId: "admin_1",
      adminNote: "Verified"
    });

    expect(repository.events).toContain("approve:payment_1:admin_1");
    expect(repository.events).toContain("activate:tenant_1:subscription_1");
    expect(repository.events).toContain("log:payment_1:APPROVED:Verified");
    expect(repository.events).toContain("audit:PAYMENT_APPROVED:payment_1");
    expect(repository.events).toContain("audit:SUBSCRIPTION_ACTIVATED:subscription_1");
    expect(repository.events).toContain("change:subscription_1:TRIAL->ACTIVE");
    expect(repository.events).toContain("notify:tenant_1:payment_approved:تم قبول طلب الدفع");
    expect(repository.events).toContain("notify-log:payment_approved:تم قبول طلب الدفع");
  });

  it("rejects a payment request with a review audit trail", async () => {
    const repository = createRepository();
    repository.setPaymentStatus("UNDER_REVIEW");
    const service = createBillingActivationService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    await service.rejectPayment({
      paymentRequestId: "payment_1",
      reviewerId: "admin_1",
      reason: "Reference mismatch"
    });

    expect(repository.events).toContain("reject:payment_1:admin_1:Reference mismatch");
    expect(repository.events).toContain("log:payment_1:REJECTED:Reference mismatch");
    expect(repository.events).toContain("audit:PAYMENT_REJECTED:payment_1");
    expect(repository.events).toContain("notify:tenant_1:payment_rejected:تم رفض طلب الدفع");
    expect(repository.events).toContain("notify-log:payment_rejected:تم رفض طلب الدفع");
  });
});
