import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NoirGoldPresentation } from "@/components/themes/noir-gold-presentation";
import { resolveHeroSettings } from "@/modules/themes/template-contract";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    const imageProps = { ...props };
    const alt = imageProps.alt ?? "";
    delete imageProps.alt;
    delete imageProps.fill;
    delete imageProps.priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...imageProps} />;
  },
}));

function createSite(): PublicSiteViewModel {
  return {
    publicUrl: "https://frameid.app/p/ali",
    siteId: "site_1",
    themeCode: "noir-gold",
    metadata: {},
    structuredData: {},
    contact: {
      studioName: "Ali Studio",
      bio: "Stories",
      longDescription: null,
      callToAction: "احجز الآن",
      phone: "01000000000",
      whatsapp: "201000000000",
      email: "ali@example.com",
      instagram: null,
      facebook: null,
      tiktok: null,
      workLocation: "القاهرة",
    },
    hero: {
      headline: "Ali Studio",
      subheadline: "Wedding stories",
      imageUrl: "https://example.com/hero.jpg",
      overlay: "medium",
      position: "center",
      height: "compact",
      cta: { label: "الأسعار والباكدج", target: "packages" },
      eyebrow: "تصوير احترافي",
    },
    sections: {
      hero: { title: "الرئيسية", description: null, sortOrder: 0, isVisible: true, settings: {} },
      gallery: { title: "المعرض", description: null, sortOrder: 1, isVisible: false, settings: {} },
      packages: { title: "الباقات", description: null, sortOrder: 2, isVisible: true, settings: {} },
      extras: { title: "الإضافات", description: null, sortOrder: 3, isVisible: true, settings: {} },
      contact: { title: "التواصل", description: null, sortOrder: 4, isVisible: true, settings: {} },
    },
    orderedSections: [
      { type: "hero", title: "الرئيسية", description: null, sortOrder: 0, isVisible: true, settings: {} },
      { type: "packages", title: "الباقات", description: null, sortOrder: 2, isVisible: true, settings: {} },
      { type: "extras", title: "الإضافات", description: null, sortOrder: 3, isVisible: true, settings: {} },
      { type: "contact", title: "التواصل", description: null, sortOrder: 4, isVisible: true, settings: {} },
    ],
    packages: [
      {
        id: "package_1",
        name: "باقة كاملة",
        subtitle: "تغطية يوم كامل",
        price: "12,000 جنيه",
        priceAmount: 12000,
        currency: "EGP",
        features: ["تصوير كامل"],
        imageUrl: null,
        isHighlighted: true,
      },
    ],
    extras: [
      { id: "extra_1", name: "ألبوم", price: "1,500 جنيه", priceAmount: 1500, currency: "EGP", iconKey: "album" },
    ],
    gallery: [],
  };
}

describe("template booking flow", () => {
  it("uses the new packages CTA label by default", () => {
    expect(resolveHeroSettings({}).cta.label).toBe("الأسعار والباكدج");
  });

  it("shows booking details above contact actions in the classic template", () => {
    render(<NoirGoldPresentation site={createSite()} />);

    fireEvent.click(screen.getByRole("button", { name: "اختر الباقة" }));

    const summary = screen.getByText("تفاصيل الحجز");
    const contact = screen.getByText("اتصال");

    expect(summary.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText("باقة كاملة")).toHaveLength(2);
    expect(screen.getAllByText("12,000 جنيه")).toHaveLength(3);
  });
});
