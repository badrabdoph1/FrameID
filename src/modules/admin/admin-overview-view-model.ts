import type { BadgeProps } from "@/components/ui/badge";

export type AdminOverviewMetrics = {
  newUsersToday: number;
  activeTrials: number;
  expiringTrials: number;
  pendingPayments: number;
  activeSites: number;
  monthlyRevenue: number;
  currency: string;
};

export type AdminOverviewWidget = {
  label: string;
  value: string;
  tone: BadgeProps["tone"];
};

export function createAdminOverviewViewModel(metrics: AdminOverviewMetrics): {
  widgets: AdminOverviewWidget[];
} {
  return {
    widgets: [
      {
        label: "مستخدمون جدد اليوم",
        value: String(metrics.newUsersToday),
        tone: "neutral"
      },
      {
        label: "تجارب نشطة",
        value: String(metrics.activeTrials),
        tone: "warning"
      },
      {
        label: "تجارب تنتهي قريبًا",
        value: String(metrics.expiringTrials),
        tone: "warning"
      },
      {
        label: "طلبات دفع معلقة",
        value: String(metrics.pendingPayments),
        tone: "danger"
      },
      {
        label: "مواقع فعالة",
        value: String(metrics.activeSites),
        tone: "success"
      },
      {
        label: "إيراد الشهر",
        value: `${formatNumber(metrics.monthlyRevenue)} ${formatCurrencyLabel(metrics.currency)}`,
        tone: "success"
      }
    ]
  };
}

function formatCurrencyLabel(currency: string): string {
  return currency === "EGP" ? "جنيه" : currency;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}
