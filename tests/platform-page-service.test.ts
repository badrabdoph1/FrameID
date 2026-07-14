import { describe, expect, it, vi } from "vitest";

import {
  PlatformPageConflictError,
  createPlatformPageDocumentLoader,
  createPlatformPageService,
  type PlatformPageRepository,
} from "@/modules/platform-pages/page-service";
import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";

const document: PlatformPageDocument = {
  pageKey: "home",
  schemaVersion: 1,
  sections: [
    {
      id: "hero",
      type: "home.hero",
      status: "visible",
      content: {
        badge: "للمصورين",
        headline: "كل شغلك في رابط واحد",
        headlineHighlight: "بوضوح",
        subheadline: "وصف بسيط",
        heroImage: "https://example.com/hero.jpg",
        cta: { label: "ابدأ", href: "/signup" },
        secondaryCta: { label: "القوالب", href: "/templates" },
        trustPoints: [],
      },
    },
  ],
};

function createRepository(): PlatformPageRepository {
  return {
    findByKey: vi.fn().mockResolvedValue(null),
    saveWithRevision: vi.fn().mockResolvedValue({
      status: "saved",
      page: {
        id: "page-1",
        key: "home",
        route: "/",
        kind: "EDITORIAL",
        document,
        version: 2,
        schemaVersion: 1,
        updatedAt: new Date("2026-07-15T00:00:00.000Z"),
      },
      revisionId: "revision-2",
    }),
    listRevisions: vi.fn().mockResolvedValue([]),
    findRevision: vi.fn().mockResolvedValue(null),
  };
}

describe("platform page service", () => {
  it("uses the stored page as the only published source once it exists", async () => {
    const repository = createRepository();
    const stored = { ...document, sections: [{ ...document.sections[0], content: { headline: "من قاعدة البيانات" } }] };
    vi.mocked(repository.findByKey).mockResolvedValue({
      id: "page-1",
      key: "home",
      route: "/",
      kind: "EDITORIAL",
      document: stored,
      version: 3,
      schemaVersion: 1,
      updatedAt: new Date(),
    });

    const loader = createPlatformPageDocumentLoader(repository);

    await expect(loader.load("home", document)).resolves.toBe(stored);
  });

  it("uses legacy content only before the page has its first stored version", async () => {
    const repository = createRepository();
    const loader = createPlatformPageDocumentLoader(repository);

    await expect(loader.load("home", document)).resolves.toBe(document);
  });

  it("validates the document before asking the repository to save", async () => {
    const repository = createRepository();
    const service = createPlatformPageService(repository);

    await expect(
      service.save({
        pageKey: "home",
        route: "/",
        kind: "EDITORIAL",
        expectedVersion: 1,
        document: { ...document, sections: [] },
        actor: { id: "admin-1", name: "مسؤول المنصة", email: "admin@frameid.app" },
      }),
    ).rejects.toThrow("الصفحة يجب أن تحتوي على قسم واحد على الأقل");

    expect(repository.saveWithRevision).not.toHaveBeenCalled();
  });

  it("does not allow a document to be saved under another page key", async () => {
    const repository = createRepository();
    const service = createPlatformPageService(repository);

    await expect(
      service.save({
        pageKey: "templates",
        route: "/templates",
        kind: "EDITORIAL",
        expectedVersion: 1,
        document,
        actor: { id: "admin-1", name: "مسؤول المنصة" },
      }),
    ).rejects.toThrow("مفتاح الصفحة لا يطابق محتواها");
  });

  it("rejects unknown section types before they can break the renderer", async () => {
    const repository = createRepository();
    const service = createPlatformPageService(repository);

    await expect(service.save({
      pageKey: "home",
      route: "/",
      kind: "EDITORIAL",
      expectedVersion: 1,
      document: {
        ...document,
        sections: [{ ...document.sections[0], type: "home.unknown" }],
      },
      actor: { id: "admin-1" },
    })).rejects.toThrow("قسم غير مسجل");

    expect(repository.saveWithRevision).not.toHaveBeenCalled();
  });

  it("rejects incomplete section content before saving", async () => {
    const repository = createRepository();
    const service = createPlatformPageService(repository);

    await expect(service.save({
      pageKey: "home",
      route: "/",
      kind: "EDITORIAL",
      expectedVersion: 1,
      document: {
        ...document,
        sections: [{ ...document.sections[0], content: { headline: "ناقص" } }],
      },
      actor: { id: "admin-1" },
    })).rejects.toThrow("غير مكتمل");

    expect(repository.saveWithRevision).not.toHaveBeenCalled();
  });

  it("passes one validated document to an atomic page-and-revision save", async () => {
    const repository = createRepository();
    const service = createPlatformPageService(repository);

    const result = await service.save({
      pageKey: "home",
      route: "/",
      kind: "EDITORIAL",
      expectedVersion: 1,
      document,
      actor: { id: "admin-1", name: "مسؤول المنصة", email: "admin@frameid.app" },
    });

    expect(result.page.version).toBe(2);
    expect(repository.saveWithRevision).toHaveBeenCalledWith(
      expect.objectContaining({ expectedVersion: 1, document }),
    );
  });

  it("surfaces an explicit conflict instead of overwriting another admin", async () => {
    const repository = createRepository();
    vi.mocked(repository.saveWithRevision).mockResolvedValue({
      status: "conflict",
      currentVersion: 4,
    });
    const service = createPlatformPageService(repository);

    await expect(
      service.save({
        pageKey: "home",
        route: "/",
        kind: "EDITORIAL",
        expectedVersion: 3,
        document,
        actor: { id: "admin-2", name: "محرر آخر" },
      }),
    ).rejects.toEqual(new PlatformPageConflictError(4));
  });

  it("restores an old document by creating a new current revision", async () => {
    const repository = createRepository();
    vi.mocked(repository.findRevision).mockResolvedValue({
      id: "revision-1",
      pageKey: "home",
      version: 1,
      document,
    });
    const service = createPlatformPageService(repository);

    const result = await service.restore({
      pageKey: "home",
      revisionId: "revision-1",
      route: "/",
      kind: "EDITORIAL",
      expectedVersion: 2,
      actor: { id: "admin-1", name: "مسؤول المنصة" },
    });

    expect(result.page.version).toBe(2);
    expect(repository.saveWithRevision).toHaveBeenCalledWith(
      expect.objectContaining({
        document,
        restoredFromRevisionId: "revision-1",
        changeSummary: "استعادة النسخة 1",
      }),
    );
  });

  it("cannot restore a revision that does not belong to the page", async () => {
    const repository = createRepository();
    const service = createPlatformPageService(repository);

    await expect(
      service.restore({
        pageKey: "home",
        revisionId: "missing",
        route: "/",
        kind: "EDITORIAL",
        expectedVersion: 2,
        actor: { id: "admin-1" },
      }),
    ).rejects.toThrow("النسخة المطلوبة غير موجودة");

    expect(repository.saveWithRevision).not.toHaveBeenCalled();
  });
});
