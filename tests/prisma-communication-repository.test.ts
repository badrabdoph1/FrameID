import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  CommunicationConflictError,
  createPrismaCommunicationRepository,
} from "@/modules/communication-core/prisma-communication-repository";
import type {
  AppendEntryCommand,
  MarkReadCommand,
  ManageWorkItemCommand,
  OpenConversationCommand,
  PublishCampaignCommand,
  TransitionWorkItemCommand,
} from "@/modules/communication-core/repository";

const NOW = new Date("2026-07-18T12:00:00.000Z");
const ADMIN = { type: "ADMIN", adminUserId: "admin-1" } as const;

function openCommand(): OpenConversationCommand {
  return {
    sourceModule: "services",
    idempotencyKey: "acquisition:42",
    mode: "DIRECT",
    tenantId: "tenant-1",
    parentConversationId: null,
    typeKey: "service.request",
    subject: "طلب خدمة",
    replyMode: "ENABLED",
    actor: { type: "CUSTOMER", userId: "user-1" },
    firstEntry: {
      actor: { type: "CUSTOMER", userId: "user-1" },
      kind: "MESSAGE",
      visibility: "CUSTOMER_AND_ADMIN",
      body: "أريد هذه الخدمة",
      eventName: null,
      metadata: null,
      correctionOfEntryId: null,
      idempotencyKey: "first-entry",
      attachments: [{
        storageProvider: "private-local",
        storageKey: "communications/upload.png",
        originalName: "screen.png",
        mimeType: "image/png",
        sizeBytes: 1024,
        checksumSha256: "a".repeat(64),
        width: 1200,
        height: 800,
      }],
    },
    workItem: {
      queueKey: "product",
      priority: "NORMAL",
      assigneeAdminUserId: null,
      slaPolicyKey: null,
      firstResponseDueAt: null,
      resolutionDueAt: null,
    },
    contexts: [{ namespace: "services", entityType: "acquisition", entityId: "acq-42", relationKey: "primary" }],
    correlationId: "corr-1",
    causationId: null,
    occurredAt: NOW,
  };
}

