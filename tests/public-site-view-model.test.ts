import { describe, expect, it } from "vitest";

import {
  createPublicSiteViewModel,
  type PublicSiteRecord
} from "@/modules/public-sites/public-site-view-model";

function createRecord(): PublicSiteRecord {
  return {
    id: "site_1",
    slug: "ali-ahmed",
    title: "Ali Ahmed Studio",
    description: "Fine wedding photography in Cairo.",
    status: "PUBLISHED",
    isPublished: true,
    theme: {
      code: "noir-gold",
      name: "Noir Gold"
    },
    tenant: {
      displayName: "Ali Ahmed"
    },
    contactProfile: {
      phone: "01000000000",
      whatsapp: "201000000000",
      email: "ali@example.com",
      instagram: "ali",
      facebook: "ali"
    },
    sections: [
      {
        type: "hero",
        title: "Home",
        sortOrder: 0,
        data: {
          headline: "Ali Ahmed Studio",
          subheadline: "Elegant wedding photography.",
          imageUrl: "https://example.com/hero.jpg"
        }
      },
      {
        type: "contact",
        title: "Contact",
        sortOrder: 10,
        data: {
          callToAction: "Book on WhatsApp"
        }
      }
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
        isHighlighted: true
      }
    ],
    extras: [
      {
        id: "extra_1",
        name: "ألبوم فاخر",
        priceAmount: 15000,
        currency: "EGP",
        iconKey: "album"
      }
    ],
    gallery: [
      {
        id: "image_1",
        url: "https://example.com/gallery.jpg",
        alt: "Gallery image",
        caption: "Wedding detail"
      }
    ],
    seoSettings: {
      title: "Ali Ahmed Studio",
      description: "Fine wedding photography in Cairo.",
      canonicalUrl: null,
      robotsIndex: true,
      structuredDataOverrides: null,
      ogImageUrl: null
    }
  };
}

describe("public site view model", () => {
  it("builds renderable theme data and SEO metadata from site records", () => {
    const viewModel = createPublicSiteViewModel({
      site: createRecord(),
      platformBaseUrl: "https://frameid.app"
    });

    expect(viewModel.publicUrl).toBe("https://frameid.app/p/ali-ahmed");
    expect(viewModel.themeCode).toBe("noir-gold");
    expect(viewModel.hero).toEqual({
      headline: "Ali Ahmed Studio",
      subheadline: "Elegant wedding photography.",
      imageUrl: "https://example.com/hero.jpg"
    });
    expect(viewModel.packages[0]).toMatchObject({
      name: "Wedding Story",
      price: "120,000 EGP"
    });
    expect(viewModel.extras[0]).toMatchObject({
      name: "ألبوم فاخر",
      price: "15,000 EGP",
      priceAmount: 15000
    });
    expect(viewModel.gallery[0]).toMatchObject({
      url: "https://example.com/gallery.jpg"
    });
    expect(viewModel.metadata).toMatchObject({
      title: "Ali Ahmed Studio",
      description: "Fine wedding photography in Cairo.",
      alternates: {
        canonical: "https://frameid.app/p/ali-ahmed"
      }
    });
    expect(viewModel.structuredData["@type"]).toBe("LocalBusiness");
    expect(viewModel.contact.whatsapp).toBe("201000000000");
  });
});
