import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { createPrismaCommunicationCenterQueries } from "@/modules/communication-center/prisma-queries";

const NOW = new Date("2026-07-18T12:00:00.000Z");

describe("prisma communication center queries", () => {
  it("maps a tenant-scoped customer inbox and derives unread from the read cursor", async () => {
    let args: Record<string, unknown> | null = null;
    const prisma = {
      communicationConversation: {
        findMany: async (input: Record<string, unknown>) => {
          args = input;
          return [{
            id: "conversation-1",
            number: 1042,
            mode: "DIRECT",
            typeKey: "support.problem",
            subject: "تعذر النشر",
            replyMode: "ENABLED",
            lastActivityAt: NOW,
            lastCustomerVisibleSequence: 3,
            audiences: [{ lastCustomerVisibleSequence: 3 }],
            readCursors: [{ lastReadSequence: 1 }],
            workItem: { status: "IN_PROGRESS", priority: "HIGH" },
            entries: [{ body: "نراجع المشكلة الآن", kind: "MESSAGE", authorType: "ADMIN", createdAt: NOW }],
          }];
        },
      },
    };
    const queries = createPrismaCommunicationCenterQueries(prisma as unknown as PrismaClient);

    const result = await queries.listCustomerInbox({ tenantId: "tenant-1", userId: "user-1", limit: 20 });

    expect(result.items[0]).toMatchObject({ number: 1042, unread: true, unreadCount: 1, status: "IN_PROGRESS" });
    expect(args).toMatchObject({
      where: {
        lifecycleState: "ACTIVE",
        audiences: { some: { tenantId: "tenant-1", deliveredAt: { not: null }, archivedAt: null, withdrawnAt: null } },
      },
      take: 21,
    });
    expect(JSON.stringify(args)).toContain("CUSTOMER_AND_ADMIN");
  });

  it("returns null when customer detail is outside the tenant audience", async () => {
    let args: Record<string, unknown> | null = null;
    const prisma = {
      communicationConversation: {
        findFirst: async (input: Record<string, unknown>) => { args = input; return null; },
      },
    };
    const queries = createPrismaCommunicationCenterQueries(prisma as unknown as PrismaClient);

    await expect(queries.getCustomerConversation({
      conversationId: "conversation-1",
      tenantId: "tenant-2",
      userId: "user-2",
    })).resolves.toBeNull();
    expect(args).toMatchObject({
      where: {
        id: "conversation-1",
        audiences: { some: { tenantId: "tenant-2", deliveredAt: { not: null }, archivedAt: null, withdrawnAt: null } },
      },
    });
    expect(JSON.stringify(args)).toContain("CUSTOMER_AND_ADMIN");
  });

  it("counts unread conversations without loading message bodies", async () => {
    let args: Record<string, unknown> | null = null;
    const prisma = {
      communicationAudience: {
        findMany: async (input: Record<string, unknown>) => {
          args = input;
          return [
            { lastCustomerVisibleSequence: 4, conversation: { readCursors: [{ lastReadSequence: 4 }] } },
            { lastCustomerVisibleSequence: 3, conversation: { readCursors: [] } },
          ];
        },
      },
    };
    const queries = createPrismaCommunicationCenterQueries(prisma as unknown as PrismaClient);

    await expect(queries.getCustomerUnreadCount("tenant-1", "user-1")).resolves.toBe(1);
    expect(JSON.stringify(args)).not.toContain("body");
  });

  it("applies admin operational filters before loading rows", async () => {
    let args: Record<string, unknown> | null = null;
    const prisma = {
      communicationConversation: {
        findMany: async (input: Record<string, unknown>) => { args = input; return []; },
        count: async () => 0,
      },
    };
    const queries = createPrismaCommunicationCenterQueries(prisma as unknown as PrismaClient);

    await queries.listAdminInbox({ search: "1042", status: "NEW", priority: "URGENT", limit: 30 });

    expect(args).toMatchObject({
      where: { mode: "DIRECT", number: 1042, workItem: { status: "NEW", priority: "URGENT" } },
      take: 31,
    });
  });
});
