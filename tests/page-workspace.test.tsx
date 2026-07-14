import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const savePlatformPageAction = vi.hoisted(() => vi.fn());
const uploadPlatformPageImageAction = vi.hoisted(() => vi.fn());
const restorePlatformPageRevisionAction = vi.hoisted(() => vi.fn());

vi.mock("@/app/(admin)/admin/content/pages/actions", () => ({
  savePlatformPageAction,
  uploadPlatformPageImageAction,
  restorePlatformPageRevisionAction,
}));

import { PageWorkspace } from "@/components/content/page-workspace/page-workspace";
import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";

const document: PlatformPageDocument = {
  pageKey: "home",
  schemaVersion: 1,
  sections: [
    {
      id: "home-hero",
      type: "home.hero",
      status: "visible",
      content: {
        badge: "للمصورين",
        headline: "العنوان القديم",
        headlineHighlight: "بوضوح",
        subheadline: "وصف بسيط",
        heroImage: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4",
        cta: { label: "ابدأ", href: "/signup" },
        secondaryCta: { label: "القوالب", href: "/templates" },
        trustPoints: [],
      },
    },
    {
      id: "home-faq",
      type: "home.faq",
      status: "visible",
      content: {
        badge: "الأسئلة",
        title: "إجابات مباشرة",
        message: "",
        items: [{ question: "هل التعديل سهل؟", answer: "نعم." }],
      },
    },
  ],
};

describe("page workspace", () => {
  it("edits the real rendered text and can undo it", () => {
    render(<PageWorkspace definitionKey="home" initialDocument={document} initialVersion={1} />);

    const field = screen.getByText("العنوان القديم");
    fireEvent.input(field, { target: { textContent: "العنوان الجديد" } });
    fireEvent.blur(field);

    expect(screen.getByText("العنوان الجديد")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "تراجع" }));
    expect(screen.getByText("العنوان القديم")).toBeInTheDocument();
  });

  it("keeps hidden sections restorable from the same document", () => {
    const { container } = render(
      <PageWorkspace definitionKey="home" initialDocument={document} initialVersion={1} />,
    );

    fireEvent.click(container.querySelector('[data-page-section="home-faq"]')!);
    fireEvent.click(screen.getByRole("button", { name: "إخفاء القسم" }));

    expect(screen.queryByText("هل التعديل سهل؟")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "الأقسام" }));
    fireEvent.click(screen.getByRole("button", { name: "استعادة الأسئلة الشائعة" }));
    expect(screen.getByText("هل التعديل سهل؟")).toBeInTheDocument();
  });

  it("saves one document with optimistic versioning", async () => {
    savePlatformPageAction.mockResolvedValue({ success: true, version: 2 });
    render(<PageWorkspace definitionKey="home" initialDocument={document} initialVersion={1} />);

    const field = screen.getByText("العنوان القديم");
    fireEvent.input(field, { target: { textContent: "عنوان محفوظ" } });
    fireEvent.blur(field);
    fireEvent.click(screen.getByRole("button", { name: "حفظ التغييرات" }));

    await waitFor(() => expect(savePlatformPageAction).toHaveBeenCalledTimes(1));
    expect(savePlatformPageAction).toHaveBeenCalledWith(
      expect.objectContaining({
        pageKey: "home",
        expectedVersion: 1,
        document: expect.objectContaining({ pageKey: "home" }),
      }),
    );
    expect(await screen.findByText("تم الحفظ")).toBeInTheDocument();
  });

  it("duplicates editorial sections and permanently deletes only from hidden sections", () => {
    const { container } = render(
      <PageWorkspace definitionKey="home" initialDocument={document} initialVersion={1} />,
    );

    fireEvent.click(container.querySelector('[data-page-section="home-faq"]')!);
    fireEvent.click(screen.getByRole("button", { name: "نسخ القسم" }));
    expect(screen.getAllByText("هل التعديل سهل؟")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "إخفاء القسم" }));
    fireEvent.click(screen.getByRole("button", { name: "الأقسام" }));
    fireEvent.click(screen.getByRole("button", { name: "حذف الأسئلة الشائعة نهائيًا" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الحذف النهائي" }));

    expect(screen.getAllByText("هل التعديل سهل؟")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "استعادة الأسئلة الشائعة" })).not.toBeInTheDocument();
  });

  it("opens a focused crop flow from the image itself", () => {
    render(<PageWorkspace definitionKey="home" initialDocument={document} initialVersion={1} />);

    fireEvent.click(screen.getByRole("button", { name: "تغيير الصورة الرئيسية" }));

    expect(screen.getByRole("dialog", { name: "استبدال الصورة" })).toBeInTheDocument();
    expect(screen.getByLabelText("اختيار صورة")).toBeInTheDocument();
    expect(screen.getByLabelText("موضع أفقي")).toBeInTheDocument();
    expect(screen.getByLabelText("التقريب")).toBeInTheDocument();
  });

  it("edits a button through plain-language controls", () => {
    render(<PageWorkspace definitionKey="home" initialDocument={document} initialVersion={1} />);

    const button = screen.getByRole("link", { name: /ابدأ/ });
    fireEvent.click(button);
    const href = screen.getByLabelText("الرابط");
    fireEvent.change(href, { target: { value: "/pricing" } });
    fireEvent.blur(href);
    fireEvent.change(screen.getByLabelText("الشكل"), { target: { value: "secondary" } });

    expect(button).toHaveAttribute("href", "/pricing");
    expect(button.className).toContain("border");
    expect(screen.getByLabelText("العلامة")).toBeInTheDocument();
  });

  it("restores history as a new saved version", async () => {
    const restoredDocument: PlatformPageDocument = {
      ...document,
      sections: document.sections.map((section) => section.id === "home-hero"
        ? { ...section, content: { ...section.content, headline: "عنوان النسخة الأولى" } }
        : section),
    };
    restorePlatformPageRevisionAction.mockResolvedValue({
      success: true,
      version: 3,
      document: restoredDocument,
    });
    render(
      <PageWorkspace
        definitionKey="home"
        initialDocument={document}
        initialVersion={2}
        revisions={[
          { id: "revision-2", version: 2, actorName: "محرر", createdAt: "2026-07-15T10:00:00.000Z", changeSummary: null },
          { id: "revision-1", version: 1, actorName: "محرر", createdAt: "2026-07-14T10:00:00.000Z", changeSummary: null },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "سجل الإصدارات" }));
    fireEvent.click(screen.getByRole("button", { name: "استعادة" }));

    expect(await screen.findByText("عنوان النسخة الأولى")).toBeInTheDocument();
    expect(screen.getByText("تمت استعادة النسخة 1")).toBeInTheDocument();
    expect(restorePlatformPageRevisionAction).toHaveBeenCalledWith({
      pageKey: "home",
      revisionId: "revision-1",
      expectedVersion: 2,
    });
  });
});
