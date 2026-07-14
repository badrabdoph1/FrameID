import { describe, expect, it, vi } from "vitest";

import { createPrismaPlatformPageRepository } from "@/modules/platform-pages/prisma-page-repository";
import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";
import type { SavePlatformPageResult } from "@/modules/platform-pages/page-service";

const document: PlatformPageDocument = {
  pageKey: "home",
  schemaVersion: 1,
  sections: [
    {
      id: "hero",
      type: "home.hero",
      status: "visible",
      content: { headline: "موقعك كما تراه" },
    },
  ],
};

function page(version: number) {
  return {
    id: "page-1",
    key: "home",
    route: "/",
    kind: "EDITORIAL",
    document,
    version,
    schemaVersion: 1,
    updatedAt: new Date("2026-07-15T00:00:00.000Z"),
  };
}

function createClient() {
  const transaction = {
    platformPage: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    platformPageRevision: {
      create: vi.fn().mockResolvedValue({ id: "revision-2" }),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  };

  return {
    transaction,
    client: {
      platformPage: transaction.platformPage,
      platformPageRevision: transaction.platformPageRevision,
      $transaction: vi.fn(
        async (callback: (value: typeof transaction) => Promise<SavePlatformPageResult>) =>
          callback(transaction),
      ),
    },
  };
}

describe("prisma platform page repository", () => {
  it("updates the current document and appends its revision in one transaction", async () => {
    const { client, transaction } = createClient();
    transaction.platformPage.findUnique
      .mockResolvedValueOnce(page(1))
      .mockResolvedValueOnce(page(2));
    transaction.platformPage.updateMany.mockResolvedValue({ count: 1 });
    const repository = createPrismaPlatformPageRepository(client);

    const result = await repository.saveWithRevision({
      pageKey: "home",
      route: "/",
      kind: "EDITORIAL",
      expectedVersion: 1,
      document,
      actor: { id: "admin-1", name: "مسؤول المنصة" },
      changeSummary: "تعديل القسم الرئيسي",
    });

    expect(client.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.platformPage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: "home", version: 1 } }),
    );
    expect(transaction.platformPageRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ pageId: "page-1", version: 2, document }),
    });
    expect(result).toMatchObject({ status: "saved", page: { version: 2 } });
  });

  it("returns a conflict and writes no revision when the expected version is stale", async () => {
    const { client, transaction } = createClient();
    transaction.platformPage.findUnique
      .mockResolvedValueOnce(page(4))
      .mockResolvedValueOnce(page(4));
    transaction.platformPage.updateMany.mockResolvedValue({ count: 0 });
    const repository = createPrismaPlatformPageRepository(client);

    const result = await repository.saveWithRevision({
      pageKey: "home",
      route: "/",
      kind: "EDITORIAL",
      expectedVersion: 3,
      document,
      actor: { id: "admin-1" },
    });

    expect(result).toEqual({ status: "conflict", currentVersion: 4 });
    expect(transaction.platformPageRevision.create).not.toHaveBeenCalled();
  });

  it("creates the first page and revision when the expected version is zero", async () => {
    const { client, transaction } = createClient();
    transaction.platformPage.findUnique.mockResolvedValue(null);
    transaction.platformPage.create.mockResolvedValue(page(1));
    const repository = createPrismaPlatformPageRepository(client);

    const result = await repository.saveWithRevision({
      pageKey: "home",
      route: "/",
      kind: "EDITORIAL",
      expectedVersion: 0,
      document,
      actor: { id: "admin-1" },
    });

    expect(transaction.platformPage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ key: "home", document, version: 1 }),
    });
    expect(transaction.platformPageRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ version: 1, document }),
    });
    expect(result).toMatchObject({ status: "saved", page: { version: 1 } });
  });

  it("reads a revision only through its owning page key", async () => {
    const { client, transaction } = createClient();
    transaction.platformPageRevision.findFirst.mockResolvedValue({
      id: "revision-1",
      version: 1,
      document,
      page: { key: "home" },
    });
    const repository = createPrismaPlatformPageRepository(client);

    await expect(repository.findRevision("home", "revision-1")).resolves.toEqual({
      id: "revision-1",
      pageKey: "home",
      version: 1,
      document,
    });
    expect(transaction.platformPageRevision.findFirst).toHaveBeenCalledWith({
      where: { id: "revision-1", page: { key: "home" } },
      include: { page: { select: { key: true } } },
    });
  });

  it("turns a simultaneous first-save unique race into an explicit conflict", async () => {
    const { client } = createClient();
    client.$transaction.mockRejectedValueOnce({ code: "P2002" });
    client.platformPage.findUnique.mockResolvedValue(page(1));
    const repository = createPrismaPlatformPageRepository(client);

    await expect(repository.saveWithRevision({
      pageKey: "home",
      route: "/",
      kind: "EDITORIAL",
      expectedVersion: 0,
      document,
      actor: { id: "admin-1" },
    })).resolves.toEqual({ status: "conflict", currentVersion: 1 });
  });
});
