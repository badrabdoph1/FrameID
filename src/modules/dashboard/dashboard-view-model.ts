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
    nextStepHref: incomplete?.href ?? "/dashboard/publish",
    nextStepLabel: incomplete
      ? incomplete.label
      : session.site.status === "PUBLISHED"
        ? "تم النشر ✓"
        : "نشر الموقع",
  };
}
