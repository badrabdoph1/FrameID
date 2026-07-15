import type { GuideMessage } from "./types";

export const guideMessages: GuideMessage[] = [
  {
    id: "lg-home",
    routes: ["/"],
    title: "من هنا هتبدأ",
    description: "اختار شكل موقعك — بعدين هنجهزه باسمك وصورك في ثواني.",
    titleShort: "يلا نبدأ",
    descriptionShort: "اختار شكل موقعك في ثانيتين.",
    actionLabel: "يلا نبدأ",
    actionHref: "/templates",
    suppressLabel: "متظهرش الرسالة دي تاني",
    targetSelector: "[data-guide-target='home-cta']",
    emergence: "from-target",
    personality: "ignition",
    delay: {
      minAfterLoad: 500,
      maxAfterLoad: 6000,
      secondBreathWindow: 4000,
      cardAfterBreath: 1500,
    },
    hesitationDelay: 0,
    priority: 100,
    audience: "guest",
    version: 1,
  },
  {
    id: "lg-templates",
    routes: ["/templates"],
    title: "اختار اللي يقرب لشغلك",
    description: "كل القوالب دي نقطة بداية — الصور والألوان والكلام كله هتغيره بعدين.",
    titleShort: "اختار وقولنا",
    descriptionShort: "متقلقش، كل حاجة بتتغير.",
    actionLabel: "",
    suppressLabel: "متظهرش الرسالة دي تاني",
    targetSelector: "[data-guide-target='templates-grid']",
    emergence: "from-grid",
    personality: "cascade",
    delay: {
      minAfterLoad: 300,
      maxAfterLoad: 5000,
      secondBreathWindow: 3500,
      cardAfterBreath: 1200,
    },
    hesitationDelay: 0,
    priority: 90,
    audience: "all",
    version: 1,
  },
  {
    id: "lg-preview",
    routes: ["/templates/{code}/preview"],
    title: "ده الشكل اللي هيشوفه عميلك",
    description: "عجبك؟ اضغط هنا وابدأ ظبطه على ذوقك.",
    titleShort: "عجبك؟",
    descriptionShort: "اضغط هنا وخلص.",
    actionLabel: "استخدم القالب ده",
    suppressLabel: "متظهرش الرسالة دي تاني",
    targetSelector: "[data-guide-target='preview-use-btn']",
    emergence: "from-toolbar",
    personality: "reflection",
    delay: {
      minAfterLoad: 800,
      maxAfterLoad: 7000,
      secondBreathWindow: 4000,
      cardAfterBreath: 1500,
    },
    hesitationDelay: 0,
    priority: 80,
    audience: "all",
    version: 1,
  },
  {
    id: "lg-signup",
    routes: ["/signup"],
    title: "",
    description: "اسم الموقع بس — بعدها هنكمل الباقي سوا.",
    titleShort: "",
    descriptionShort: "هنكمل سوا.",
    actionLabel: "",
    suppressLabel: "",
    targetSelector: "[data-guide-target='signup-form']",
    emergence: "inline",
    personality: "assembly",
    delay: {
      minAfterLoad: 300,
      maxAfterLoad: 3000,
      secondBreathWindow: 0,
      cardAfterBreath: 0,
    },
    hesitationDelay: 8000,
    priority: 70,
    audience: "guest",
    version: 1,
  },
  {
    id: "lg-login",
    routes: ["/login"],
    title: "",
    description: "موقعك وصورك وباقاتك مستنينك.",
    titleShort: "",
    descriptionShort: "كل حاجة مستنياك.",
    actionLabel: "",
    suppressLabel: "",
    targetSelector: "[data-guide-target='login-form']",
    emergence: "inline",
    personality: "assembly",
    delay: {
      minAfterLoad: 300,
      maxAfterLoad: 3000,
      secondBreathWindow: 0,
      cardAfterBreath: 0,
    },
    hesitationDelay: 10000,
    priority: 60,
    audience: "all",
    version: 1,
  },
];

export function getMessageForPath(pathname: string): GuideMessage | null {
  const sorted = [...guideMessages].sort((a, b) => b.priority - a.priority);

  for (const msg of sorted) {
    for (const route of msg.routes) {
      if (route.includes("{")) {
        const pattern = route
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\{[^}]+\}/g, "[^/]+");
        try {
          if (new RegExp(`^${pattern}$`).test(pathname)) return msg;
        } catch {
          // skip invalid patterns
        }
        continue;
      }
      if (pathname === route) return msg;
    }
  }

  return null;
}
