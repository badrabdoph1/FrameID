import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TemplatesPage from "@/app/(marketing)/templates/page";

describe("marketing templates page", () => {
  it("keeps template selection direct and uncluttered", () => {
    render(<TemplatesPage />);

    expect(
      screen.getByRole("heading", {
        name: /اختار شكل موقع/u
      })
    ).toBeInTheDocument();

    const previewLinks = screen.getAllByRole("link", { name: /معاينة مباشرة/u });
    expect(previewLinks[0]).toHaveAttribute("href", "/templates/noir-gold/preview");
    const useLinks = screen.getAllByRole("link", { name: /استخدم هذا القالب/u });
    expect(useLinks[0]).toHaveAttribute("href", "/signup?template=noir-gold");
  });
});
