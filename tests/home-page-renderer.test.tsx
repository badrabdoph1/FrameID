import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePageRenderer } from "@/components/marketing/home-page-renderer";
import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";

const document: PlatformPageDocument = {
  pageKey: "home",
  schemaVersion: 1,
  sections: [
    {
      id: "home-hero",
      type: "home.hero",
      status: "visible",
      content: {
        badge: "للمصورين",
        headline: "موقعك يعرض شغلك",
        headlineHighlight: "كما يستحق",
        subheadline: "كل ما يحتاجه عميلك في رابط واضح.",
        heroImage: "https://example.com/hero.jpg",
        cta: { label: "ابدأ الآن", href: "/signup" },
        secondaryCta: { label: "شاهد القوالب", href: "/templates" },
        trustPoints: [],
      },
    },
    {
      id: "home-benefits",
      type: "home.benefits",
      status: "hidden",
      content: {
        items: [{ title: "أسعار واضحة", body: "العميل يعرف التفاصيل دون انتظار." }],
      },
    },
    {
      id: "home-faq",
      type: "home.faq",
      status: "visible",
      content: {
        badge: "الأسئلة",
        title: "إجابات مباشرة",
        message: "",
        sectionTitle: "الأسئلة الشائعة",
        items: [{ question: "هل أحتاج مبرمجًا؟", answer: "لا، التعديل مباشر." }],
      },
    },
  ],
};

describe("home page renderer", () => {
  it("renders the canonical document and omits hidden sections", () => {
    const { container } = render(<HomePageRenderer document={document} />);

    expect(screen.getByRole("heading", { name: "موقعك يعرض شغلك كما يستحق" })).toBeInTheDocument();
    expect(screen.getByText("هل أحتاج مبرمجًا؟")).toBeInTheDocument();
    expect(screen.queryByText("أسعار واضحة")).not.toBeInTheDocument();
    expect(container.querySelector('[data-page-section="home-hero"]')).toBeInTheDocument();
    expect(container.querySelector('[data-page-section="home-benefits"]')).not.toBeInTheDocument();
  });

  it("keeps editable field identity beside the real rendered text", () => {
    const { container } = render(<HomePageRenderer document={document} />);

    expect(container.querySelector('[data-page-field="headline"]')).toHaveTextContent("موقعك يعرض شغلك");
    expect(container.querySelector('[data-page-field="items.0.question"]')).toHaveTextContent(
      "هل أحتاج مبرمجًا؟",
    );
  });
});
