import { describe, expect, it } from "vitest";

import type { CurrentSession } from "@/modules/auth/current-session-service";
import {
  createSiteContentService,
  type SiteContentRepository
} from "@/modules/content/site-content-service";

function createSession(): CurrentSession {
  return {
    user: { id: "user_1", email: "ali@example.com", name: "Ali", role: "USER" },
    tenant: {
      id: "tenant_1",
      displayName: "Ali Studio",
      status: "TRIAL",
      trialEndsAt: new Date("2026-07-20T12:00:00.000Z")
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
      status: "TRIAL",
      currentPeriodEnd: new Date("2026-07-20T12:00:00.000Z")
    }
  };
}

function createRepository(): SiteContentRepository & { writes: string[] } {
  const writes: string[] = [];

  return {
    writes,
    async upsertSection(input) {
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
});
