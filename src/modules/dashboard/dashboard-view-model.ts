import type { CurrentSession } from "@/modules/auth/current-session-service";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type DashboardViewModel = {
  photographerName: string;
  siteTitle: string;
  siteSlug: string;
  siteUrl: string;
  statusLabel: string;
  percent: number;
  checklist: ChecklistItem[];
  stats: Array<{ label: string; value: string; tone?: "success" | "warning" | "neutral" }>;
  lastModified: string;
  currentTheme: string;
  isPublished: boolean;
  nextStepHref: string;
  nextStepLabel: string;
  nextStepTitle: string;
  nextStepDescription: string;
};

function daysRemaining(targetDate: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = targetDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / msPerDay));
}

function formatStatus(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function calcPercent(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function formatRelativeTime(date: Date, now: Date): string {
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} ي`;
}

const nextStepCopy: Record<string, { title: string; description: string }> = {
  cover: {
    title: "ابدأ بصورة الغلاف",
    description: "اختر صورة قوية تظهر في أول شاشة من موقعك.",
  },
  album: {
    title: "ارفع أول ألبوم",
    description: "اجمع أفضل أعمالك في ألبوم واحد ليسهل على العميل فهم أسلوبك.",
  },
  package: {
    title: "أضف أول باقة",
    description: "حوّل الأسعار من محادثات متكررة إلى عروض واضحة قابلة للمقارنة.",
  },
  template: {
    title: "اختر شكل الموقع",
    description: "فعّل القالب الأقرب لهوية تصويرك ويمكنك تغييره لاحقاً.",
  },
  review: {
    title: "راجع موقعك قبل النشر",
    description: "افتح الموقع كما سيراه العميل وتأكد أن الصور والباقات وطرق التواصل واضحة.",
  },
  publish: {
    title: "انشر وشارك الرابط",
    description: "انسخ الرابط أو شاركه بعد التأكد من العنوان والمعاينات.",
  },
};

export function createDashboardViewModel({
  session,
  platformBaseUrl,
  now,
  packagesCount,
  imagesCount,
  albumsCount,
  hasContactInfo,
  hasCoverImage,
  currentThemeName,
  lastModifiedAt,
}: {
  session: CurrentSession;
  platformBaseUrl: string;
  now: Date;
  packagesCount: number;
  imagesCount: number;
  albumsCount: number;
  hasContactInfo: boolean;
  hasCoverImage: boolean;
  currentThemeName: string;
  lastModifiedAt: Date;
}): DashboardViewModel {
  const hasPackages = packagesCount > 0;
  const hasImages = imagesCount > 0;
  const hasAlbums = albumsCount > 0;

  const items: ChecklistItem[] = [
    { id: "cover", label: "رفع صورة الغلاف", done: hasCoverImage, href: "/dashboard/site-info" },
    { id: "album", label: "رفع أول ألبوم", done: hasImages && hasAlbums, href: "/dashboard/gallery" },
    { id: "package", label: "إضافة أول باقة", done: hasPackages, href: "/dashboard/services" },
    { id: "template", label: "اختيار قالب", done: currentThemeName !== "بدون", href: "/dashboard/templates" },
    { id: "review", label: "مراجعة الموقع", done: false, href: `/p/${session.site.slug}` },
    { id: "publish", label: "نشر الموقع", done: session.site.status === "PUBLISHED", href: "/dashboard/publish" },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percent = calcPercent(doneCount, items.length);

  const incomplete = items.find((i) => !i.done);
  const activeStep = incomplete ?? items.find((i) => i.id === "publish") ?? items[0];
  const activeCopy = nextStepCopy[activeStep.id] ?? {
    title: activeStep.label,
    description: "أكمل هذه الخطوة للانتقال للخطوة التالية.",
  };

  return {
    photographerName: session.tenant.displayName,
    siteTitle: session.site.title,
    siteSlug: session.site.slug,
    siteUrl: `${platformBaseUrl.replace(/\/$/u, "")}/p/${session.site.slug}`,
    statusLabel: session.site.status === "PUBLISHED" ? "منشور" : "مسودة",
    percent,
    checklist: items,
    stats: [
      { label: "الصور", value: String(imagesCount), tone: imagesCount > 0 ? "success" : "neutral" },
      { label: "الألبومات", value: String(albumsCount), tone: albumsCount > 0 ? "success" : "neutral" },
      { label: "الباقات", value: String(packagesCount), tone: packagesCount > 0 ? "success" : "neutral" },
      { label: "القوالب", value: currentThemeName, tone: currentThemeName !== "بدون" ? "success" : "warning" },
    ],
    lastModified: formatRelativeTime(lastModifiedAt, now),
    currentTheme: currentThemeName,
    isPublished: session.site.status === "PUBLISHED",
    nextStepHref: activeStep.href,
    nextStepLabel: incomplete
      ? incomplete.label
      : session.site.status === "PUBLISHED"
        ? "تم النشر ✓"
        : "نشر الموقع",
    nextStepTitle: activeCopy.title,
    nextStepDescription: activeCopy.description,
  };
}
