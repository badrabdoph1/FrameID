import { describe, expect, it } from "vitest";

import { createAdminOverviewViewModel } from "@/modules/admin/admin-overview-view-model";

describe("admin overview view model", () => {
  it("creates linked command-center metrics from platform data", () => {
    const overview = createAdminOverviewViewModel({
      newUsersToday: 12,
      activeTrials: 80,
      expiringTrials: 9,
      pendingPayments: 5,
      activeSites: 120,
      monthlyRevenue: 450000,
      currency: "EGP",
      totalCustomers: 240,
      activeSubscribers: 90,
      newIssues: 3,
    });

    expect(overview.metrics).toEqual([
      { id: "customers", label: "كل العملاء", value: "٢٤٠", tone: "neutral", href: "/admin/customers" },
      { id: "subscribers", label: "الاشتراكات النشطة", value: "٩٠", tone: "success", href: "/admin/customers?filter=subscribed" },
      { id: "payments", label: "طلبات دفع معلقة", value: "٥", tone: "danger", href: "/admin/payments?status=pending" },
      { id: "revenue", label: "إيراد الشهر", value: "٤٥٠٬٠٠٠ جنيه", tone: "success", href: "/admin/payments?status=approved" },
    ]);
    expect(overview.priority).toEqual({
      label: "راجع ٥ طلبات دفع معلقة",
      href: "/admin/payments?status=pending",
      tone: "danger",
      description: "ابدأ بها لتسريع تفعيل العملاء وتحصيل الإيراد.",
    });
    expect(overview.workQueue.map((item) => item.id)).toEqual(["payments", "issues", "expiring-trials"]);
  });

  it("prioritizes customer issues before expiring accounts", () => {
    const overview = createAdminOverviewViewModel({
      newUsersToday: 3,
      activeTrials: 11,
      expiringTrials: 4,
      pendingPayments: 0,
      activeSites: 18,
      monthlyRevenue: 0,
      currency: "EGP",
      newIssues: 2,
    });

    expect(overview.priority).toEqual({
      label: "راجع ٢ بلاغات عملاء جديدة",
      href: "/admin/errors?status=new",
      tone: "danger",
      description: "راجع البلاغات الجديدة وحدد المسؤول والخطوة التالية.",
    });
  });

  it("links expiring accounts to their filtered customer list", () => {
    const overview = createAdminOverviewViewModel({
      newUsersToday: 3,
      activeTrials: 11,
      expiringTrials: 4,
      expiringSubscriptions: 2,
      pendingPayments: 0,
      activeSites: 18,
      monthlyRevenue: 0,
      currency: "EGP",
    });

    expect(overview.priority).toEqual({
      label: "تابع ٦ حسابات تنتهي قريبًا",
      href: "/admin/customers?filter=expiring7",
      tone: "warning",
      description: "تابع هذه الحسابات قبل انتهاء التجربة أو الاشتراك.",
    });
  });

  it("returns a non-clickable calm state when no urgent work exists", () => {
    const overview = createAdminOverviewViewModel({
      newUsersToday: 1,
      activeTrials: 2,
      expiringTrials: 0,
      pendingPayments: 0,
      activeSites: 8,
      monthlyRevenue: 12000,
      currency: "EGP",
    });

    expect(overview.priority).toEqual({
      label: "لا توجد مهام عاجلة الآن",
      tone: "success",
      description: "كل المؤشرات العاجلة هادئة. يمكنك متابعة بقية قوائم العمل بالأسفل.",
    });
    expect(overview.workQueue).toEqual([]);
  });
});
