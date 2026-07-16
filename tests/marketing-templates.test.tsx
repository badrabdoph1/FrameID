import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TemplatesPage from "@/app/(marketing)/templates/page";

describe("marketing templates page", () => {
  it("keeps template selection direct and uncluttered", async () => {
    render(await TemplatesPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", {
        name: /اختار شكل موقع/u
      })
    ).toBeInTheDocument();

    const previewLinks = screen.getAllByRole("link", { name: /شوف شكل الموقع/u });
    expect(previewLinks[0]).toHaveAttribute("href", "/templates/noir-gold/preview");
    const useLinks = screen.getAllByRole("link", { name: /استخدم الموقع ده/u });
    expect(useLinks[0]).toHaveAttribute("href", "/signup?template=noir-gold");
  });
});
