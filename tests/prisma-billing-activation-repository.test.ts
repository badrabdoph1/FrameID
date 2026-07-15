import { describe, expect, it } from "vitest";

import { createPrismaBillingActivationRepository } from "@/modules/billing/prisma-billing-activation-repository";

describe("prisma billing activation repository", () => {
  it("creates draft payment requests, submits, approves and activates subscription state", async () => {
    const calls: string[] = [];
    const prisma = {
      paymentRequest: {
        async create(args: { data: Record<string, unknown>; select: Record<string, unknown> }) {
          calls.push(`create:${args.data.tenantId}:${args.data.method}`);
          return { id: "payment_1", status: "DRAFT" };
        },
        async update(args: { where: { id: string }; data: Record<string, unknown>; select?: Record<string, unknown> }) {
          if (args.data.status === "APPROVED" || args.data.status === "REJECTED" || args.data.status === "SUBMITTED") {
            calls.push(`${args.data.status}:${args.where.id}`);
          } else if (args.data.reference) {
            calls.push(`update:${args.where.id}:ref=${args.data.reference}`);
          } else if (args.data.proofAssetId !== undefined) {
            calls.push(`proof:${args.where.id}:${args.data.proofAssetId ?? "null"}`);
          } else if (args.data.status === "DRAFT") {
            calls.push(`reset:${args.where.id}`);
          }
          return { tenantId: "tenant_1", subscriptionId: "subscription_1", planId: null };
        },
        async findFirst(args: { where: Record<string, unknown>; select: Record<string, unknown> }) {
          return null;
        }
      },
      subscription: {
        async update(args: { where: { id: string }; data: Record<string, unknown> }) {
          calls.push(`subscription:${args.where.id}:${args.data.status}`);
          return {};
        }
      },
      tenant: {
        async update(args: { where: { id: string }; data: Record<string, unknown> }) {
          calls.push(`tenant:${args.where.id}:${args.data.status ?? "updated"}`);
          return { trialEndsAt: new Date() };
        },
        async findUnique(args: { where: { id: string }; select: Record<string, unknown> }) {
          return null;
        }
      },
      site: {
        async updateMany(args: { where: { tenantId: string }; data: Record<string, unknown> }) {
          calls.push(`sites:${args.where.tenantId}:${args.data.status}`);
          return { count: 1 };
        }
      },
      paymentRequestLog: {
        async create(args: { data: Record<string, unknown> }) {
          calls.push(`log:${args.data.paymentRequestId}:${args.data.action}`);
          return {};
        },
        async findMany(args: { where: { paymentRequestId: string } }) {
          return [];
        }
      },
      notification: {
        async create(args: { data: Record<string, unknown> }) {
          return {};
        }
      },
      notificationLog: {
        async create(args: { data: Record<string, unknown> }) {
          return {};
        }
      },
      auditLog: {
        async create(args: { data: Record<string, unknown> }) {
          calls.push(`audit:${args.data.action}:${args.data.entityId}`);
          return {};
        }
      },
      subscriptionChange: {
        async create(args: { data: Record<string, unknown> }) {
          calls.push(`change:${args.data.subscriptionId}`);
          return {};
        }
      },
      plan: {
        async findUnique(_args: { where: { id: string } }) {
          return null;
        }
      },
      featureFlag: {
        async deleteMany(_args: unknown) {
          return { count: 0 };
        }
      }
    };
    const repository = createPrismaBillingActivationRepository(prisma);

    await repository.createDraftPaymentRequest({
      tenantId: "tenant_1",
      subscriptionId: "subscription_1",
      method: "INSTAPAY",
      amount: 120000
    });

    await repository.updatePaymentRequest("payment_1", { reference: "ref-123" });

    await repository.uploadProof("payment_1", "asset_1");

    await repository.submitPaymentRequest("payment_1", new Date("2026-07-06T12:00:00.000Z"));

    await repository.approvePayment("payment_1", "admin_1", "Verified", new Date("2026-07-06T12:00:00.000Z"));

    await repository.rejectPayment("payment_2", "admin_1", "Wrong amount", new Date("2026-07-06T12:00:00.000Z"));

    await repository.requestReupload("payment_1", "admin_1", "Please upload clearer image");

    await repository.activateSubscription("tenant_1", "subscription_1", null, new Date("2026-07-06T12:00:00.000Z"));

    await repository.addLog("payment_1", "NOTE_ADDED", "admin_1", "Admin", "Internal note");

    await repository.recordAudit("admin_1", "tenant_1", "PAYMENT_APPROVED", "PaymentRequest", "payment_1");

    await repository.recordSubscriptionChange("subscription_1", null, null, "TRIAL", "ACTIVE", "activation");

    expect(calls).toEqual([
      "create:tenant_1:INSTAPAY",
      "update:payment_1:ref=ref-123",
      "proof:payment_1:asset_1",
      "SUBMITTED:payment_1",
      "APPROVED:payment_1",
      "REJECTED:payment_2",
      "proof:payment_1:null",
      "subscription:subscription_1:ACTIVE",
      "tenant:tenant_1:ACTIVE",
      "sites:tenant_1:PUBLISHED",
      "log:payment_1:NOTE_ADDED",
      "audit:PAYMENT_APPROVED:payment_1",
      "change:subscription_1"
    ]);
  });
});
