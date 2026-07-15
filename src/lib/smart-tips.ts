import {
  Check,
  CreditCard,
  Globe2,
  Images,
  Package,
  Palette,
  Phone,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type PageTip = {
  id: string;
  routes: string[];
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  glowColor?: string;
  button: string;
  buttonIcon?: LucideIcon;
  placement: "center" | "top" | "bottom" | "left" | "right";
  animation: "float-up" | "fade" | "zoom" | "slide-right" | "slide-left" | "bounce" | "sparkle" | "check";
  hintTarget?: string;
  showOnce: boolean;
  enabled: boolean;
  priority: number;
  audience: "all" | "authenticated" | "guest";
  version: number;
};

export function accentToGlow(hex: string, opacity = 0.25): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

const tips: PageTip[] = [
  // ── Dashboard: Services ──
  {
    id: "dashboard-services",
    routes: ["/dashboard/services"],
    title: "الباقات — قرار العميل بيبتدي من هنا",
    description: "ظبط الأسعار والعروض، وخلّي كل باقة واضحة — العميل بيشوف ويتقرر فوراً.",
    icon: Package,
    accent: "#a855f7",
    button: "فهمت",
    buttonIcon: Check,
    placement: "top",
    animation: "float-up",
    hintTarget: "[data-smart-tip='packages-list']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "authenticated",
    version: 1,
  },

  // ── Dashboard: Site Info ──
  {
    id: "dashboard-site-info",
    routes: ["/dashboard/site-info"],
    title: "التواصل السهل = حجوزات أكتر",
    description: "رقمك، واتسابك، وروابطك في مكان واحد. العميل يلاقيلك من غير ما يدور.",
    icon: Phone,
    accent: "#34d399",
    button: "فهمت",
    buttonIcon: Check,
    placement: "top",
    animation: "float-up",
    hintTarget: "[data-smart-tip='contact-form']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "authenticated",
    version: 1,
  },

  // ── Dashboard: Gallery ──
  {
    id: "dashboard-gallery",
    routes: ["/dashboard/gallery"],
    title: "صورك هي كلامك",
    description: "ارفع أفضل شغلك، رتّب الألبومات، وخلّي العميل يحكم من أول نظرة.",
    icon: Images,
    accent: "#60a5fa",
    button: "فهمت",
    buttonIcon: Check,
    placement: "top",
    animation: "float-up",
    hintTarget: "[data-smart-tip='gallery-grid']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "authenticated",
    version: 1,
  },

  // ── Dashboard: Publish ──
  {
    id: "dashboard-publish",
    routes: ["/dashboard/publish"],
    title: "مراجعة أخيرة، وبعدها الموقع على الهواء",
    description: "طمن بالك إن كل حاجة تمام — الصور، الباقات، التواصل — وبعدها شارك الرابط بثقة.",
    icon: Globe2,
    accent: "#f472b6",
    button: "فهمت",
    buttonIcon: Check,
    placement: "top",
    animation: "float-up",
    hintTarget: "[data-smart-tip='publish-actions']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "authenticated",
    version: 1,
  },

  // ── Dashboard: Templates ──
  {
    id: "dashboard-templates",
    routes: ["/dashboard/templates"],
    title: "شكل موقعك — اختاره بعقلك، غيره بإيدك",
    description: "كل قالب نقطة بداية. شوف المعاينة، اختار اللي يناسبك، وعدّل الألوان والخطوط والصور كلها بتتعدل.",
    icon: Palette,
    accent: "#fbbf24",
    button: "فهمت",
    buttonIcon: Check,
    placement: "top",
    animation: "float-up",
    hintTarget: "[data-smart-tip='templates-grid']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "authenticated",
    version: 1,
  },

  // ── Dashboard: Billing ──
  {
    id: "dashboard-billing",
    routes: ["/dashboard/billing"],
    title: "اشتراكك وفواتيرك في مكان واحد",
    description: "فعّل الاشتراك، راقب الفواتير، و طمن بالك إن موقعك هيفضل شغال من غير انقطاع.",
    icon: CreditCard,
    accent: "#34d399",
    button: "فهمت",
    buttonIcon: Check,
    placement: "top",
    animation: "float-up",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "authenticated",
    version: 1,
  },

  // ── Dashboard: Settings ──
  {
    id: "dashboard-settings",
    routes: ["/dashboard/settings"],
    title: "إعداداتك — رابطك، جولة التعريف، و أكتر",
    description: "غيّر رابط الموقع، أعد مشاهدة الإرشادات، أو حدث بيانات الحساب — كل حاجة من هنا.",
    icon: Settings,
    accent: "#a78bfa",
    button: "فهمت",
    buttonIcon: Check,
    placement: "top",
    animation: "float-up",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "authenticated",
    version: 1,
  },
];

export function getTipForPath(pathname: string): PageTip | null {
  const sorted = [...tips].sort((a, b) => b.priority - a.priority);

  for (const tip of sorted) {
    if (!tip.enabled) continue;

    for (const route of tip.routes) {
      if (route.includes("*")) {
        const escaped = route
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, "[^/]+");
        try {
          if (new RegExp(`^${escaped}$`).test(pathname)) return tip;
        } catch {
        }
        continue;
      }
      if (pathname === route) return tip;
    }
  }

  return null;
}

export function getAllTips(): PageTip[] {
  return tips.filter((t) => t.enabled);
}