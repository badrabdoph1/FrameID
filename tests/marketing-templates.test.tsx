import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TemplatesPage from "@/app/(marketing)/templates/page";

describe("marketing templates page", () => {
  it("keeps template selection direct and uncluttered", () => {
    render(<TemplatesPage />);

    expect(
      screen.getByRole("heading", {
        name: "اختار شكل موقعك"
      })
    ).toBeInTheDocument();

    expect(screen.queryByText("شوف الشكل")).not.toBeInTheDocument();
    expect(screen.queryByText("اختار اللي يعجبك")).not.toBeInTheDocument();
    expect(screen.queryByText("كمّل حسابك")).not.toBeInTheDocument();
    expect(screen.queryByText("لقيت الشكل المناسب؟")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ابدأ مجانًا" })).not.toBeInTheDocument();

    const previewLinks = screen.getAllByRole("link", { name: /شوف القالب/u });
    expect(previewLinks[0]).toHaveAttribute("href", "/templates/noir-gold/preview");
    const useLinks = screen.getAllByRole("link", { name: /استخدمه لموقعي/u });
    expect(useLinks[0]).toHaveAttribute("href", "/signup?template=noir-gold");
  });
});
