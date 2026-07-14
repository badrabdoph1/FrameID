import {
  CreditCard,
  Globe2,
  Images,
  LayoutDashboard,
  Package,
  Palette,
  Phone,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type PageTip = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentColor: string;
  glowColor: string;
  targetSelector?: string;
};

export const dashboardTips: Record<string, PageTip> = {
  "/dashboard": {
    id: "dashboard-home",
    title: "من هنا هتتابع موقعك كله",
    description: "تشوف إيه ناقص، وتوصل لكل حاجة بسرعة. كل خطوات التجهيز قدامك.",
    icon: LayoutDashboard,
    accentColor: "#f3cf73",
    glowColor: "rgba(243,207,115,0.25)",
    targetSelector: "[data-smart-tip='checklist']",
  },
  "/dashboard/services": {
    id: "dashboard-services",
    title: "الباقات أول حاجة العميل بيبص عليها",
    description: "ظبط أسعارك وعروضك كويس… العميل بيقرر من هنا.",
    icon: Package,
    accentColor: "#a855f7",
    glowColor: "rgba(168,85,247,0.25)",
    targetSelector: "[data-smart-tip='packages-list']",
  },
  "/dashboard/site-info": {
    id: "dashboard-site-info",
    title: "كل ما العميل يوصلك بسهولة… فرص الحجز بتزيد",
    description: "حط رقمك، واتسابك، وروابطك… خلي التواصل أسهل حاجة.",
    icon: Phone,
    accentColor: "#34d399",
    glowColor: "rgba(52,211,153,0.25)",
    targetSelector: "[data-smart-tip='contact-form']",
  },
  "/dashboard/gallery": {
    id: "dashboard-gallery",
    title: "خلي شغلك يتكلم عنك",
    description: "ارفع أفضل صورك… العميل بيحكم عليك من أول صورة.",
    icon: Images,
    accentColor: "#60a5fa",
    glowColor: "rgba(96,165,250,0.25)",
    targetSelector: "[data-smart-tip='gallery-grid']",
  },
  "/dashboard/publish": {
    id: "dashboard-publish",
    title: "راجع موقعك مرة أخيرة… وبعدها شاركه",
    description: "تأكد إن كل حاجة تمام… وبعدها ابعت الرابط لأي عميل.",
    icon: Globe2,
    accentColor: "#f472b6",
    glowColor: "rgba(244,114,182,0.25)",
    targetSelector: "[data-smart-tip='publish-actions']",
  },
  "/dashboard/templates": {
    id: "dashboard-templates",
    title: "اختار الشكل اللي يعبر عنك",
    description: "كل قالب تقدر تغيره بعدين… جرب براحتك.",
    icon: Palette,
    accentColor: "#fbbf24",
    glowColor: "rgba(251,191,36,0.25)",
    targetSelector: "[data-smart-tip='templates-grid']",
  },
  "/dashboard/billing": {
    id: "dashboard-billing",
    title: "من هنا تتابع اشتراكك وفواتيرك",
    description: "تفعّل اشتراكك وتضمن إن موقعك يفضل شغال دايماً.",
    icon: CreditCard,
    accentColor: "#34d399",
    glowColor: "rgba(52,211,153,0.22)",
  },
  "/dashboard/settings": {
    id: "dashboard-settings",
    title: "إعدادات حسابك وموقعك",
    description: "تقدر تغير رابطك، أو تعيد مشاهدة جولة التعريف من هنا.",
    icon: Settings,
    accentColor: "#a78bfa",
    glowColor: "rgba(167,139,250,0.22)",
  },
};

export function getTipForPath(pathname: string): PageTip | null {
  const exact = dashboardTips[pathname];
  if (exact) return exact;
  for (const [path, tip] of Object.entries(dashboardTips)) {
    if (pathname.startsWith(path) && path !== "/dashboard") return tip;
  }
  return dashboardTips["/dashboard"] ?? null;
}
