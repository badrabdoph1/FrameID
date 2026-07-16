import { describe, expect, it } from "vitest";

import {
  createPublicSiteViewModel,
  type PublicSiteRecord,
} from "@/modules/public-sites/public-site-view-model";

function createRecord(): PublicSiteRecord {
  return {
    id: "site_1",
    slug: "ali-ahmed",
    title: "Ali Ahmed",
    description: "Fine wedding photography in Cairo.",
    status: "PUBLISHED",
    isPublished: true,
    theme: { code: "noir-gold", name: "Noir Gold" },
    tenant: { displayName: "Ali Ahmed" },
    contactProfile: {
      studioName: "Ali Ahmed Studio",
      bio: "Natural wedding stories in Cairo.",
      longDescription: "Full customer-owned biography.",
      phone: "01000000000",
      whatsapp: "201000000000",
      email: "ali@example.com",
      instagram: "ali",
      facebook: "ali",
      tiktok: "@ali",
      workLocation: "متاح للتصوير في جميع المحافظات",
      avatarUrl: "https://example.com/profile.jpg",
      coverUrl: "https://example.com/cover.jpg",
    },
    sections: [
      {
        type: "hero",
        title: "Home",
        sortOrder: 0,
        data: {
          headline: "Ali Ahmed Studio",
          subheadline: "Elegant wedding photography.",
          imageUrl: "https://example.com/hero.jpg",
          overlay: "strong",
          position: "top",
          height: "tall",
          cta: { label: "تواصل الآن", target: "contact" },
          settings: { eyebrow: "قصص حقيقية" },
        },
      },
      {
        type: "gallery",
        title: "Gallery",
        sortOrder: 20,
        isVisible: false,
        data: { settings: { layout: "grid", limit: 3 } },
      },
      {
        type: "contact",
        title: "Contact",
        sortOrder: 10,
        data: { callToAction: "Book on WhatsApp" },
      },
    ],
    packages: [
      {
        id: "package_1",
        name: "Wedding Story",
        subtitle: "Full day coverage",
        priceAmount: 120000,
        currency: "EGP",
        features: ["تصوير اليوم كامل", "معالجة 250 صورة"],
        imageUrl: null,
        isHighlighted: true,
      },
    ],
    extras: [
      {
        id: "extra_1",
        name: "ألبوم فاخر",
        priceAmount: 15000,
        currency: "EGP",
        iconKey: "album",
      },
    ],
    gallery: [
      {
        id: "image_1",
        url: "https://example.com/gallery.jpg",
        alt: "Gallery image",
        caption: "Wedding detail",
      },
    ],
    seoSettings: {
      title: "Old SEO title",
      description: "Old SEO description",
      canonicalUrl: null,
      robotsIndex: true,
      structuredDataOverrides: null,
      ogImageUrl: "https://example.com/legacy-og.jpg",
    },
  };
}

function socialImage(viewModel: ReturnType<typeof createPublicSiteViewModel>) {
  const images = viewModel.metadata.openGraph?.images;
  if (!Array.isArray(images)) return null;
  const first = images[0];
  return typeof first === "string" || first instanceof URL ? String(first) : first?.url;
}

describe("public site view model", () => {
  it("uses customer identity and profile photo for sharing metadata", () => {
    const viewModel = createPublicSiteViewModel({
      site: createRecord(),
      platformBaseUrl: "https://frameid.app",
      platformSocialImageUrl: "https://frameid.app/platform-preview.jpg",
    });

    expect(viewModel.publicUrl).toBe("https://frameid.app/p/ali-ahmed");
    expect(viewModel.hero).toMatchObject({
      imageUrl: "https://example.com/cover.jpg",
      overlay: "strong",
      position: "top",
      height: "tall",
      cta: { label: "تواصل الآن", target: "contact" },
      eyebrow: "قصص حقيقية",
    });
    expect(viewModel.metadata).toMatchObject({
      title: "Ali Ahmed Studio",
      description: "Natural wedding stories in Cairo.",
      alternates: { canonical: "https://frameid.app/p/ali-ahmed" },
      twitter: {
        title: "Ali Ahmed Studio",
        description: "Natural wedding stories in Cairo.",
        images: ["https://example.com/profile.jpg"],
      },
    });
    expect(socialImage(viewModel)).toBe("https://example.com/profile.jpg");
    expect(viewModel.structuredData["@type"]).toBe("LocalBusiness");
    expect(viewModel.contact.whatsapp).toBe("201000000000");
    expect(viewModel.contact.tiktok).toBe("@ali");
    expect(viewModel.contact.workLocation).toBe("متاح للتصوير في جميع المحافظات");
    expect(viewModel.sections.gallery.isVisible).toBe(false);
    expect(viewModel.orderedSections.map((section) => section.type)).toEqual([
      "hero", "packages", "extras", "contact", "gallery"
    ]);
  });

  it("falls back from profile photo to hero image", () => {
    const site = createRecord();
    if (site.contactProfile) site.contactProfile.avatarUrl = null;

    const viewModel = createPublicSiteViewModel({
      site,
      platformBaseUrl: "https://frameid.app",
      platformSocialImageUrl: "https://frameid.app/platform-preview.jpg",
    });

    expect(socialImage(viewModel)).toBe("https://example.com/cover.jpg");
  });

  it("falls back from missing profile and hero images to the platform preview", () => {
    const site = createRecord();
    if (site.contactProfile) {
      site.contactProfile.avatarUrl = null;
      site.contactProfile.coverUrl = null;
    }
    const hero = site.sections.find((section) => section.type === "hero");
    if (hero) delete hero.data.imageUrl;

    const viewModel = createPublicSiteViewModel({
      site,
      platformBaseUrl: "https://frameid.app",
      platformSocialImageUrl: "https://frameid.app/platform-preview.jpg",
    });

    expect(socialImage(viewModel)).toBe("https://frameid.app/platform-preview.jpg");
  });

  it("uses photographer name when studio name is missing", () => {
    const site = createRecord();
    if (site.contactProfile) site.contactProfile.studioName = null;

    const viewModel = createPublicSiteViewModel({
      site,
      platformBaseUrl: "https://frameid.app",
    });

    expect(viewModel.metadata.title).toBe("Ali Ahmed");
  });

  it("keeps legacy public-site copy when old saved content is missing a hero CTA", () => {
    const site = createRecord();
    const hero = site.sections.find((section) => section.type === "hero");
    if (hero) delete hero.data.cta;

    const viewModel = createPublicSiteViewModel({
      site,
      platformBaseUrl: "https://frameid.app",
    });

    expect(viewModel.hero.cta).toEqual({
      label: "شاهد الباقات",
      target: "packages",
    });
  });
});
