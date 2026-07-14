import type { BadgeProps } from "@/components/ui/badge";

export type AdminOverviewMetrics = {
  newUsersToday: number;
  activeTrials: number;
  expiringTrials: number;
  pendingPayments: number;
  activeSites: number;
  monthlyRevenue: number;
  currency: string;
  totalCustomers?: number;
  activeSubscribers?: number;
  expiringSubscriptions?: number;
  expiredCustomers?: number;
  noRenewalCustomers?: number;
  needsFollowUp?: number;
  newIssues?: number;
  issuesInReview?: number;
};

export type AdminOverviewWidget = {
  id: string;
  label: string;
  value: string;
  tone: BadgeProps["tone"];
  href: string;
};

export type AdminPrimaryAction = {
  label: string;
  href?: string;
  tone: "danger" | "warning" | "success";
  description: string;
};

export type AdminWorkQueueItem = {
  id: string;
  label: string;
  value: number;
  href: string;
  tone: "danger" | "warning" | "neutral";
};

export type AdminHealthItem = {
  label: string;
  status: "healthy" | "watch" | "needs-attention";
  value: string;
};

export type AdminCommandCenterViewModel = {
  priority: AdminPrimaryAction;
  metrics: AdminOverviewWidget[];
  workQueue: AdminWorkQueueItem[];
  platformStatus: AdminHealthItem[];
  /** @deprecated استخدم metrics. محفوظ مؤقتًا لتوافق المستهلكين القدامى. */
  widgets: AdminOverviewWidget[];
  /** @deprecated استخدم priority. */
  primaryAction: AdminPrimaryAction;
  /** @deprecated استخدم platformStatus. */
  healthItems: AdminHealthItem[];
};

export function createAdminOverviewViewModel(metrics: AdminOverviewMetrics): AdminCommandCenterViewModel {
  const priority = createPriority(metrics);
  const metricCards: AdminOverviewWidget[] = [
    {
      id: "customers",
      label: "كل العملاء",
      value: formatNumber(metrics.totalCustomers ?? metrics.newUsersToday),
      tone: "neutral",
      href: "/admin/customers",
    },
    {
      id: "subscribers",
      label: "الاشتراكات النشطة",
      value: formatNumber(metrics.activeSubscribers ?? metrics.activeTrials),
      tone: "success",
      href: "/admin/customers?filter=subscribed",
    },
    {
      id: "payments",
      label: "طلبات دفع معلقة",
      value: formatNumber(metrics.pendingPayments),
      tone: metrics.pendingPayments > 0 ? "danger" : "neutral",
      href: "/admin/payments?status=pending",
    },
    {
      id: "revenue",
      label: "إيراد الشهر",
      value: `${formatNumber(metrics.monthlyRevenue)} ${formatCurrencyLabel(metrics.currency)}`,
      tone: "success",
      href: "/admin/payments?status=approved",
    },
  ];

  const workQueueCandidates: AdminWorkQueueItem[] = [
    {
      id: "payments",
      label: "طلبات دفع تنتظر المراجعة",
      value: metrics.pendingPayments,
      href: "/admin/payments?status=pending",
      tone: "danger",
    },
    {
      id: "issues",
      label: "بلاغات عملاء جديدة",
      value: metrics.newIssues ?? 0,
      href: "/admin/errors?status=new",
      tone: "danger",
    },
    {
      id: "expiring-subscriptions",
      label: "اشتراكات تنتهي خلال أسبوع",
      value: metrics.expiringSubscriptions ?? 0,
      href: "/admin/customers?filter=expiring7",
      tone: "warning",
    },
    {
      id: "expiring-trials",
      label: "تجارب تنتهي خلال أسبوع",
      value: metrics.expiringTrials,
      href: "/admin/customers?filter=expiring7",
      tone: "warning",
    },
    {
      id: "follow-up",
      label: "عملاء يحتاجون متابعة",
      value: metrics.needsFollowUp ?? 0,
      href: "/admin/customers?filter=pendingPayment",
      tone: "neutral",
    },
  ];
  const workQueue = workQueueCandidates.filter((item) => item.value > 0);

  const platformStatus: AdminHealthItem[] = [
    {
      label: "المدفوعات",
      status: metrics.pendingPayments > 0 ? "needs-attention" : "healthy",
      value: metrics.pendingPayments > 0 ? `${formatNumber(metrics.pendingPayments)} معلقة` : "لا توجد معلقة",
    },
    {
      label: "التجارب",
      status: metrics.expiringTrials > 0 ? "watch" : "healthy",
      value: metrics.expiringTrials > 0 ? `${formatNumber(metrics.expiringTrials)} تنتهي قريبًا` : "مستقرة",
    },
    {
      label: "المواقع المنشورة",
      status: "healthy",
      value: `${formatNumber(metrics.activeSites)} موقع`,
    },
  ];

  return {
    priority,
    metrics: metricCards,
    workQueue,
    platformStatus,
    widgets: metricCards,
    primaryAction: priority,
    healthItems: platformStatus,
  };
}

function createPriority(metrics: AdminOverviewMetrics): AdminPrimaryAction {
  if (metrics.pendingPayments > 0) {
    return {
      label: `راجع ${formatNumber(metrics.pendingPayments)} طلبات دفع معلقة`,
      href: "/admin/payments?status=pending",
      tone: "danger",
      description: "ابدأ بها لتسريع تفعيل العملاء وتحصيل الإيراد.",
    };
  }

  if ((metrics.newIssues ?? 0) > 0) {
    return {
      label: `راجع ${formatNumber(metrics.newIssues ?? 0)} بلاغات عملاء جديدة`,
      href: "/admin/errors?status=new",
      tone: "danger",
      description: "راجع البلاغات الجديدة وحدد المسؤول والخطوة التالية.",
    };
  }

  const expiring = metrics.expiringTrials + (metrics.expiringSubscriptions ?? 0);
  if (expiring > 0) {
    return {
      label: `تابع ${formatNumber(expiring)} حسابات تنتهي قريبًا`,
      href: "/admin/customers?filter=expiring7",
      tone: "warning",
      description: "تابع هذه الحسابات قبل انتهاء التجربة أو الاشتراك.",
    };
  }

  return {
    label: "لا توجد مهام عاجلة الآن",
    tone: "success",
    description: "كل المؤشرات العاجلة هادئة. يمكنك متابعة بقية قوائم العمل بالأسفل.",
  };
}

function formatCurrencyLabel(currency: string): string {
  return currency === "EGP" ? "جنيه" : currency;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value);
}
