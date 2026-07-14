import { describe, expect, it } from "vitest";

import type { CurrentSession } from "@/modules/auth/current-session-service";
import {
  createSiteContentService,
  type SiteContentRepository
} from "@/modules/content/site-content-service";

function createSession(): CurrentSession {
  return {
    user: { id: "user_1", email: "ali@example.com", phone: null, name: "Ali", role: "USER" },
    tenant: {
      id: "tenant_1",
      displayName: "Ali Studio",
      status: "TRIAL",
      trialStartedAt: new Date("2026-07-06T12:00:00.000Z"),
      trialEndsAt: new Date("2026-07-20T12:00:00.000Z"),
      trialDays: 14,
      gracePeriodEndsAt: null
    },
    site: {
      id: "site_1",
      slug: "ali",
      title: "Ali Studio",
      status: "PUBLISHED",
      slugChangeUsed: false
    },
    subscription: {
      id: "subscription_1",
      planId: null,
      plan: null,
      status: "TRIAL",
      currentPeriodStart: new Date("2026-07-06T12:00:00.000Z"),
      currentPeriodEnd: new Date("2026-07-20T12:00:00.000Z"),
      activatedAt: null,
      expiresAt: null
    }
  };
}

function createRepository(): SiteContentRepository & {
  writes: string[];
  upserts: Parameters<SiteContentRepository["upsertSection"]>[0][];
} {
  const writes: string[] = [];
  const upserts: Parameters<SiteContentRepository["upsertSection"]>[0][] = [];

  return {
    writes,
    upserts,
    async findEditorContent() {
      return {
        title: "Ali Studio",
        description: null,
        sections: []
      };
    },
    async upsertSection(input) {
      upserts.push(input);
      writes.push(`${input.siteId}:${input.type}:${input.title}`);
      return { id: `${input.type}_1` };
    },
    async updateSiteBasics(input) {
      writes.push(`site:${input.siteId}:${input.title}`);
    }
  };
}

describe("site content service", () => {
  it("updates hero content for the current user's site", async () => {
    const repository = createRepository();
    const service = createSiteContentService({ repository });

    await expect(
      service.updateHero({
        session: createSession(),
        headline: "New headline",
        subheadline: "New subheadline"
      })
    ).resolves.toEqual({ sectionId: "hero_1" });

    expect(repository.writes).toEqual([
      "site:site_1:New headline",
      "site_1:hero:الرئيسية"
    ]);
  });

  it("rejects empty hero headlines", async () => {
    const repository = createRepository();
    const service = createSiteContentService({ repository });

    await expect(
      service.updateHero({
        session: createSession(),
        headline: " ",
        subheadline: "Fine art"
      })
    ).rejects.toThrow("Hero headline is required");

    expect(repository.writes).toEqual([]);
  });

  it("updates contact call to action", async () => {
    const repository = createRepository();
    const service = createSiteContentService({ repository });

    await expect(
      service.updateContact({
        session: createSession(),
        callToAction: "Book now"
      })
    ).resolves.toEqual({ sectionId: "contact_1" });

    expect(repository.writes).toEqual(["site_1:contact:التواصل"]);
  });

  it("loads saved editor content for dashboard forms", async () => {
    const repository = createRepository();
    repository.findEditorContent = async () => ({
      title: "Ali Studio",
      description: "Fine art wedding photography",
      sections: [
        {
          type: "hero",
          title: "الرئيسية",
          sortOrder: 0,
          isVisible: true,
          data: {
            headline: "Ali Ahmed",
            subheadline: "Luxury weddings",
            imageUrl: "https://example.com/hero.jpg"
          }
        },
        {
          type: "contact",
          title: "التواصل",
          sortOrder: 4,
          isVisible: true,
          data: {
            callToAction: "Book now"
          }
        }
      ]
    });

    const service = createSiteContentService({ repository });
    await expect(service.getEditorContent({ session: createSession() })).resolves.toEqual({
      title: "Ali Studio",
      description: "Fine art wedding photography",
      hero: {
        headline: "Ali Ahmed",
        subheadline: "Luxury weddings",
        imageUrl: "https://example.com/hero.jpg"
      },
      contact: {
        callToAction: "Book now"
      },
      sections: expect.arrayContaining([
        expect.objectContaining({ type: "hero", sortOrder: 0, isVisible: true }),
        expect.objectContaining({ type: "contact", sortOrder: 4, isVisible: true })
      ])
    });
  });

  it("updates any platform section while preserving unknown data and settings", async () => {
    const repository = createRepository();
    repository.findEditorContent = async () => ({
      title: "Ali Studio",
      description: "Fine art",
      sections: [
        {
          type: "hero",
          title: "واجهة خاصة",
          sortOrder: 0,
          isVisible: true,
          data: {
            headline: "Old headline",
            legacyKey: "preserve-me",
            settings: { eyebrow: "قديم", legacySetting: "keep-me" }
          }
        }
      ]
    });
    const service = createSiteContentService({ repository });

    await expect(
      service.updateSection({
        session: createSession(),
        type: "hero",
        title: "البداية",
        sortOrder: 3,
        isVisible: false,
        data: {
          headline: "New headline",
          subheadline: "New subheadline",
          overlay: "strong",
          position: "top",
          height: "tall",
          cta: { label: "تواصل الآن", target: "contact" },
          settings: { eyebrow: "قصص حقيقية" }
        }
      })
    ).resolves.toEqual({ sectionId: "hero_1" });

    expect(repository.upserts.at(-1)).toEqual({
      siteId: "site_1",
      type: "hero",
      title: "البداية",
      sortOrder: 3,
      isVisible: false,
      data: {
        headline: "New headline",
        subheadline: "New subheadline",
        overlay: "strong",
        position: "top",
        height: "tall",
        cta: { label: "تواصل الآن", target: "contact" },
        legacyKey: "preserve-me",
        settings: {
          eyebrow: "قصص حقيقية",
          legacySetting: "keep-me"
        }
      }
    });
  });

  it("rejects section types outside the platform contract", async () => {
    const repository = createRepository();
    const service = createSiteContentService({ repository });

    await expect(
      service.updateSection({
        session: createSession(),
        type: "map" as "hero",
        title: "خريطة",
        sortOrder: 9,
        isVisible: true,
        data: {}
      })
    ).rejects.toThrow("Unsupported template section type");

    expect(repository.upserts).toEqual([]);
  });
});
