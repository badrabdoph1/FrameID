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

export type AdminPrimaryAction = {
  label: string;
  href: string;
  tone: "danger" | "warning" | "success";
  description: string;
};

export type AdminHealthItem = {
  label: string;
  status: "healthy" | "watch" | "needs-attention";
  value: string;
};

export function createAdminOverviewViewModel(metrics: AdminOverviewMetrics): {
  widgets: AdminOverviewWidget[];
  primaryAction: AdminPrimaryAction;
  healthItems: AdminHealthItem[];
} {
  return {
    primaryAction: createPrimaryAction(metrics),
    healthItems: [
      {
        label: "المدفوعات",
        status: metrics.pendingPayments > 0 ? "needs-attention" : "healthy",
        value: metrics.pendingPayments > 0 ? `${metrics.pendingPayments} معلقة` : "لا توجد معلقة"
      },
      {
        label: "التجارب",
        status: metrics.expiringTrials > 0 ? "watch" : "healthy",
        value: metrics.expiringTrials > 0 ? `${metrics.expiringTrials} تنتهي قريباً` : "مستقرة"
      },
      {
        label: "المواقع المنشورة",
        status: "healthy",
        value: `${metrics.activeSites} موقع`
      }
    ],
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

function createPrimaryAction(metrics: AdminOverviewMetrics): AdminPrimaryAction {
  if (metrics.pendingPayments > 0) {
    return {
      label: `راجع ${metrics.pendingPayments} مدفوعات معلقة`,
      href: "/admin/payments",
      tone: "danger",
      description: "طلبات الدفع هي أسرع نقطة تؤثر على الإيراد وتفعيل العملاء."
    };
  }

  if (metrics.expiringTrials > 0) {
    return {
      label: `تابع ${metrics.expiringTrials} تجارب تنتهي قريباً`,
      href: "/admin/customers",
      tone: "warning",
      description: "التجارب القريبة من الانتهاء تحتاج متابعة قبل أن تتحول إلى فقدان عميل."
    };
  }

  return {
    label: "راجع نمو المنصة",
    href: "/admin/analytics",
    tone: "success",
    description: "لا توجد عمليات عاجلة الآن. راجع النمو والاستخدام وحدد فرصة التحسين التالية."
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
