import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(admin)/admin/templates/actions", () => ({
  saveTemplateAction: vi.fn(),
  toggleTemplateAction: vi.fn()
}));
vi.mock("@/app/(admin)/admin/templates/management-actions", () => ({
  archiveTemplateAction: vi.fn(),
  createTemplateAction: vi.fn(),
  duplicateTemplateAction: vi.fn(),
  restoreTemplateDefaultsAction: vi.fn()
}));
vi.mock("@/app/(admin)/admin/templates/template-cover-upload", () => ({
  TemplateCoverUpload: () => React.createElement("div", null, "رفع غلاف القالب")
}));
vi.mock("@/app/(admin)/admin/templates/template-visual-upload", () => ({
  TemplateVisualUpload: ({ label }: { label: string }) => React.createElement("div", null, label)
}));

import { TemplateManager } from "@/app/(admin)/admin/templates/template-manager";

const templates = [
  {
    id: "classic",
    name: "كلاسك",
    code: "noir-gold",
    status: "PUBLISHED",
    showroomOrder: 1,
    previewData: {
      title: "كلاسك",
      hero: { headline: "أحمد علي", imageUrl: "https://example.com/hero.jpg" },
      packages: [{ id: "gold", name: "الذهبية", imageUrl: "https://example.com/gold.jpg", features: [] }],
      extras: []
    },
    settings: {},
    theme: { id: "theme-1", name: "كلاسك", code: "noir-gold", category: "photography", status: "PUBLISHED" }
  },
  {
    id: "rose",
    name: "أنيق وهادئ",
    code: "rose-blush",
    status: "PUBLISHED",
    showroomOrder: 2,
    previewData: { title: "أنيق وهادئ", hero: {}, packages: [], extras: [] },
    settings: {},
    theme: { id: "theme-2", name: "أنيق وهادئ", code: "rose-blush", category: "photography", status: "PUBLISHED" }
  }
];

const themes = templates.map((template) => ({
  id: template.theme.id,
  name: template.theme.name,
  code: template.theme.code,
  status: template.theme.status
}));

describe("admin template manager", () => {
  it("uses one template list and one editor", () => {
    const { container } = render(
      <TemplateManager templates={templates} themes={themes} message={null} />
    );

    expect(screen.getByRole("button", { name: "تعديل كلاسك" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تعديل أنيق وهادئ" })).toBeInTheDocument();
    expect(container.querySelectorAll('form input[name="name"]')).toHaveLength(1);
    expect(screen.getByRole("region", { name: "صور قالب كلاسك" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "قالب جديد" }));

    expect(container.querySelectorAll('form input[name="name"]')).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "صور قالب كلاسك" })).not.toBeInTheDocument();
  });

  it("moves image tools with the selected template", () => {
    render(<TemplateManager templates={templates} themes={themes} message={null} />);

    fireEvent.click(screen.getByRole("button", { name: "تعديل أنيق وهادئ" }));

    expect(screen.getByRole("region", { name: "صور قالب أنيق وهادئ" })).toBeInTheDocument();
    expect(screen.getByText("رفع غلاف القالب")).toBeInTheDocument();
    expect(screen.getByText("صورة القسم الرئيسي Hero")).toBeInTheDocument();
  });
});