describe("prisma communication repository", () => {
  it("opens the complete direct communication aggregate and outbox atomically", async () => {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const tx = {
      communicationConversation: {
        findUnique: async () => null,
        create: async (args: Record<string, unknown>) => { calls.push({ name: "conversation", args }); return { id: "conversation-1", number: 101 }; },
      },
      communicationEntry: {
        create: async (args: Record<string, unknown>) => { calls.push({ name: "entry", args }); return { id: "entry-1" }; },
      },
      communicationAudience: {
        create: async (args: Record<string, unknown>) => { calls.push({ name: "audience", args }); return { id: "audience-1" }; },
      },
      communicationReadCursor: {
        upsert: async (args: Record<string, unknown>) => { calls.push({ name: "creator-cursor", args }); return { id: "cursor-1" }; },
      },
      communicationWorkItem: {
        create: async (args: Record<string, unknown>) => { calls.push({ name: "work-item", args }); return { id: "work-1" }; },
      },
      communicationWorkItemEvent: {
        create: async (args: Record<string, unknown>) => { calls.push({ name: "work-event", args }); return { id: "work-event-1" }; },
      },
      communicationContextReference: {
        createMany: async (args: Record<string, unknown>) => { calls.push({ name: "contexts", args }); return { count: 1 }; },
      },
      communicationAttachment: {
        createMany: async (args: Record<string, unknown>) => { calls.push({ name: "attachments", args }); return { count: 1 }; },
      },
      communicationOutboxEvent: {
        create: async (args: Record<string, unknown>) => { calls.push({ name: "outbox", args }); return { id: "event-1" }; },
      },
    };
    const prisma = {
      async $transaction<T>(work: (client: typeof tx) => Promise<T>) {
        calls.push({ name: "transaction-start", args: {} });
        const result = await work(tx);
        calls.push({ name: "transaction-end", args: {} });
        return result;
      },
    };
    const repository = createPrismaCommunicationRepository(prisma as unknown as PrismaClient);

    const result = await repository.openConversation(openCommand());

    expect(result).toEqual({ conversationId: "conversation-1", number: 101, entryId: "entry-1", sequence: 1, workItemId: "work-1" });
    expect(calls.map((call) => call.name)).toEqual([
      "transaction-start",
      "conversation",
      "entry",
      "audience",
      "creator-cursor",
      "work-item",
      "work-event",
      "contexts",
      "attachments",
      "outbox",
      "transaction-end",
    ]);
    const outboxData = (calls.find((call) => call.name === "outbox")?.args.data ?? {}) as Record<string, unknown>;
    expect(outboxData).not.toHaveProperty("body");
    expect(outboxData).toMatchObject({ eventName: "communication.conversation.opened.v1", correlationId: "corr-1" });
    expect(calls.find((call) => call.name === "creator-cursor")?.args).toMatchObject({
      update: { lastReadSequence: 1 },
      create: { readerType: "CUSTOMER", userId: "user-1", lastReadSequence: 1 },
    });
  });

  it("allocates an entry sequence with a guarded increment instead of max(sequence)", async () => {
    let updateArgs: Record<string, unknown> | null = null;
    const calls: Array<Record<string, unknown>> = [];
    const tx = {
      communicationEntry: {
        findUnique: async () => null,
        create: async () => ({ id: "entry-2" }),
      },
      communicationConversation: {
        updateMany: async (args: Record<string, unknown>) => { updateArgs = args; return { count: 1 }; },
        findUnique: async () => ({ id: "conversation-1", version: 4, lastSequence: 2 }),
      },
      communicationWorkItem: { findUnique: async () => null },
      communicationAudience: { updateMany: async () => ({ count: 1 }) },
      communicationReadCursor: { upsert: async (args: Record<string, unknown>) => { calls.push(args); return { id: "cursor-2" }; } },
      communicationAttachment: { createMany: async () => ({ count: 0 }) },
      communicationOutboxEvent: { create: async () => ({ id: "event-2" }) },
    };
    const prisma = { $transaction: async <T>(work: (client: typeof tx) => Promise<T>) => work(tx) };
    const repository = createPrismaCommunicationRepository(prisma as unknown as PrismaClient);
    const command: AppendEntryCommand = {
      conversationId: "conversation-1",
      actor: ADMIN,
      kind: "MESSAGE",
      visibility: "CUSTOMER_AND_ADMIN",
      body: "تمت المراجعة",
      eventName: null,
      metadata: null,
      correctionOfEntryId: null,
      idempotencyKey: "reply-1",
      attachments: [],
      expectedLastSequence: 1,
      expectedVersion: 3,
      correlationId: "corr-1",
      causationId: null,
      occurredAt: NOW,
    };

    const result = await repository.appendEntry(command);

    expect(result).toMatchObject({ entryId: "entry-2", sequence: 2, version: 4 });
    expect(updateArgs).toMatchObject({
      where: { id: "conversation-1", lastSequence: 1, version: 3 },
      data: { lastSequence: { increment: 1 }, version: { increment: 1 } },
    });
    expect(JSON.stringify(updateArgs)).not.toContain("max");
    expect(calls).toContainEqual(expect.objectContaining({
      update: { lastReadSequence: 2, readAt: NOW },
      create: expect.objectContaining({ readerType: "ADMIN", adminUserId: "admin-1", lastReadSequence: 2 }),
    }));
  });

  it("throws a stable conflict when the guarded conversation update loses the race", async () => {
    const tx = {
      communicationEntry: { findUnique: async () => null },
      communicationConversation: { updateMany: async () => ({ count: 0 }) },
    };
    const prisma = { $transaction: async <T>(work: (client: typeof tx) => Promise<T>) => work(tx) };
    const repository = createPrismaCommunicationRepository(prisma as unknown as PrismaClient);
    const command = {
      conversationId: "conversation-1",
      actor: ADMIN,
      kind: "MESSAGE",
      visibility: "CUSTOMER_AND_ADMIN",
      body: "رد قديم",
      eventName: null,
      metadata: null,
      correctionOfEntryId: null,
      idempotencyKey: "reply-old",
      attachments: [],
      expectedLastSequence: 1,
      expectedVersion: 1,
      correlationId: null,
      causationId: null,
      occurredAt: NOW,
    } satisfies AppendEntryCommand;

    await expect(repository.appendEntry(command)).rejects.toBeInstanceOf(CommunicationConflictError);
  });

  it("retries a first-read unique race and returns the monotonic cursor", async () => {
    let cursorLookup = 0;
    let transactionCount = 0;
    const tx = {
      communicationConversation: { findUnique: async () => ({ lastSequence: 7 }) },
      communicationReadCursor: {
        findUnique: async () => {
          cursorLookup += 1;
          return cursorLookup === 1
            ? null
            : { id: "cursor-1", lastReadSequence: 6, readAt: NOW };
        },
        create: async () => { throw { code: "P2002" }; },
      },
    };
    const prisma = {
      async $transaction<T>(work: (client: typeof tx) => Promise<T>) {
        transactionCount += 1;
        return work(tx);
      },
    };
    const repository = createPrismaCommunicationRepository(prisma as unknown as PrismaClient);
    const command: MarkReadCommand = {
      conversationId: "conversation-1",
      reader: { type: "CUSTOMER", userId: "user-1" },
      upToSequence: 4,
      occurredAt: NOW,
    };

    const result = await repository.markRead(command);

    expect(transactionCount).toBe(2);
    expect(result).toMatchObject({ lastReadSequence: 6, readAt: NOW });
  });

  it("stores a guarded work transition, its timeline fact, and its outbox event together", async () => {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const tx = {
      communicationWorkItemEvent: {
        findUnique: async () => null,
        create: async (args: Record<string, unknown>) => { calls.push({ name: "work-event", args }); return { id: "work-event-1" }; },
      },
      communicationWorkItem: {
        findUnique: async () => ({ id: "work-1", conversationId: "conversation-1", status: "NEW", version: 2 }),
        updateMany: async (args: Record<string, unknown>) => { calls.push({ name: "work-update", args }); return { count: 1 }; },
      },
      communicationConversation: {
        update: async (args: Record<string, unknown>) => {
          const data = args.data as Record<string, unknown>;
          calls.push({ name: "lastCustomerVisibleSequence" in data ? "visible-sequence" : "sequence", args });
          return { lastSequence: 5, version: 8 };
        },
      },
      communicationEntry: {
        create: async (args: Record<string, unknown>) => { calls.push({ name: "entry", args }); return { id: "entry-5" }; },
      },
      communicationAudience: { updateMany: async () => ({ count: 1 }) },
      communicationOutboxEvent: {
        create: async (args: Record<string, unknown>) => { calls.push({ name: "outbox", args }); return { id: "outbox-1" }; },
      },
    };
    const prisma = { $transaction: async <T>(work: (client: typeof tx) => Promise<T>) => work(tx) };
    const repository = createPrismaCommunicationRepository(prisma as unknown as PrismaClient);
    const command: TransitionWorkItemCommand = {
      workItemId: "work-1",
      actor: ADMIN,
      fromStatus: "NEW",
      toStatus: "IN_PROGRESS",
      expectedVersion: 2,
      reason: "بدء المراجعة",
      idempotencyKey: "review-1",
      correlationId: "corr-1",
      causationId: null,
      occurredAt: NOW,
    };

    const result = await repository.transitionWorkItem(command);

    expect(result).toEqual({ id: "work-1", status: "IN_PROGRESS", version: 3 });
    expect(calls.map((call) => call.name)).toEqual(["sequence", "visible-sequence", "work-update", "entry", "work-event", "outbox"]);
    expect(calls.find((call) => call.name === "visible-sequence")?.args).toMatchObject({
      data: { lastCustomerVisibleSequence: 5 },
    });
    const eventWhere = calls.find((call) => call.name === "work-event")?.args.data as Record<string, unknown>;
    expect(eventWhere).toMatchObject({ idempotencyKey: "review-1", fromStatus: "NEW", toStatus: "IN_PROGRESS" });
  });

  it("updates assignment atomically with an internal timeline fact and outbox event", async () => {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const tx = {
      communicationWorkItemEvent: {
        findUnique: async () => null,
        create: async (args: Record<string, unknown>) => { calls.push({ name: "work-event", args }); return { id: "event-1" }; },
      },
      communicationWorkItem: {
        findUnique: async () => ({ id: "work-1", conversationId: "conversation-1", status: "IN_PROGRESS", priority: "NORMAL", queueKey: "support", assigneeAdminUserId: null, version: 3 }),
        updateMany: async (args: Record<string, unknown>) => { calls.push({ name: "work-update", args }); return { count: 1 }; },
        findUniqueOrThrow: async () => ({ id: "work-1", status: "IN_PROGRESS", priority: "NORMAL", queueKey: "support", assigneeAdminUserId: "admin-2", version: 4 }),
      },
      communicationConversation: {
        update: async () => ({ lastSequence: 6, version: 7 }),
      },
      communicationEntry: {
        create: async (args: Record<string, unknown>) => { calls.push({ name: "entry", args }); return { id: "entry-6" }; },
      },
      communicationOutboxEvent: {
        create: async (args: Record<string, unknown>) => { calls.push({ name: "outbox", args }); return { id: "outbox-1" }; },
      },
    };
    const prisma = { $transaction: async <T>(work: (client: typeof tx) => Promise<T>) => work(tx) };
    const repository = createPrismaCommunicationRepository(prisma as unknown as PrismaClient);
    const command: ManageWorkItemCommand = {
      workItemId: "work-1",
      actor: ADMIN,
      expectedVersion: 3,
      change: { type: "ASSIGNEE", fromAssigneeAdminUserId: null, toAssigneeAdminUserId: "admin-2" },
      reason: null,
      idempotencyKey: "assign-1",
      correlationId: null,
      causationId: null,
      occurredAt: NOW,
    };

    const result = await repository.manageWorkItem(command);

    expect(result).toMatchObject({ assigneeAdminUserId: "admin-2", version: 4 });
    expect(calls.map((call) => call.name)).toEqual(["work-update", "entry", "work-event", "outbox"]);
    expect(calls.find((call) => call.name === "entry")?.args).toMatchObject({
      data: { kind: "ASSIGNMENT", visibility: "ADMIN_ONLY" },
    });
  });

  it("publishes campaign content once and fans out only lightweight audience rows", async () => {
    let entryData: Record<string, unknown> = {};
    let campaignData: Record<string, unknown> = {};
    const audienceData: Array<Record<string, unknown>> = [];
    let outboxData: Record<string, unknown> = {};
    const tx = {
      communicationConversation: {
        findUnique: async () => null,
        create: async () => ({ id: "conversation-2", number: 102 }),
      },
      communicationEntry: { create: async (args: { data: Record<string, unknown> }) => { entryData = args.data; return { id: "entry-1" }; } },
      communicationCampaign: { create: async (args: { data: Record<string, unknown> }) => { campaignData = args.data; return { id: "campaign-1" }; } },
      communicationAudience: { createMany: async (args: { data: Array<Record<string, unknown>> }) => { audienceData.push(...args.data); return { count: args.data.length }; } },
      communicationOutboxEvent: { create: async (args: { data: Record<string, unknown> }) => { outboxData = args.data; return { id: "outbox-1" }; } },
    };
    const prisma = { $transaction: async <T>(work: (client: typeof tx) => Promise<T>) => work(tx) };
    const repository = createPrismaCommunicationRepository(prisma as unknown as PrismaClient);
    const command: PublishCampaignCommand = {
      sourceModule: "admin.communications",
      idempotencyKey: "campaign-1",
      typeKey: "campaign.announcement",
      subject: "إعلان",
      actor: ADMIN,
      tenantIds: ["tenant-1", "tenant-2"],
      audienceDefinition: { mode: "EXPLICIT" },
      audienceDefinitionVersion: 1,
      scheduledAt: null,
      entry: {
        actor: ADMIN,
        kind: "MESSAGE",
        visibility: "CUSTOMER_AND_ADMIN",
        body: "النص الوحيد",
        eventName: null,
        metadata: null,
        correctionOfEntryId: null,
        idempotencyKey: "campaign-1:entry",
        attachments: [],
      },
      correlationId: null,
      causationId: null,
      occurredAt: NOW,
    };

    const result = await repository.publishCampaign(command);

    expect(result.recipientCount).toBe(2);
    expect(entryData.body).toBe("النص الوحيد");
    expect(campaignData).not.toHaveProperty("body");
    expect(audienceData.every((row) => !("body" in row))).toBe(true);
    expect(outboxData).not.toHaveProperty("body");
  });

  it("withdraws a campaign, its audience, and emits one audited outbox event atomically", async () => {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const tx = {
      communicationCampaign: {
        findUnique: async () => ({ id: "campaign-1", conversationId: "conversation-2", status: "PUBLISHED", withdrawnAt: null }),
        update: async (args: Record<string, unknown>) => { calls.push({ name: "campaign", args }); return {}; },
      },
      communicationAudience: { updateMany: async (args: Record<string, unknown>) => { calls.push({ name: "audience", args }); return { count: 2 }; } },
      communicationConversation: { update: async (args: Record<string, unknown>) => { calls.push({ name: "conversation", args }); return {}; } },
      communicationOutboxEvent: { create: async (args: Record<string, unknown>) => { calls.push({ name: "outbox", args }); return {}; } },
    };
    const prisma = { $transaction: async <T>(work: (client: typeof tx) => Promise<T>) => work(tx) };
    const repository = createPrismaCommunicationRepository(prisma as unknown as PrismaClient);

    await repository.withdrawCampaign({
      campaignId: "campaign-1",
      actor: ADMIN,
      reason: "محتوى غير دقيق",
      idempotencyKey: "withdraw-1",
      correlationId: null,
      causationId: null,
      occurredAt: NOW,
    });

    expect(calls.map((call) => call.name)).toEqual(["campaign", "audience", "conversation", "outbox"]);
    expect(calls.find((call) => call.name === "conversation")?.args).toMatchObject({ data: { lifecycleState: "WITHDRAWN" } });
    expect(calls.find((call) => call.name === "outbox")?.args).toMatchObject({ data: { eventName: "communication.campaign.withdrawn.v1" } });
  });
});
