import { describe, expect, it } from "vitest";

import {
  createSiteSlugService,
  type SiteSlugRepository
} from "@/modules/sites/site-slug-service";
import type { CurrentSession } from "@/modules/auth/current-session-service";

function createSession(slugChangeUsed = false): CurrentSession {
  return {
    user: {
      id: "user_1",
      email: "ali@example.com",
      phone: null,
      name: "Ali Ahmed",
      role: "USER"
    },
    tenant: {
      id: "tenant_1",
      displayName: "Ali Ahmed",
      status: "TRIAL",
      trialStartedAt: new Date("2026-07-06T12:00:00.000Z"),
      trialEndsAt: new Date("2026-07-20T12:00:00.000Z"),
      trialDays: 14,
      gracePeriodEndsAt: null
    },
    site: {
      id: "site_1",
      slug: "ali-ahmed",
      title: "Ali Ahmed",
      status: "PUBLISHED",
      slugChangeUsed,
      templateChangeUsed: false,
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

function createRepository(unavailableSlugs: string[] = []): SiteSlugRepository & {
  updates: string[];
} {
  const updates: string[] = [];

  return {
    updates,
    async isSlugUnavailable(slug, currentSiteId) {
      return unavailableSlugs.includes(`${currentSiteId}:${slug}`);
    },
    async updateSiteSlug(input) {
      updates.push(`${input.siteId}:${input.slug}`);
      return true;
    }
  };
}

describe("site slug service", () => {
  it("reports slug availability with normalized values", async () => {
    const repository = createRepository(["site_1:ali-photo"]);
    const service = createSiteSlugService({ repository });

    await expect(service.checkAvailability("Ali Photo", "site_1")).resolves.toEqual({
      ok: false,
      normalizedSlug: "ali-photo",
      reason: "taken"
    });
    await expect(service.checkAvailability("New Studio", "site_1")).resolves.toEqual({
      ok: true,
      normalizedSlug: "new-studio"
    });
  });

  it("changes the slug once and marks the change as used", async () => {
    const repository = createRepository();
    const service = createSiteSlugService({ repository });

    await expect(
      service.changeSlug({
        session: createSession(),
        requestedSlug: "New Studio"
      })
    ).resolves.toEqual({
      slug: "new-studio"
    });
    expect(repository.updates).toEqual(["site_1:new-studio"]);
  });

  it("rejects slug changes after the one-time change was used", async () => {
    const repository = createRepository();
    const service = createSiteSlugService({ repository });

    await expect(
      service.changeSlug({
        session: createSession(true),
        requestedSlug: "new-studio"
      })
    ).rejects.toThrow("Site slug change was already used");
    expect(repository.updates).toEqual([]);
  });
});
