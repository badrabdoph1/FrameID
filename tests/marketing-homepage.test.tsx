import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/(marketing)/page";
import { getContent } from "@/lib/content";

async function renderHomepage() {
  return render(await HomePage());
}

describe("marketing homepage", () => {
  it("renders the published page document through the real public renderer", async () => {
    const homepage = getContent("marketing/homepage");
    const { container } = await renderHomepage();

    expect(container.querySelectorAll("[data-page-section]")).toHaveLength(6);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(homepage.hero.headline);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(homepage.hero.headlineHighlight);
  });

  it("uses the configured calls to action without exposing editor controls", async () => {
    const homepage = getContent("marketing/homepage");
    const { container } = await renderHomepage();

    const primary = container.querySelector('[data-journey-source="home-start"]');
    expect(primary).toHaveAttribute("href", homepage.hero.cta.href);
    expect(container.querySelector("[data-editor-canvas]")).not.toBeInTheDocument();
    expect(container.querySelector("[contenteditable='true']")).not.toBeInTheDocument();
  });

  it("renders trust points and FAQ from the canonical document", async () => {
    const homepage = getContent("marketing/homepage");
    const faq = getContent("marketing/faq");
    await renderHomepage();

    expect(screen.getByText(homepage.hero.trustPoints[0].text)).toBeInTheDocument();
    expect(screen.getByText(faq.items[0].question)).toBeInTheDocument();
  });

  it("does not contain fabricated testimonials or admin-only language", async () => {
    await renderHomepage();

    expect(screen.queryByText("أحمد السعيد")).not.toBeInTheDocument();
    expect(screen.queryByText("سارة الغامدي")).not.toBeInTheDocument();
    expect(screen.queryByText("لوحة الأدمن")).not.toBeInTheDocument();
  });
});
