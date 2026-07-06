import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardTemplateSelectionCard } from "@/components/dashboard/dashboard-template-selection-card";

const template = {
  code: "noir-gold",
  themeCode: "noir-gold",
  name: "Ali Ahmed Luxury",
  status: "published" as const,
  showroomOrder: 1,
  description: "قالب داكن ذهبي جاهز للحجز."
};

describe("dashboard template selection card", () => {
  it("renders live preview and real template selection controls", () => {
    render(
      <DashboardTemplateSelectionCard
        template={template}
        isCurrent={false}
        action={vi.fn()}
      />
    );

    expect(screen.getByRole("link", { name: "معاينة حية" })).toHaveAttribute(
      "href",
      "/templates/noir-gold/preview"
    );
    expect(screen.getByRole("button", { name: "تفعيل القالب" })).toBeEnabled();
    expect(screen.getByDisplayValue("noir-gold")).toHaveAttribute(
      "name",
      "templateCode"
    );
  });

  it("marks the currently active template without offering a fake action", () => {
    render(
      <DashboardTemplateSelectionCard
        template={template}
        isCurrent
        action={vi.fn()}
      />
    );

    expect(screen.getByText("القالب الحالي")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "القالب مفعل" })).toBeDisabled();
  });
});
