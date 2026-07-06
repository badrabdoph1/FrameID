import { describe, expect, it } from "vitest";

import { createAdminOverviewViewModel } from "@/modules/admin/admin-overview-view-model";

describe("admin overview view model", () => {
  it("creates command-center widgets from platform metrics", () => {
    const overview = createAdminOverviewViewModel({
      newUsersToday: 12,
      activeTrials: 80,
      expiringTrials: 9,
      pendingPayments: 5,
      activeSites: 120,
      monthlyRevenue: 450000,
      currency: "EGP"
    });

    expect(overview.widgets).toEqual([
      { label: "مستخدمون جدد اليوم", value: "12", tone: "neutral" },
      { label: "تجارب نشطة", value: "80", tone: "warning" },
      { label: "تجارب تنتهي قريبًا", value: "9", tone: "warning" },
      { label: "طلبات دفع معلقة", value: "5", tone: "danger" },
      { label: "مواقع فعالة", value: "120", tone: "success" },
      { label: "إيراد الشهر", value: "450,000 EGP", tone: "success" }
    ]);
  });
});
