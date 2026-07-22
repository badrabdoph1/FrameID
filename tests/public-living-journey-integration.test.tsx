import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TemplatesPage from "@/app/(marketing)/templates/page";
import { SignupForm } from "@/components/auth/signup-form";
import { HomePageRenderer } from "@/components/marketing/home-page-renderer";
import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";

const homeDocument: PlatformPageDocument = {
  pageKey: "home",
  schemaVersion: 1,
  sections: [
    {
      id: "home-hero",
      type: "home.hero",
      status: "visible",
      content: {
        badge: "للمصورين",
        headline: "موقعك",
        headlineHighlight: "جاهز",
        subheadline: "كل شغلك في رابط واحد.",
        heroImage: "https://example.com/hero.jpg",
        cta: { label: "ابدأ", href: "/templates" },
        secondaryCta: { label: "شوف مثال", href: "/templates" },
        trustPoints: [],
      },
    },
  ],
};

describe("public living journey page integration", () => {
  it("anchors the home moment to the real primary CTA", () => {
    const { container } = render(<HomePageRenderer document={homeDocument} />);

    expect(screen.getByRole("link", { name: /ابدأ/ })).toHaveAttribute("href", "/templates");
    expect(container.querySelector('[data-journey-source="home-start"]')).toBeInTheDocument();
  });

  it("renders the templates page without errors", async () => {
    const { container } = render(await TemplatesPage({ searchParams: Promise.resolve({}) }));

    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(0);
    expect(container.querySelectorAll("a").length).toBeGreaterThan(0);
  });

  it("renders the signup form with a submit button", () => {
    render(<SignupForm template="noir-gold" />);

    expect(screen.getByRole("button", { name: "إنشاء موقعي" })).toBeInTheDocument();
  });
});
