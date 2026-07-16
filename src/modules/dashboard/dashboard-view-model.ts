import type { CurrentSession } from "@/modules/auth/current-session-service";
import type { CustomerMessageTone } from "@/modules/messages/customer-message-config";
import {
  calcLifecycleDaysRemaining,
  calcLifecycleProgressPercent,
} from "@/modules/lifecycle/customer-lifecycle";
import type { ResolvedSubscriptionExperience } from "@/modules/subscription/subscription-experience";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  error?: boolean;
  href: string;
  description: string;
  workspace: "sales" | "studio" | "photos" | "publish" | "billing";
};

export type SubscriptionInfo = {
  status: string;
  accountType: "تجربة مجانية" | "اشتراك" | "اشتراك دائم";
  planName: string | null;
  trialEndsAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  daysRemaining: number | null;
  progressPercent: number | null;
  isExpired: boolean;
  isActive: boolean;
  isTrial: boolean;
  isPastDue: boolean;
  isCancelled: boolean;
  isSuspended: boolean;
  hasPendingRequest: boolean;
  pendingRequestStatus: string | null;
  latestPaymentRequestStatus: string | null;
  urgency: "success" | "warning" | "danger" | "neutral";
};

export type DashboardWorkspacePhase = {
  id: "packages" | "contact" | "photos" | "launch";
  title: string;
  description: string;
  done: number;
  total: number;
  href: string;
  state: "done" | "active" | "locked";
};

export type DashboardOperatingAlert = {
  tone: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  href: string;
  actionLabel: string;
};

export type DashboardCustomerMessage = { id: string; tone: CustomerMessageTone; title: string; body: string; createdAt: string };

export type DashboardViewModel = {
  photographerName: string;
  siteTitle: string;
  siteSlug: string;
  siteUrl: string;
  statusLabel: string;
  percent: number;
  checklist: ChecklistItem[];
  phases: DashboardWorkspacePhase[];
  operatingAlerts: DashboardOperatingAlert[];
  stats: Array<{ label: string; value: string; tone?: "success" | "warning" | "neutral" }>;
  lastModified: string;
  currentTheme: string;
  isPublished: boolean;
  isReadyToPublish: boolean;
  nextStepHref: string;
  nextStepLabel: string;
  nextStepTitle: string;
  nextStepDescription: string;
  subscription: SubscriptionInfo | null;
  subscriptionExperience: ResolvedSubscriptionExperience | null;
  customerMessages: DashboardCustomerMessage[];
  heroImageUrl: string | null;
};

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
  return `منذ ${Math.floor(hours / 24)} ي`;
}

const nextStepCopy: Record<string, { title: string; description: string }> = {
  published: { title: "موقعك منشور", description: "موقعك شغال وجاهز لاستقبال العملاء." },
  package: { title: "ابدأ بالباقات", description: "اكتب الباقات والأسعار بنفسك." },
  contact: { title: "أكمل بيانات التواصل", description: "اسم المصور، الاستوديو، الهاتف، واتساب، وروابطك." },
  profileImages: { title: "ارفع صور المصور والغلاف", description: "اختار الصورة الشخصية وصورة الغلاف من نفس المكان." },
  album: { title: "أنشئ ألبوم أعمال", description: "ألبوم واحد كفاية كبداية." },
  seo: { title: "جهّز شكل المشاركة", description: "عنوان ووصف وصورة مشاركة للرابط." },
};

