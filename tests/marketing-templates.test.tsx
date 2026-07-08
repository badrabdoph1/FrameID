import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TemplatesPage from "@/app/(marketing)/templates/page";

describe("marketing templates page", () => {
  it("explains live preview and selected-template signup", () => {
    render(<TemplatesPage />);

    expect(
      screen.getByRole("heading", {
        name: "اختار قالب—كأنه موقع عميل حقيقي."
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "المعاينة الحية بتفتح نفس القالب اللي هياخده المصور، وزير استخدم القالب بياخد اختيارك للتسجيل."
      )
    ).toBeInTheDocument();
    const previewLinks = screen.getAllByRole("link", { name: /معاينة القالب/u });
    expect(previewLinks[0]).toHaveAttribute("href", "/templates/noir-gold/preview");
    const useLinks = screen.getAllByRole("link", { name: /استخدم القالب ده/u });
    expect(useLinks[0]).toHaveAttribute("href", "/signup?template=noir-gold");
  });
});
