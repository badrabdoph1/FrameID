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
      { label: "إيراد الشهر", value: "450,000 جنيه", tone: "success" }
    ]);
    expect(overview.primaryAction).toEqual({
      label: "راجع 5 مدفوعات معلقة",
      href: "/admin/payments",
      tone: "danger",
      description: "طلبات الدفع هي أسرع نقطة تؤثر على الإيراد وتفعيل العملاء."
    });
    expect(overview.healthItems).toEqual([
      { label: "المدفوعات", status: "needs-attention", value: "5 معلقة" },
      { label: "التجارب", status: "watch", value: "9 تنتهي قريباً" },
      { label: "المواقع المنشورة", status: "healthy", value: "120 موقع" }
    ]);
  });

  it("prioritizes trials when there are no pending payments", () => {
    const overview = createAdminOverviewViewModel({
      newUsersToday: 3,
      activeTrials: 11,
      expiringTrials: 4,
      pendingPayments: 0,
      activeSites: 18,
      monthlyRevenue: 0,
      currency: "EGP"
    });

    expect(overview.primaryAction).toEqual({
      label: "تابع 4 تجارب تنتهي قريباً",
      href: "/admin/customers",
      tone: "warning",
      description: "التجارب القريبة من الانتهاء تحتاج متابعة قبل أن تتحول إلى فقدان عميل."
    });
  });

  it("falls back to platform growth when no urgent work exists", () => {
    const overview = createAdminOverviewViewModel({
      newUsersToday: 1,
      activeTrials: 2,
      expiringTrials: 0,
      pendingPayments: 0,
      activeSites: 8,
      monthlyRevenue: 12000,
      currency: "EGP"
    });

    expect(overview.primaryAction).toEqual({
      label: "راجع نمو المنصة",
      href: "/admin/analytics",
      tone: "success",
      description: "لا توجد عمليات عاجلة الآن. راجع النمو والاستخدام وحدد فرصة التحسين التالية."
    });
  });
});
