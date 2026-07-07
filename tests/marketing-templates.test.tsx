import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TemplatesPage from "@/app/(marketing)/templates/page";

describe("marketing templates page", () => {
  it("explains live preview and selected-template signup", () => {
    render(<TemplatesPage />);

    expect(
      screen.getByRole("heading", {
        name: "اختر قالبًا كأنه موقع عميل حقيقي."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "المعاينة الحية تفتح نفس القالب الذي سيحصل عليه المصور، ثم يحمل زر استخدام القالب اختياره إلى التسجيل."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /معاينة/u })
    ).toHaveAttribute("href", "/templates/noir-gold/preview");
    expect(
      screen.getByRole("link", { name: /استخدام القالب/u })
    ).toHaveAttribute("href", "/signup?template=noir-gold");
  });
});
