import { describe, expect, it } from "vitest";

import { createDashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import type { CurrentSession } from "@/modules/auth/current-session-service";

function createSession(status: "DRAFT" | "PUBLISHED" = "PUBLISHED"): CurrentSession {
  return {
    user: {
      id: "user_1",
      email: "ali@example.com",
      name: "Ali Ahmed",
      role: "USER"
    },
    tenant: {
      id: "tenant_1",
      displayName: "Ali Ahmed Studio",
      status: "TRIAL",
      trialEndsAt: new Date("2026-07-20T12:00:00.000Z")
    },
    site: {
      id: "site_1",
      slug: "ali-ahmed",
      title: "Ali Ahmed",
      status,
      slugChangeUsed: false
    },
    subscription: {
      id: "subscription_1",
      status: "TRIAL",
      currentPeriodEnd: new Date("2026-07-20T12:00:00.000Z")
    }
  };
}

describe("dashboard view model", () => {
  it("creates the photographer command center from session-owned data", () => {
    const viewModel = createDashboardViewModel({
      session: createSession(),
      platformBaseUrl: "https://frameid.app",
      now: new Date("2026-07-06T12:00:00.000Z"),
      packagesCount: 3,
      imagesCount: 15,
      albumsCount: 2,
      hasContactInfo: true,
      hasCoverImage: true,
      currentThemeName: "Rose Blush",
      lastModifiedAt: new Date("2026-07-06T10:00:00.000Z"),
    });

    expect(viewModel.siteUrl).toBe("https://frameid.app/p/ali-ahmed");
    expect(viewModel.statusLabel).toBe("منشور");
    expect(viewModel.photographerName).toBe("Ali Ahmed Studio");
    expect(viewModel.percent).toBe(100);
    expect(viewModel.checklist).toHaveLength(7);
    expect(viewModel.stats).toEqual([
      { label: "الصور", value: "15", tone: "success" },
      { label: "الألبومات", value: "2", tone: "success" },
      { label: "الباقات", value: "3", tone: "success" },
      { label: "القوالب", value: "Rose Blush", tone: "success" },
    ]);
    expect(viewModel.currentTheme).toBe("Rose Blush");
    expect(viewModel.isPublished).toBe(true);
    expect(viewModel.nextStepLabel).toBe("تم النشر ✓");
    expect(viewModel.nextStepTitle).toBe("انشر وشارك الرابط");
    expect(viewModel.nextStepDescription).toBe("انسخ الرابط أو شاركه بعد التأكد من العنوان والمعاينات.");
  });

  it("shows empty state for new sites", () => {
    const viewModel = createDashboardViewModel({
      session: createSession("DRAFT"),
      platformBaseUrl: "https://frameid.app",
      now: new Date("2026-07-06T12:00:00.000Z"),
      packagesCount: 0,
      imagesCount: 0,
      albumsCount: 0,
      hasContactInfo: false,
      hasCoverImage: false,
      currentThemeName: "بدون",
      lastModifiedAt: new Date(),
    });

    expect(viewModel.percent).toBe(0);
    expect(viewModel.currentTheme).toBe("بدون");
    expect(viewModel.stats[0]).toEqual({ label: "الصور", value: "0", tone: "neutral" });
    expect(viewModel.nextStepLabel).toBe("إكمال بيانات التواصل");
    expect(viewModel.nextStepTitle).toBe("أكمل بيانات التواصل");
    expect(viewModel.nextStepDescription).toBe("أضف الهاتف وواتساب والمدينة حتى يعرف العميل كيف يحجز معك.");
  });

  it("calculates completion correctly", () => {
    const session = createSession("DRAFT");

    // 4 out of 7 items done
    const viewModel = createDashboardViewModel({
      session,
      platformBaseUrl: "https://frameid.app",
      now: new Date(),
      packagesCount: 1,
      imagesCount: 5,
      albumsCount: 2,
      hasContactInfo: false,
      hasCoverImage: true,
      currentThemeName: "Rose Blush",
      lastModifiedAt: new Date(),
    });

    expect(viewModel.percent).toBe(57);
    expect(viewModel.checklist.filter((i) => i.done)).toHaveLength(4);
  });
});
