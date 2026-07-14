import type { LucideIcon } from "lucide-react";
import {
  Package,
  MessageCircle,
  Image,
  UserSquare2,
  FolderOpen,
  Rocket,
  Sparkles,
  Share2,
  AlertTriangle,
} from "lucide-react";

export type SiteState = {
  hasPackages: boolean;
  hasContactInfo: boolean;
  hasAvatar: boolean;
  hasCoverImage: boolean;
  hasAlbums: boolean;
  hasSeoSettings: boolean;
  isPublished: boolean;
  packagesCount: number;
  albumsCount: number;
  daysSinceLastUpdate: number;
  subscriptionStatus: string | null;
};

export type Recommendation = {
  id: string;
  type: "action" | "suggestion" | "issue";
  priority: number;
  title: string;
  description: string;
  reason?: string;
  href: string;
  icon: LucideIcon;
  impact: "high" | "medium" | "low";
};

type RecommendationRule = {
  type: "action" | "suggestion" | "issue";
  condition: (state: SiteState) => boolean;
  recommendation: Omit<Recommendation, "type">;
};

const rules: RecommendationRule[] = [
  {
    type: "issue",
    condition: (state) => state.subscriptionStatus === "EXPIRED",
    recommendation: {
      id: "expired-subscription",
      priority: 1,
      title: "اشتراكك منتهي",
      description: "جدد اشتراكك عشان موقعك يفضل شغال والعملاء يلاقوك.",
      href: "/dashboard/billing",
      icon: AlertTriangle,
      impact: "high",
    },
  },
  {
    type: "issue",
    condition: (state) => state.subscriptionStatus === "TRIAL_EXPIRED",
    recommendation: {
      id: "trial-expired",
      priority: 2,
      title: "فترة التجربة انتهت",
      description: "فعّل اشتراكك عشان تكمل استخدام الموقع.",
      href: "/dashboard/billing",
      icon: AlertTriangle,
      impact: "high",
    },
  },
  {
    type: "action",
    condition: (state) => !state.hasPackages,
    recommendation: {
      id: "add-first-package",
      priority: 11,
      title: "أضف أول باقة",
      description: "اكتب أسماء باقاتك وأسعارك ومميزاتها.",
      reason: "الباقات هي أول حاجة العميل بيدور عليها قبل ما يتواصل معاك.",
      href: "/dashboard/services",
      icon: Package,
      impact: "high",
    },
  },
  {
    type: "action",
    condition: (state) => !state.hasContactInfo,
    recommendation: {
      id: "add-contact-info",
      priority: 12,
      title: "أكمل بيانات التواصل",
      description: "ضيف اسم الاستوديو ورقم الواتساب وروابطك.",
      reason: "من غير وسيلة تواصل، العميل مش هيعرف يكلمك.",
      href: "/dashboard/site-info",
      icon: MessageCircle,
      impact: "high",
    },
  },
  {
    type: "action",
    condition: (state) => !state.hasCoverImage,
    recommendation: {
      id: "add-cover-image",
      priority: 13,
      title: "ارفع صورة الغلاف",
      description: "اختار أقوى صورة عندك تعبر عن أسلوبك.",
      reason: "صورة الغلاف هي أول صورة يراها العميل لما يدخل موقعك.",
      href: "/dashboard/gallery",
      icon: Image,
      impact: "high",
    },
  },
  {
    type: "action",
    condition: (state) => !state.hasAvatar,
    recommendation: {
      id: "add-avatar",
      priority: 14,
      title: "أضف صورة المصور",
      description: "صورة واضحة ومهنية بتزيد ثقة العميل.",
      reason: "صورة المصور بتظهر جنب اسمك في الموقع وبتزيد الثقة.",
      href: "/dashboard/gallery",
      icon: UserSquare2,
      impact: "medium",
    },
  },
  {
    type: "action",
    condition: (state) => !state.hasAlbums,
    recommendation: {
      id: "create-first-album",
      priority: 15,
      title: "أنشئ أول ألبوم",
      description: "اجمع صورك في ألبومات منظمة حسب النوع.",
      reason: "الألبومات بتنظم شغلك وتخليه أسهل في التصفح.",
      href: "/dashboard/gallery",
      icon: FolderOpen,
      impact: "medium",
    },
  },
  {
    type: "action",
    condition: (state) => !state.isPublished && state.hasPackages && state.hasContactInfo && state.hasCoverImage,
    recommendation: {
      id: "publish-site",
      priority: 20,
      title: "انشر موقعك",
      description: "موقعك جاهز! انشره عشان العملاء يلاقوك.",
      reason: "موقعك اكتمل، حان وقت ما تشاركه مع العالم.",
      href: "/dashboard/publish",
      icon: Rocket,
      impact: "high",
    },
  },
  {
    type: "suggestion",
    condition: (state) => state.packagesCount === 1,
    recommendation: {
      id: "add-more-packages",
      priority: 51,
      title: "ضيف باقة تانية",
      description: "العملاء بيدوروا على خيارات مختلفة. باقتين أو تلاتة بتزيد فرصة إن العميل يلاقي اللي يناسبه.",
      href: "/dashboard/services",
      icon: Package,
      impact: "medium",
    },
  },
  {
    type: "suggestion",
    condition: (state) => state.albumsCount < 3 && state.hasAlbums,
    recommendation: {
      id: "add-more-albums",
      priority: 52,
      title: "ضيف ألبوم جديد",
      description: "كل ما تعرض شغل أكتر، كل ما العميل يثق فيك أكتر. أضف أحدث جلساتك.",
      href: "/dashboard/gallery",
      icon: FolderOpen,
      impact: "medium",
    },
  },
  {
    type: "suggestion",
    condition: (state) => !state.hasSeoSettings && state.isPublished,
    recommendation: {
      id: "improve-seo",
      priority: 53,
      title: "حسّن ظهورك في جوجل",
      description: "ضيف عنوان ووصف مخصص لموقعك عشان يظهر أحسن في نتائج البحث.",
      href: "/dashboard/publish",
      icon: Sparkles,
      impact: "medium",
    },
  },
  {
    type: "suggestion",
    condition: (state) => state.daysSinceLastUpdate > 30 && state.isPublished,
    recommendation: {
      id: "update-site",
      priority: 54,
      title: "حدّث موقعك",
      description: "الموقع اللي بيتحدث باستمرار بيبان أكتر نشاطاً. أضف صور جديدة أو عدّل باقاتك.",
      href: "/dashboard/gallery",
      icon: Sparkles,
      impact: "low",
    },
  },
  {
    type: "suggestion",
    condition: (state) => state.isPublished && state.hasPackages && state.hasContactInfo,
    recommendation: {
      id: "share-site",
      priority: 60,
      title: "شارك موقعك",
      description: "موقعك جاهز! انسخ الرابط وابعته لعملائك أو شاركه على السوشيال ميديا.",
      href: "/dashboard/publish",
      icon: Share2,
      impact: "high",
    },
  },
];

export function analyzeSiteState(state: SiteState): {
  nextAction: Recommendation | null;
  growthSuggestion: Recommendation | null;
  criticalIssues: Recommendation[];
} {
  const applicable = rules
    .filter(rule => rule.condition(state))
    .map(rule => ({
      ...rule.recommendation,
      type: rule.type,
    }))
    .sort((a, b) => a.priority - b.priority);

  return {
    nextAction: applicable.find(r => r.type === "action") || null,
    growthSuggestion: applicable.find(r => r.type === "suggestion") || null,
    criticalIssues: applicable.filter(r => r.type === "issue"),
  };
}

export function isSiteComplete(state: SiteState): boolean {
  return state.hasPackages && state.hasContactInfo && state.hasCoverImage && state.hasAvatar && state.hasAlbums;
}

export function calculateProgress(state: SiteState): { completed: number; total: number } {
  const checks = [
    state.hasPackages,
    state.hasContactInfo,
    state.hasCoverImage,
    state.hasAvatar,
    state.hasAlbums,
  ];
  const completed = checks.filter(Boolean).length;
  return { completed, total: checks.length };
}
