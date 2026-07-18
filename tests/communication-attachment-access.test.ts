import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { findAccessibleCommunicationAttachment } from "@/modules/communication-center/attachment-access";

describe("communication attachment access", () => {
  it("scopes customer attachment access through the tenant audience", async () => {
    let args: unknown;
    const prisma = {
      communicationAttachment: {
        findFirst: async (input: unknown) => { args = input; return null; },
      },
    };

    await findAccessibleCommunicationAttachment(prisma as unknown as PrismaClient, "attachment-1", { type: "CUSTOMER", tenantId: "tenant-1" });

    expect(args).toMatchObject({
      where: {
        id: "attachment-1",
        scanStatus: "CLEAN",
        deletedAt: null,
        entry: {
          visibility: "CUSTOMER_AND_ADMIN",
          redactedAt: null,
          conversation: {
            audiences: { some: { tenantId: "tenant-1", deliveredAt: { not: null }, archivedAt: null, withdrawnAt: null } },
          },
        },
      },
    });
  });

  it("allows an already-authorized admin without weakening customer scope", async () => {
    let args: unknown;
    const prisma = {
      communicationAttachment: {
        findFirst: async (input: unknown) => { args = input; return null; },
      },
    };

    await findAccessibleCommunicationAttachment(prisma as unknown as PrismaClient, "attachment-1", { type: "ADMIN" });

    expect(args).toEqual({
      where: { id: "attachment-1", scanStatus: "CLEAN", deletedAt: null },
      select: { storageProvider: true, storageKey: true, originalName: true, mimeType: true, sizeBytes: true },
    });
  });
});
