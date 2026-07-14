import { describe, expect, it } from "vitest";

import {
  applyPageCommand,
  getVisibleSections,
  parsePlatformPageDocument,
  type PlatformPageDocument,
} from "@/modules/platform-pages/page-document";

const document: PlatformPageDocument = {
  pageKey: "home",
  schemaVersion: 1,
  sections: [
    {
      id: "hero",
      type: "home.hero",
      status: "visible",
      content: {
        headline: "كل شغلك في مكان واحد",
        cta: { label: "ابدأ الآن", href: "/signup" },
      },
    },
    {
      id: "benefits",
      type: "home.benefits",
      status: "visible",
      content: { title: "كل ما تحتاجه" },
    },
    {
      id: "faq",
      type: "home.faq",
      status: "visible",
      content: { title: "الأسئلة الشائعة" },
    },
  ],
};

describe("platform page document", () => {
  it("rejects duplicate section identities", () => {
    expect(() =>
      parsePlatformPageDocument({
        ...document,
        sections: [document.sections[0], document.sections[0]],
      }),
    ).toThrow("هوية كل قسم يجب أن تكون فريدة");
  });

  it("keeps hidden sections in the canonical document", () => {
    const next = applyPageCommand(document, {
      type: "set-section-status",
      sectionId: "benefits",
      status: "hidden",
    });

    expect(next.sections).toHaveLength(3);
    expect(next.sections[1].status).toBe("hidden");
    expect(getVisibleSections(next).map((section) => section.id)).toEqual(["hero", "faq"]);
    expect(document.sections[1].status).toBe("visible");
  });

  it("moves a section without mutating the previous document", () => {
    const next = applyPageCommand(document, {
      type: "move-section",
      sectionId: "faq",
      toIndex: 0,
    });

    expect(next.sections.map((section) => section.id)).toEqual(["faq", "hero", "benefits"]);
    expect(document.sections.map((section) => section.id)).toEqual(["hero", "benefits", "faq"]);
  });

  it("duplicates a section with a new stable identity and independent content", () => {
    const next = applyPageCommand(document, {
      type: "duplicate-section",
      sectionId: "benefits",
      newSectionId: "benefits-copy",
    });

    expect(next.sections.map((section) => section.id)).toEqual([
      "hero",
      "benefits",
      "benefits-copy",
      "faq",
    ]);
    expect(next.sections[2]).toEqual({ ...document.sections[1], id: "benefits-copy" });
    expect(next.sections[2].content).not.toBe(document.sections[1].content);
  });

  it("updates a nested field without exposing or mutating technical paths in the UI", () => {
    const next = applyPageCommand(document, {
      type: "update-field",
      sectionId: "hero",
      path: ["cta", "label"],
      value: "أنشئ موقعك",
    });

    expect(next.sections[0].content).toMatchObject({
      cta: { label: "أنشئ موقعك", href: "/signup" },
    });
    expect(document.sections[0].content).toMatchObject({ cta: { label: "ابدأ الآن" } });
    expect(next.sections[1]).toBe(document.sections[1]);
    expect(next.sections[2]).toBe(document.sections[2]);
  });

  it("removes a section only when delete forever is explicit", () => {
    const next = applyPageCommand(document, {
      type: "delete-section",
      sectionId: "faq",
    });

    expect(next.sections.map((section) => section.id)).toEqual(["hero", "benefits"]);
  });
});