function buildSubscriptionInfo(
  session: CurrentSession,
  now: Date,
  pendingRequestStatus: string | null,
  latestPaymentRequestStatus: string | null,
): SubscriptionInfo | null {
  if (!session.subscription) return null;

  const sub = session.subscription;
  const tenant = session.tenant;
  const isTrial = sub.status === "TRIAL" || tenant.status === "TRIAL";
  const isActive = sub.status === "ACTIVE" || tenant.status === "ACTIVE";
  const isExpired = sub.status === "EXPIRED" || tenant.status === "EXPIRED" || tenant.status === "TRIAL_EXPIRED";
  const isPastDue = sub.status === "PAST_DUE";
  const isCancelled = sub.status === "CANCELLED";
  const isSuspended = sub.status === "SUSPENDED" || tenant.status === "SUSPENDED";
  const startDate = isTrial ? tenant.trialStartedAt : (sub.currentPeriodStart ?? sub.activatedAt);
  const endDate = isTrial ? tenant.trialEndsAt : (sub.currentPeriodEnd ?? sub.expiresAt);
  const daysRemaining = calcLifecycleDaysRemaining(endDate ?? null, now);
  const progressPercent = calcLifecycleProgressPercent(startDate ?? null, endDate ?? null, now);
  const urgency = isExpired || isSuspended || isPastDue || daysRemaining === 0
    ? "danger"
    : daysRemaining !== null && daysRemaining <= 3
      ? "danger"
      : daysRemaining !== null && daysRemaining <= 7
        ? "warning"
        : isActive || isTrial
          ? "success"
          : "neutral";

  return {
    status: sub.status,
    accountType: isTrial ? "تجربة مجانية" : endDate ? "اشتراك" : "اشتراك دائم",
    planName: sub.plan?.name ?? null,
    trialEndsAt: tenant.trialEndsAt ? tenant.trialEndsAt.toISOString() : null,
    startsAt: startDate ? startDate.toISOString() : null,
    endsAt: endDate ? endDate.toISOString() : null,
    daysRemaining,
    progressPercent,
    isExpired,
    isActive,
    isTrial,
    isPastDue,
    isCancelled,
    isSuspended,
    hasPendingRequest: pendingRequestStatus !== null,
    pendingRequestStatus,
    latestPaymentRequestStatus,
    urgency,
  };
}

function buildPhases(items: ChecklistItem[]): DashboardWorkspacePhase[] {
  const phases: Array<Omit<DashboardWorkspacePhase, "done" | "total" | "state"> & { itemIds: string[] }> = [
    { id: "packages", title: "١. الباقات", description: "اكتب عروضك وأسعارك بوضوح.", href: "/dashboard/services", itemIds: ["package"] },
    { id: "contact", title: "٢. بيانات التواصل", description: "عرّف العميل عليك.", href: "/dashboard/site-info", itemIds: ["contact"] },
    { id: "photos", title: "٣. الصور", description: "صورة المصور والغلاف والألبومات.", href: "/dashboard/gallery", itemIds: ["profileImages", "album"] },
    { id: "launch", title: "٤. النشر", description: "جهّز شكل المشاركة وراجع الموقع.", href: "/dashboard/publish", itemIds: ["seo"] },
  ];
  let previousDone = true;
  return phases.map((phase) => {
    const related = items.filter((item) => phase.itemIds.includes(item.id));
    const done = related.filter((item) => item.done).length;
    const total = related.length;
    const complete = done === total;
    const state: DashboardWorkspacePhase["state"] = complete ? "done" : previousDone ? "active" : "locked";
    previousDone = previousDone && complete;
    return { ...phase, done, total, state };
  });
}

function buildOperatingAlerts({ isReadyToPublish, isPublished, siteSuspended }: { isReadyToPublish: boolean; isPublished: boolean; siteSuspended: boolean }): DashboardOperatingAlert[] {
  const alerts: DashboardOperatingAlert[] = [];
  if (siteSuspended) alerts.push({ tone: "danger", title: "الموقع متوقف", description: "موقعك متوقف حاليًا. فعّل اشتراكك لاستعادة الموقع.", href: "/dashboard/billing", actionLabel: "تفعيل" });
  else if (!isReadyToPublish) alerts.push({ tone: "info", title: "كمّل الخطوات بالترتيب", description: "ابدأ بالباقات، بعدها بيانات التواصل، بعدها الصور، ثم النشر.", href: "/dashboard/services", actionLabel: "ابدأ" });
  else if (isPublished) alerts.push({ tone: "success", title: "موقعك شغال", description: "موقعك منشور وجاهز لاستقبال العملاء.", href: "/dashboard/publish", actionLabel: "عرض" });
  return alerts;
}

