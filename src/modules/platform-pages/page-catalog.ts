import type { PlatformPageKind } from "@/modules/platform-pages/page-service";

export type SectionCapabilities = {
  hide: boolean;
  move: boolean;
  duplicate: boolean;
  delete: boolean;
};

export type PlatformPageSectionDefinition = {
  type: string;
  label: string;
  capabilities: SectionCapabilities;
};

export type PlatformPageDefinition = {
  key: string;
  label: string;
  description: string;
  route: string;
  kind: PlatformPageKind;
  availability: "editable" | "planned";
  sections: PlatformPageSectionDefinition[];
};

const flexibleSection: SectionCapabilities = {
  hide: true,
  move: true,
  duplicate: true,
  delete: true,
};

const protectedSection: SectionCapabilities = {
  hide: false,
  move: false,
  duplicate: false,
  delete: false,
};

export const PLATFORM_PAGE_DEFINITIONS: PlatformPageDefinition[] = [
  {
    key: "home",
    label: "الصفحة الرئيسية",
    description: "الواجهة الأولى التي يرى منها الزائر قيمة FrameID.",
    route: "/",
    kind: "EDITORIAL",
    availability: "editable",
    sections: [
      { type: "home.hero", label: "الواجهة الرئيسية", capabilities: flexibleSection },
      { type: "home.templates", label: "معاينة القوالب", capabilities: flexibleSection },
      { type: "home.benefits", label: "المميزات", capabilities: flexibleSection },
      { type: "home.journey", label: "طريقة البدء", capabilities: flexibleSection },
      { type: "home.faq", label: "الأسئلة الشائعة", capabilities: flexibleSection },
      { type: "home.final-cta", label: "الدعوة الأخيرة", capabilities: flexibleSection },
    ],
  },
  {
    key: "templates",
    label: "القوالب",
    description: "تقديم القوالب والبحث بينها دون تكرار بياناتها.",
    route: "/templates",
    kind: "EDITORIAL",
    availability: "planned",
    sections: [
      { type: "templates.hero", label: "المقدمة", capabilities: flexibleSection },
      { type: "templates.filters", label: "التصفية", capabilities: protectedSection },
      { type: "templates.catalog", label: "القوالب", capabilities: protectedSection },
      { type: "templates.cta", label: "الدعوة للبدء", capabilities: flexibleSection },
    ],
  },
  {
    key: "pricing",
    label: "الأسعار",
    description: "تقديم الخطط مع إبقاء الأسعار في نظام الخطط.",
    route: "/pricing",
    kind: "EDITORIAL",
    availability: "planned",
    sections: [
      { type: "pricing.hero", label: "المقدمة", capabilities: flexibleSection },
      { type: "pricing.plans", label: "الخطط", capabilities: protectedSection },
      { type: "pricing.faq", label: "الأسئلة", capabilities: flexibleSection },
    ],
  },
  {
    key: "login",
    label: "تسجيل الدخول",
    description: "النصوص المحيطة بنموذج تسجيل الدخول المحمي.",
    route: "/login",
    kind: "AUTH",
    availability: "planned",
    sections: [{ type: "auth.login", label: "تسجيل الدخول", capabilities: protectedSection }],
  },
  {
    key: "signup",
    label: "إنشاء الحساب",
    description: "تجربة الانضمام مع نموذج حساب محمي.",
    route: "/signup",
    kind: "AUTH",
    availability: "planned",
    sections: [{ type: "auth.signup", label: "إنشاء الحساب", capabilities: protectedSection }],
  },
  {
    key: "checkout",
    label: "الدفع",
    description: "المحتوى التوضيحي حول رحلة الدفع الآمنة.",
    route: "/checkout",
    kind: "FUNCTIONAL",
    availability: "planned",
    sections: [{ type: "checkout.flow", label: "إتمام الدفع", capabilities: protectedSection }],
  },
  {
    key: "privacy",
    label: "الخصوصية",
    description: "سياسة الخصوصية المنشورة.",
    route: "/privacy",
    kind: "LEGAL",
    availability: "planned",
    sections: [{ type: "legal.privacy", label: "سياسة الخصوصية", capabilities: protectedSection }],
  },
  {
    key: "terms",
    label: "الشروط",
    description: "الشروط والأحكام المنشورة.",
    route: "/terms",
    kind: "LEGAL",
    availability: "planned",
    sections: [{ type: "legal.terms", label: "الشروط والأحكام", capabilities: protectedSection }],
  },
  {
    key: "dashboard",
    label: "لوحة التحكم",
    description: "الغلاف التحريري حول بيانات العميل الحية.",
    route: "/dashboard",
    kind: "FUNCTIONAL",
    availability: "planned",
    sections: [{ type: "dashboard.core", label: "لوحة التحكم", capabilities: protectedSection }],
  },
];

export function getPlatformPageDefinition(pageKey: string): PlatformPageDefinition | undefined {
  return PLATFORM_PAGE_DEFINITIONS.find((page) => page.key === pageKey);
}

export function getSectionDefinition(pageKey: string, sectionType: string) {
  return getPlatformPageDefinition(pageKey)?.sections.find((section) => section.type === sectionType);
}
