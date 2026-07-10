import { describe, expect, it } from "vitest";

import type { CurrentSession } from "@/modules/auth/current-session-service";
import {
  createSiteThemeSelectionService,
  type SiteThemeSelectionRepository
} from "@/modules/themes/site-theme-selection-service";

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

function createRepository(): SiteThemeSelectionRepository & { writes: string[] } {
  const writes: string[] = [];

  return {
    writes,
    async applyTemplate(input) {
      writes.push(`${input.siteId}:${input.theme.code}:${input.template.code}`);
    }
  };
}

describe("site theme selection service", () => {
  it("applies a published template to the current user's site", async () => {
    const repository = createRepository();
    const service = createSiteThemeSelectionService({ repository });

    await expect(
      service.selectTemplate({
        session: createSession(),
        templateCode: "noir-gold"
      })
    ).resolves.toEqual({
      themeCode: "noir-gold",
      templateCode: "noir-gold"
    });

    expect(repository.writes).toEqual(["site_1:noir-gold:noir-gold"]);
  });

  it("rejects unavailable templates before touching the site", async () => {
    const repository = createRepository();
    const service = createSiteThemeSelectionService({ repository });

    await expect(
      service.selectTemplate({
        session: createSession(),
        templateCode: "missing-template"
      })
    ).rejects.toThrow("Selected template is not available");

    expect(repository.writes).toEqual([]);
  });
});
