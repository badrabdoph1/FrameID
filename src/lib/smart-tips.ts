import {
  Check,
  CheckCircle2,
  Compass,
  CreditCard,
  Eye,
  Globe2,
  Images,
  KeyRound,
  LayoutDashboard,
  LogIn,
  Package,
  Palette,
  Phone,
  Rocket,
  Settings,
  UserPlus,
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
  // ── Public: Home ──
  {
    id: "home",
    routes: ["/"],
    title: "دي نقطة الانطلاق بتاعتك",
    description: "شوف القوالب، اتفرج على الشكل النهائي، وابدأ من غير تعقيدات.",
    icon: LayoutDashboard,
    accent: "#f3cf73",
    button: "استكشف",
    buttonIcon: Compass,
    placement: "center",
    animation: "float-up",
    hintTarget: "[data-smart-hint='home-cta']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "all",
    version: 1,
  },

  // ── Public: Templates ──
  {
    id: "templates",
    routes: ["/templates"],
    title: "مش لازم تبدأ من الصفر",
    description: "اختار أقرب قالب لذوقك، وبعدها غير فيه براحتك — الصور والألوان والنصوص كلها بتتعدل.",
    icon: Palette,
    accent: "#a855f7",
    button: "يلا",
    buttonIcon: Eye,
    placement: "center",
    animation: "slide-right",
    hintTarget: "[data-smart-hint='templates-grid']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "all",
    version: 1,
  },

  // ── Public: Template Preview ──
  {
    id: "template-preview",
    routes: ["/templates/*/preview"],
    title: "كده هيشوفك العميل بالظبط",
    description: "تقدر تجرب القالب وتشوف شكله على الموبايل والكمبيوتر قبل ما تبدأ.",
    icon: Eye,
    accent: "#38bdf8",
    button: "فهمت",
    buttonIcon: Check,
    placement: "center",
    animation: "zoom",
    hintTarget: "[data-smart-hint='preview-screen']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "all",
    version: 1,
  },

  // ── Public: Login ──
  {
    id: "login",
    routes: ["/login"],
    title: "أهلاً بيك تاني",
    description: "موقعك مستنيك — ادخل وكمل من حيث ما وقفت.",
    icon: LogIn,
    accent: "#3b82f6",
    button: "فهمت",
    buttonIcon: Check,
    placement: "center",
    animation: "fade",
    hintTarget: "[data-smart-hint='login-form']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "all",
    version: 1,
  },

  // ── Public: Signup ──
  {
    id: "signup",
    routes: ["/signup"],
    title: "باقي بينك وبين موقعك دقيقة واحدة",
    description: "اعمل حسابك وسيب الباقي علينا.",
    icon: UserPlus,
    accent: "#22c55e",
    button: "ابدأ",
    buttonIcon: Rocket,
    placement: "center",
    animation: "sparkle",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "all",
    version: 1,
  },

  // ── Public: Forgot Password ──
  {
    id: "forgot-password",
    routes: ["/forgot-password"],
    title: "مش محتاج تقلق",
    description: "اكتب بياناتك وهنبعتلك رابط الاستعادة في ثواني.",
    icon: KeyRound,
    accent: "#f97316",
    button: "فهمت",
    buttonIcon: Check,
    placement: "center",
    animation: "slide-left",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "all",
    version: 1,
  },

  // ── Public: Reset Password ──
  {
    id: "reset-password",
    routes: ["/reset-password"],
    title: "كلمة السر الجديدة جاهزة",
    description: "ادخل وشوف موقعك وتأكد إن كل حاجة تمام.",
    icon: CheckCircle2,
    accent: "#14b8a6",
    button: "يلا",
    buttonIcon: CheckCircle2,
    placement: "center",
    animation: "check",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "all",
    version: 1,
  },

  // ── Dashboard: Home ──
  {
    id: "dashboard-home",
    routes: ["/dashboard"],
    title: "من هنا هتتابع موقعك كله",
    description: "تشوف إيه ناقص، وتوصل لكل حاجة بسرعة. كل خطوات التجهيز قدامك.",
    icon: LayoutDashboard,
    accent: "#f3cf73",
    button: "فهمت",
    buttonIcon: Check,
    placement: "top",
    animation: "float-up",
    hintTarget: "[data-smart-tip='checklist']",
    showOnce: true,
    enabled: true,
    priority: 0,
    audience: "authenticated",
    version: 1,
  },

  // ── Dashboard: Services ──
  {
    id: "dashboard-services",
    routes: ["/dashboard/services"],
    title: "الباقات أول حاجة العميل بيبص عليها",
    description: "ظبط أسعارك وعروضك كويس… العميل بيقرر من هنا.",
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
    title: "كل ما العميل يوصلك بسهولة… فرص الحجز بتزيد",
    description: "حط رقمك، واتسابك، وروابطك… خلي التواصل أسهل حاجة.",
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
    title: "خلي شغلك يتكلم عنك",
    description: "ارفع أفضل صورك… العميل بيحكم عليك من أول صورة.",
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
    title: "راجع موقعك مرة أخيرة… وبعدها شاركه",
    description: "تأكد إن كل حاجة تمام… وبعدها ابعت الرابط لأي عميل.",
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
    title: "اختار الشكل اللي يعبر عنك",
    description: "كل قالب تقدر تغيره بعدين… جرب براحتك.",
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
    title: "من هنا تتابع اشتراكك وفواتيرك",
    description: "تفعّل اشتراكك وتضمن إن موقعك يفضل شغال دايماً.",
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
    title: "إعدادات حسابك وموقعك",
    description: "تقدر تغير رابطك، أو تعيد مشاهدة جولة التعريف من هنا.",
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
