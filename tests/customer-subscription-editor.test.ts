import { describe, expect, it, vi } from "vitest";

import {
  createCustomerSubscriptionEditor,
  type CustomerSubscriptionEditCommand,
  type CustomerSubscriptionEditorRepository,
} from "@/modules/admin/customers/customer-subscription-editor";

const now = new Date("2026-07-17T12:00:00.000Z");

function makeRepository(overrides: Partial<CustomerSubscriptionEditorRepository> = {}) {
  let saved: CustomerSubscriptionEditCommand | null = null;
  const repository: CustomerSubscriptionEditorRepository = {
    async listActivePlans() {
      return [];
    },
    async getPlan(planId) {
      return {
        id: planId,
        code: "pro",
        name: "الاحترافية",
        priceAmount: 1_200,
        currency: "EGP",
        billingInterval: "month",
        isActive: true,
      };
    },
    async getSubscription() {
      return null;
    },
    async applyEdit(command) {
      saved = command;
      return { subscriptionId: command.subscriptionId ?? "subscription-new", paymentId: command.payment?.id ?? null };
    },
    ...overrides,
  };

  return { repository, getSaved: () => saved };
}

describe("customer subscription editor", () => {
  it("creates an active paid subscription using the selected plan price", async () => {
    const { repository, getSaved } = makeRepository();
    const editor = createCustomerSubscriptionEditor({ repository, now: () => now, createId: () => "payment-manual" });

    const result = await editor.edit({
      tenantId: "tenant-1",
      planId: "plan-pro",
      status: "ACTIVE",
      durationMode: "30",
      recordPayment: true,
      paymentMethod: "INSTAPAY",
      paymentReference: "manual-42",
      actor: { id: "admin-1", name: "مدير النظام" },
    });

    expect(result).toEqual({ subscriptionId: "subscription-new", paymentId: "payment-manual" });
    expect(getSaved()).toMatchObject({
      tenantId: "tenant-1",
      planId: "plan-pro",
      status: "ACTIVE",
      periodStart: now,
      periodEnd: new Date("2026-08-16T12:00:00.000Z"),
      expiresAt: new Date("2026-08-16T12:00:00.000Z"),
      actor: { id: "admin-1", name: "مدير النظام" },
      payment: {
        id: "payment-manual",
        amount: 1_200,
        currency: "EGP",
        method: "INSTAPAY",
        reference: "manual-42",
      },
    });
  });

  it("subtracts days from the current end and expires an active subscription that reaches the past", async () => {
    const { repository, getSaved } = makeRepository({
      async getSubscription() {
        return {
          id: "subscription-1",
          tenantId: "tenant-1",
          planId: "plan-old",
          status: "ACTIVE",
          currentPeriodStart: new Date("2026-06-01T12:00:00.000Z"),
          currentPeriodEnd: new Date("2026-07-27T12:00:00.000Z"),
        };
      },
    });
    const editor = createCustomerSubscriptionEditor({ repository, now: () => now });

    await editor.edit({
      tenantId: "tenant-1",
      subscriptionId: "subscription-1",
      planId: "plan-pro",
      status: "ACTIVE",
      durationMode: "adjust",
      adjustmentDays: -15,
      recordPayment: false,
      actor: { id: "admin-1", name: "مدير النظام" },
    });

    expect(getSaved()).toMatchObject({
      subscriptionId: "subscription-1",
      status: "EXPIRED",
      periodStart: new Date("2026-06-01T12:00:00.000Z"),
      periodEnd: new Date("2026-07-12T12:00:00.000Z"),
      payment: null,
    });
  });

  it("supports a permanent subscription without an expiry timer", async () => {
    const { repository, getSaved } = makeRepository();
    const editor = createCustomerSubscriptionEditor({ repository, now: () => now });

    await editor.edit({
      tenantId: "tenant-1",
      planId: "plan-pro",
      status: "ACTIVE",
      durationMode: "forever",
      recordPayment: false,
      actor: { id: "admin-1", name: "مدير النظام" },
    });

    expect(getSaved()).toMatchObject({
      periodEnd: new Date("2099-12-31T23:59:59.999Z"),
      expiresAt: null,
    });
  });

  it("rejects recording a payment for a non-active subscription", async () => {
    const { repository } = makeRepository();
    const applySpy = vi.spyOn(repository, "applyEdit");
    const editor = createCustomerSubscriptionEditor({ repository, now: () => now });

    await expect(editor.edit({
      tenantId: "tenant-1",
      planId: "plan-pro",
      status: "SUSPENDED",
      durationMode: "30",
      recordPayment: true,
      paymentMethod: "INSTAPAY",
      actor: { id: "admin-1", name: "مدير النظام" },
    })).rejects.toThrow("تسجيل الدفعة متاح للاشتراك النشط فقط");
    expect(applySpy).not.toHaveBeenCalled();
  });

  it("rejects an invalid custom end date", async () => {
    const { repository } = makeRepository();
    const editor = createCustomerSubscriptionEditor({ repository, now: () => now });

    await expect(editor.edit({
      tenantId: "tenant-1",
      planId: "plan-pro",
      status: "ACTIVE",
      durationMode: "custom-date",
      customEndDate: "2026-07-01",
      recordPayment: false,
      actor: { id: "admin-1", name: "مدير النظام" },
    })).rejects.toThrow("تاريخ انتهاء الاشتراك النشط يجب أن يكون في المستقبل");
  });
});
