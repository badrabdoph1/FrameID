import { describe, expect, it } from "vitest";

import { createDashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import type { CurrentSession } from "@/modules/auth/current-session-service";

function createSession(): CurrentSession {
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

describe("dashboard view model", () => {
  it("creates the photographer command center from session-owned data", () => {
    const viewModel = createDashboardViewModel({
      session: createSession(),
      platformBaseUrl: "https://frameid.app",
      now: new Date("2026-07-06T12:00:00.000Z")
    });

    expect(viewModel.siteUrl).toBe("https://frameid.app/p/ali-ahmed");
    expect(viewModel.statusLabel).toBe("Trial");
    expect(viewModel.widgets).toEqual([
      {
        label: "حالة الموقع",
        value: "Published",
        tone: "success"
      },
      {
        label: "حالة الاشتراك",
        value: "Trial",
        tone: "warning"
      },
      {
        label: "الأيام المتبقية",
        value: "14",
        tone: "warning"
      }
    ]);
    expect(viewModel.controlAreas.map((area) => area.label)).toEqual([
      "بيانات الموقع",
      "المعرض",
      "الباقات والخدمات",
      "SEO والتواصل",
      "القالب",
      "التفعيل"
    ]);
    expect(viewModel.controlAreas[0]).toEqual({
      label: "بيانات الموقع",
      href: "/dashboard/content",
      description: "العنوان، الوصف، وصورة الغلاف."
    });
  });
});
