import { describe, expect, it, vi } from "vitest";

import { createCommunicationLegacyBridge } from "@/modules/communication-center/legacy-bridge";

describe("communication legacy bridge", () => {
  it("turns a legacy notification into one idempotent system conversation", async () => {
    const core = { openConversation: vi.fn(async () => ({ conversationId: "conversation-1" })) };
    const bridge = createCommunicationLegacyBridge(core as never);

    await bridge.publishNotification({
      sourceModule: "billing",
      sourceId: "payment-1:approved",
      tenantId: "tenant-1",
      type: "payment_approved",
      title: "تم قبول الدفع",
      body: "تم تفعيل اشتراكك.",
      context: { namespace: "billing", entityType: "payment_request", entityId: "payment-1", relationKey: "source" },
    });

    expect(core.openConversation).toHaveBeenCalledWith(expect.objectContaining({
      sourceModule: "billing",
      idempotencyKey: "legacy-notification:payment-1:approved",
      tenantId: "tenant-1",
      typeKey: "notification.payment_approved",
      replyMode: "DISABLED",
      actor: { type: "SYSTEM", systemKey: "billing" },
      contexts: [{ namespace: "billing", entityType: "payment_request", entityId: "payment-1", relationKey: "source" }],
    }));
  });

  it("backfills a customer request as an actionable work item with opaque contexts", async () => {
    const core = { openConversation: vi.fn(async () => ({ conversationId: "conversation-1" })) };
    const bridge = createCommunicationLegacyBridge(core as never);

    await bridge.publishCustomerRequest({
      requestId: "request-1",
      tenantId: "tenant-1",
      siteId: "site-1",
      type: "ACCOUNT_DELETION",
      title: "طلب حذف الحساب",
      description: "أريد حذف حسابي",
    });

    expect(core.openConversation).toHaveBeenCalledWith(expect.objectContaining({
      idempotencyKey: "legacy-customer-request:request-1",
      typeKey: "account.deletion",
      workItem: { queueKey: "account", priority: "HIGH", slaPolicyKey: "account-request-v1" },
      contexts: expect.arrayContaining([
        { namespace: "customers", entityType: "customer_request", entityId: "request-1", relationKey: "source" },
        { namespace: "sites", entityType: "site", entityId: "site-1", relationKey: "related" },
      ]),
    }));
  });

  it("maps a legacy outreach campaign to one idempotent broadcast conversation", async () => {
    const core = {
      openConversation: vi.fn(),
      publishCampaign: vi.fn(async () => ({ conversationId: "conversation-2", campaignId: "core-campaign-1", recipientCount: 2 })),
    };
    const bridge = createCommunicationLegacyBridge(core as never);

    await bridge.publishCampaign({
      campaignId: "legacy-campaign-1",
      tenantIds: ["tenant-1", "tenant-2"],
      title: "ميزة جديدة",
      body: "جرّب الميزة الجديدة.",
      tone: "success",
      audienceMode: "EXPLICIT",
      filters: {},
      actor: { id: "admin-1", name: "المدير", email: "admin@example.com" },
    });

    expect(core.publishCampaign).toHaveBeenCalledWith(expect.objectContaining({
      sourceModule: "legacy-messages",
      idempotencyKey: "legacy-campaign:legacy-campaign-1",
      typeKey: "announcement.feature",
      tenantIds: ["tenant-1", "tenant-2"],
      actor: { type: "ADMIN", adminUserId: "admin-1" },
      audienceDefinitionVersion: 1,
    }));
  });
});
