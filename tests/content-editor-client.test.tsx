import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(dashboard)/dashboard/content/actions", () => ({
  updateSectionAction: vi.fn(),
}));

import { ContentEditorClient } from "@/app/(dashboard)/dashboard/content/content-editor-client";

describe("content editor client", () => {
  it("renders every platform section and the complete dashboard-driven hero controls", () => {
    render(
      <ContentEditorClient
        coverUrl="https://example.com/cover.jpg"
        sections={[
          {
            type: "hero",
            title: "الرئيسية",
            sortOrder: 0,
            isVisible: true,
            data: {
              headline: "Frame Studio",
              subheadline: "Wedding stories",
              overlay: "medium",
              position: "center",
              height: "screen",
              cta: { label: "الأسعار والباكدج", target: "packages" },
              settings: { eyebrow: "تصوير احترافي" },
            },
          },
          { type: "gallery", title: "معرض الأعمال", sortOrder: 1, isVisible: true, data: { settings: {} } },
          { type: "packages", title: "الباقات", sortOrder: 2, isVisible: true, data: { settings: {} } },
          { type: "extras", title: "الإضافات", sortOrder: 3, isVisible: true, data: { settings: {} } },
          { type: "contact", title: "التواصل", sortOrder: 4, isVisible: true, data: { callToAction: "احجز الآن", settings: {} } },
        ]}
      />,
    );

    expect(screen.getAllByLabelText("إظهار القسم")).toHaveLength(5);
    expect(screen.getByRole("heading", { name: "Hero / الواجهة" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "معرض الأعمال" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "الباقات" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "الإضافات" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "التواصل" })).toBeInTheDocument();
    expect(screen.getByLabelText("قوة الـ Overlay")).toHaveValue("medium");
    expect(screen.getByLabelText("موضع الصورة")).toHaveValue("center");
    expect(screen.getByLabelText("ارتفاع الـ Hero")).toHaveValue("screen");
    expect(screen.getByLabelText("نص زر الـ CTA")).toHaveValue("الأسعار والباكدج");
    expect(screen.getByLabelText("وجهة زر الـ CTA")).toHaveValue("packages");
  });
});
