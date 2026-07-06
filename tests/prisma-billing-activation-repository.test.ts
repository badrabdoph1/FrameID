import { describe, expect, it } from "vitest";

import { createPrismaBillingActivationRepository } from "@/modules/billing/prisma-billing-activation-repository";

describe("prisma billing activation repository", () => {
  it("creates payment requests, approves them and activates subscription state", async () => {
    const calls: string[] = [];
    const prisma = {
      paymentRequest: {
        async create(args: {
          data: { tenantId: string; method: string; proofAssetId?: string };
        }) {
          calls.push(
            `payment:${args.data.tenantId}:${args.data.method}:${args.data.proofAssetId ?? "no-proof"}`
          );
          return { id: "payment_1", status: "PENDING" as const };
        },
        async update(args: {
          where: { id: string };
          data: { status: "APPROVED" | "REJECTED"; reviewedById: string };
          select: { tenantId: true; subscriptionId: true };
        }) {
          calls.push(`${args.data.status}:${args.where.id}:${args.data.reviewedById}`);
          return {
            tenantId: "tenant_1",
            subscriptionId: "subscription_1"
          };
        }
      },
      subscription: {
        async update(args: { where: { id: string }; data: { status: "ACTIVE" } }) {
          calls.push(`subscription:${args.where.id}:${args.data.status}`);
          return {};
        }
      },
      tenant: {
        async update(args: { where: { id: string }; data: { status: "ACTIVE" } }) {
          calls.push(`tenant:${args.where.id}:${args.data.status}`);
          return {};
        }
      },
      site: {
        async updateMany(args: { where: { tenantId: string }; data: { status: "PUBLISHED" } }) {
          calls.push(`sites:${args.where.tenantId}:${args.data.status}`);
          return { count: 1 };
        }
      },
      auditLog: {
        async create(args: { data: { action: string; entityId: string } }) {
          calls.push(`audit:${args.data.action}:${args.data.entityId}`);
          return {};
        }
      }
    };
    const repository = createPrismaBillingActivationRepository(prisma);

    await repository.createPaymentRequest({
      tenantId: "tenant_1",
      subscriptionId: "subscription_1",
      method: "INSTAPAY",
      amount: 120000,
      currency: "EGP",
      proofAssetId: "asset_1"
    });
    await repository.approvePayment({
      paymentRequestId: "payment_1",
      reviewerId: "admin_1",
      reviewedAt: new Date("2026-07-06T12:00:00.000Z")
    });
    await repository.rejectPayment({
      paymentRequestId: "payment_1",
      reviewerId: "admin_1",
      adminNote: "Mismatch",
      reviewedAt: new Date("2026-07-06T12:00:00.000Z")
    });
    await repository.activateSubscription({
      tenantId: "tenant_1",
      subscriptionId: "subscription_1",
      activatedAt: new Date("2026-07-06T12:00:00.000Z")
    });
    await repository.recordAudit({
      action: "PAYMENT_APPROVED",
      entityType: "PaymentRequest",
      entityId: "payment_1"
    });

    expect(calls).toEqual([
      "payment:tenant_1:INSTAPAY:asset_1",
      "APPROVED:payment_1:admin_1",
      "REJECTED:payment_1:admin_1",
      "subscription:subscription_1:ACTIVE",
      "tenant:tenant_1:ACTIVE",
      "sites:tenant_1:PUBLISHED",
      "audit:PAYMENT_APPROVED:payment_1"
    ]);
  });
});
