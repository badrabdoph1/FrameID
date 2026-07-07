import type { BadgeProps } from "@/components/ui/badge";
import type { CurrentSession } from "@/modules/auth/current-session-service";

type DashboardWidget = {
  label: string;
  value: string;
  tone: BadgeProps["tone"];
};

type DashboardControlArea = {
  label: string;
  href: string;
  description: string;
};

export type DashboardViewModel = {
  photographerName: string;
  siteTitle: string;
  siteSlug: string;
  siteUrl: string;
  statusLabel: string;
  slugChangeUsed: boolean;
  widgets: DashboardWidget[];
  controlAreas: DashboardControlArea[];
};

export function createDashboardViewModel({
  session,
  platformBaseUrl,
  now
}: {
  session: CurrentSession;
  platformBaseUrl: string;
  now: Date;
}): DashboardViewModel {
  const subscriptionStatus = formatStatus(session.subscription?.status ?? "TRIAL");

  return {
    photographerName: session.tenant.displayName,
    siteTitle: session.site.title,
    siteSlug: session.site.slug,
    siteUrl: `${platformBaseUrl.replace(/\/$/u, "")}/p/${session.site.slug}`,
    statusLabel: subscriptionStatus,
    slugChangeUsed: session.site.slugChangeUsed,
    widgets: [
      {
        label: "حالة الموقع",
        value: formatStatus(session.site.status),
        tone: statusTone(session.site.status)
      },
      {
        label: "حالة الاشتراك",
        value: subscriptionStatus,
        tone: statusTone(session.subscription?.status ?? "TRIAL")
      },
      {
        label: "الأيام المتبقية",
        value: String(daysRemaining(session.tenant.trialEndsAt, now)),
        tone: "warning"
      }
    ],
    controlAreas: [
      {
        label: "بيانات الموقع",
        href: "/dashboard/content",
        description: "العنوان، الوصف، وصورة الغلاف."
      },
      {
        label: "المعرض",
        href: "/dashboard/gallery",
        description: "رفع الصور وإدارة الأعمال المعروضة."
      },
      {
        label: "الباقات والخدمات",
        href: "/dashboard/services",
        description: "أسعار التصوير والخدمات الإضافية."
      },
      {
        label: "SEO والتواصل",
        href: "/dashboard/settings",
        description: "بيانات البحث والرابط وطرق التواصل."
      },
      {
        label: "القالب",
        href: "/dashboard/design",
        description: "تغيير القالب وإعدادات الشكل."
      },
      {
        label: "التفعيل",
        href: "/dashboard/billing",
        description: "متابعة التجربة ورفع إثبات الدفع."
      }
    ]
  };
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: string): BadgeProps["tone"] {
  if (status === "ACTIVE" || status === "PUBLISHED") {
    return "success";
  }

  if (status === "TRIAL" || status === "PAST_DUE") {
    return "warning";
  }

  return "neutral";
}

function daysRemaining(targetDate: Date, now: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const diff = targetDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / millisecondsPerDay));
}
