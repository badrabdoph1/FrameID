import { describe, expect, it, vi } from "vitest";

import { createCommunicationCenterCommands } from "@/modules/communication-center/commands";

function fixture() {
  const core = {
    openConversation: vi.fn(async () => ({ conversationId: "conversation-1", number: 1042, entryId: "entry-1", sequence: 1, workItemId: "work-1" })),
    appendEntry: vi.fn(async () => ({ conversationId: "conversation-1", entryId: "entry-2", sequence: 4, version: 5 })),
    markRead: vi.fn(async () => ({ conversationId: "conversation-1", reader: { type: "CUSTOMER" as const, userId: "user-1" }, lastReadSequence: 3, readAt: new Date() })),
    transitionWorkItem: vi.fn(async () => ({ id: "work-1", status: "IN_PROGRESS" as const, priority: "NORMAL" as const, queueKey: "support", assigneeAdminUserId: null, version: 2 })),
    manageWorkItem: vi.fn(async () => ({ id: "work-1", status: "IN_PROGRESS" as const, priority: "HIGH" as const, queueKey: "support", assigneeAdminUserId: null, version: 3 })),
  };
  const customerDetail = {
    id: "conversation-1",
    mode: "DIRECT" as const,
    replyMode: "ENABLED" as const,
    lastSequence: 3,
    lastCustomerVisibleSequence: 2,
    version: 4,
    workItem: { id: "work-1", status: "RESOLVED" as const },
  };
  const queries = {
    getCustomerConversation: vi.fn(async () => customerDetail),
    getAdminConversation: vi.fn(async () => customerDetail),
  };
  return { core, queries, commands: createCommunicationCenterCommands({ core, queries }) };
}

describe("communication center commands", () => {
  it("creates a product-neutral customer request with a work item and site context", async () => {
    const { commands, core } = fixture();

    await commands.createCustomerRequest({
      tenantId: "tenant-1",
      userId: "user-1",
      siteId: "site-1",
      typeKey: "support.problem",
      subject: "تعذر نشر الموقع",
      body: "تظهر رسالة خطأ عند النشر",
      attachments: [],
      idempotencyKey: "request-1",
    });

    expect(core.openConversation).toHaveBeenCalledWith(expect.objectContaining({
      mode: "DIRECT",
      tenantId: "tenant-1",
      actor: { type: "CUSTOMER", userId: "user-1" },
      workItem: { queueKey: "support", priority: "NORMAL", slaPolicyKey: "support-standard-v1" },
      contexts: [{ namespace: "sites", entityType: "site", entityId: "site-1", relationKey: "related" }],
    }));
  });

  it("uses tenant-scoped detail before appending a customer reply", async () => {
    const { commands, core, queries } = fixture();

    await commands.replyAsCustomer({
      conversationId: "conversation-1",
      tenantId: "tenant-1",
      userId: "user-1",
      body: "جربت مرة أخرى",
      attachments: [],
      idempotencyKey: "reply-1",
    });

    expect(queries.getCustomerConversation).toHaveBeenCalledWith({
      conversationId: "conversation-1",
      tenantId: "tenant-1",
      userId: "user-1",
    });
    expect(core.appendEntry).toHaveBeenCalledWith(expect.objectContaining({
      expectedLastSequence: 3,
      expectedVersion: 4,
      actor: { type: "CUSTOMER", userId: "user-1" },
    }));
  });

  it("rejects customer replies outside their audience and to broadcasts", async () => {
    const { commands, core, queries } = fixture();
    queries.getCustomerConversation.mockResolvedValueOnce(null as never);

    await expect(commands.replyAsCustomer({
      conversationId: "other",
      tenantId: "tenant-1",
      userId: "user-1",
      body: "رد",
      attachments: [],
      idempotencyKey: "reply-1",
    })).rejects.toThrow("غير موجودة");

    queries.getCustomerConversation.mockResolvedValueOnce({ mode: "BROADCAST", replyMode: "DISABLED" } as never);
    await expect(commands.replyAsCustomer({
      conversationId: "broadcast-1",
      tenantId: "tenant-1",
      userId: "user-1",
      body: "رد",
      attachments: [],
      idempotencyKey: "reply-2",
    })).rejects.toThrow("غير متاح");
    expect(core.appendEntry).not.toHaveBeenCalled();
  });

  it("writes admin notes as admin-only timeline entries", async () => {
    const { commands, core } = fixture();

    await commands.replyAsAdmin({
      conversationId: "conversation-1",
      adminUserId: "admin-1",
      body: "راجعنا سجل الدفع",
      internal: true,
      attachments: [],
      idempotencyKey: "note-1",
    });

    expect(core.appendEntry).toHaveBeenCalledWith(expect.objectContaining({
      actor: { type: "ADMIN", adminUserId: "admin-1" },
      kind: "INTERNAL_NOTE",
      visibility: "ADMIN_ONLY",
    }));
  });

  it("routes admin priority changes through the core management command", async () => {
    const { commands, core } = fixture();

    await commands.manageAsAdmin({
      conversationId: "conversation-1",
      adminUserId: "admin-1",
      change: { type: "PRIORITY", priority: "HIGH" },
      idempotencyKey: "priority-1",
    });

    expect(core.manageWorkItem).toHaveBeenCalledWith({
      workItemId: "work-1",
      actor: { type: "ADMIN", adminUserId: "admin-1" },
      change: { type: "PRIORITY", priority: "HIGH" },
      idempotencyKey: "priority-1",
      reason: null,
    });
  });

  it("lets the owning customer close or reopen only a resolved request", async () => {
    const { commands, core } = fixture();

    await commands.resolveAsCustomer({
      conversationId: "conversation-1",
      tenantId: "tenant-1",
      userId: "user-1",
      resolved: true,
      idempotencyKey: "customer-close-1",
    });

    expect(core.transitionWorkItem).toHaveBeenCalledWith(expect.objectContaining({
      workItemId: "work-1",
      actor: { type: "CUSTOMER", userId: "user-1" },
      toStatus: "CLOSED",
    }));
  });
});