export function createDashboardViewModel({ session, platformBaseUrl, now, packagesCount, imagesCount, albumsCount, hasContactInfo, hasCoverImage, currentThemeName, lastModifiedAt, pendingRequestStatus, latestPaymentRequestStatus, hasSeoSettings, hasAvatarImage, customerMessages, subscriptionExperience, heroImageUrl = null, siteSuspended = false }: {
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
  pendingRequestStatus?: string | null;
  latestPaymentRequestStatus?: string | null;
  hasSeoSettings?: boolean;
  hasAvatarImage?: boolean;
  customerMessages?: DashboardCustomerMessage[];
  subscriptionExperience?: ResolvedSubscriptionExperience | null;
  heroImageUrl?: string | null;
  siteSuspended?: boolean;
}): DashboardViewModel {
  const hasPackages = packagesCount > 0;
  const hasImages = imagesCount > 0;
  const hasAlbums = albumsCount > 0;
  const isPublished = session.site.status === "PUBLISHED";
  const siteOk = isPublished && !siteSuspended;
  const items: ChecklistItem[] = [
    { id: "published", label: "تم نشر موقعك", description: siteSuspended ? "الموقع متوقف حاليًا." : "موقعك شغال وجاهز لاستقبال العملاء.", done: siteOk, error: !siteOk, href: siteSuspended ? "/dashboard/billing" : "/dashboard/publish", workspace: "publish" },
    { id: "package", label: "أضف أول باقة بأسلوبك", description: "اسم وسعر ومميزات واضحة.", done: hasPackages, href: "/dashboard/services", workspace: "sales" },
    { id: "contact", label: "أكمل بيانات التواصل", description: "اسم المصور، واتساب، وروابطك.", done: hasContactInfo, href: "/dashboard/site-info", workspace: "studio" },
    { id: "profileImages", label: "ارفع صورة المصور والغلاف", description: "الصورة الشخصية وصورة الغلاف.", done: Boolean(hasAvatarImage) && hasCoverImage, href: "/dashboard/gallery", workspace: "photos" },
    { id: "album", label: "أنشئ ألبوم أعمال", description: "صور من أعمالك تظهر للعميل.", done: hasImages && hasAlbums, href: "/dashboard/gallery", workspace: "photos" },
    { id: "seo", label: "جهّز شكل المشاركة", description: "عنوان ووصف أو صورة للرابط.", done: Boolean(hasSeoSettings), href: "/dashboard/publish", workspace: "publish" },
  ];
  const doneCount = items.filter((item) => item.done).length;
  const percent = calcPercent(doneCount, items.length);
  const subscription = buildSubscriptionInfo(session, now, pendingRequestStatus ?? null, latestPaymentRequestStatus ?? null);
  const setupItems = items.filter((item) => item.id !== "published");
  const isReadyToPublish = setupItems.every((item) => item.done);
  const incomplete = items.find((item) => !item.done && !item.error);
  const activeStep = incomplete ?? items.find((item) => item.id === "published") ?? items[0];
  const activeCopy = nextStepCopy[activeStep.id] ?? { title: activeStep.label, description: "أكمل هذه الخطوة للانتقال للخطوة التالية." };

  return {
    photographerName: session.tenant.displayName,
    siteTitle: session.site.title,
    siteSlug: session.site.slug,
    siteUrl: `${platformBaseUrl.replace(/\/$/u, "")}/p/${session.site.slug}`,
    statusLabel: isPublished ? "منشور" : isReadyToPublish ? "جاهز للنشر" : "مسودة",
    percent,
    checklist: items,
    phases: buildPhases(items),
    operatingAlerts: buildOperatingAlerts({ isReadyToPublish, isPublished, siteSuspended }),
    stats: [
      { label: "الباقات", value: String(packagesCount), tone: hasPackages ? "success" : "warning" },
      { label: "التواصل", value: hasContactInfo ? "جاهز" : "ناقص", tone: hasContactInfo ? "success" : "warning" },
      { label: "الصور", value: String(imagesCount), tone: imagesCount > 0 ? "success" : "neutral" },
      { label: "الألبومات", value: String(albumsCount), tone: albumsCount > 0 ? "success" : "neutral" },
      { label: "الشكل", value: currentThemeName, tone: currentThemeName !== "بدون" ? "success" : "warning" },
      { label: "النشر", value: isPublished ? "منشور" : isReadyToPublish ? "جاهز" : "مسودة", tone: isPublished ? "success" : isReadyToPublish ? "warning" : "neutral" },
    ],
    lastModified: formatRelativeTime(lastModifiedAt, now),
    currentTheme: currentThemeName,
    isPublished,
    isReadyToPublish,
    nextStepHref: activeStep.href,
    nextStepLabel: incomplete ? incomplete.label : siteOk ? "افتح الموقع" : "تفعيل الموقع",
    nextStepTitle: activeCopy.title,
    nextStepDescription: activeCopy.description,
    subscription,
    subscriptionExperience: subscriptionExperience ?? null,
    customerMessages: customerMessages ?? [],
    heroImageUrl,
  };
}
