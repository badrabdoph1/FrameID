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

  it("lets the real templates grid generate its cascade", async () => {
    const { container } = render(await TemplatesPage({ searchParams: Promise.resolve({}) }));

    const grid = container.querySelector('[data-journey-source="templates-grid"]');
    expect(grid).toBeInTheDocument();
    expect(grid?.querySelectorAll("[data-journey-card]").length).toBeGreaterThan(1);
  });

  it("anchors the assembly moment to the real submit action", () => {
    render(<SignupForm template="noir-gold" />);

    const button = screen.getByRole("button", { name: "إنشاء موقعي" });
    expect(button.closest('[data-journey-source="signup-create"]')).toBeInTheDocument();
    expect(button).toHaveAttribute("data-journey-cta");
  });
});
