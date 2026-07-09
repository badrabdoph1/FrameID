import type { CurrentSession } from "@/modules/auth/current-session-service";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  description: string;
  workspace: "sales" | "studio" | "photos" | "publish" | "billing";
};

export type SubscriptionInfo = {
  status: string;
  planName: string | null;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  isExpired: boolean;
  isActive: boolean;
  isTrial: boolean;
  isPastDue: boolean;
  isCancelled: boolean;
  isSuspended: boolean;
  hasPendingRequest: boolean;
  pendingRequestStatus: string | null;
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
  const days = Math.floor(hours / 24);
  return `منذ ${days} ي`;
}

const nextStepCopy: Record<string, { title: string; description: string }> = {
  package: {
    title: "ابدأ بالباقات",
    description: "اكتب الباقات والأسعار بنفسك. لا نعتبر أي باقة جاهزة إلا بعد ما تضيفها أو تعدلها فعلاً.",
  },
  contact: {
    title: "أكمل بيانات التواصل",
    description: "اسم المصور، اسم الاستوديو، الهاتف، واتساب، وروابط السوشيال الأساسية.",
  },
  avatar: {
    title: "ارفع صورة المصور",
    description: "اختار صورة شخصية مربعة وواضحة تظهر للعميل بثقة.",
  },
  cover: {
    title: "ارفع صورة الغلاف",
    description: "صورة كبيرة تعطي أول انطباع عن شغلك في أول شاشة.",
  },
  album: {
    title: "أنشئ ألبوم أعمال",
    description: "ألبوم واحد كفاية كبداية، ويفضل تكمّله بعد التأكد إن باقي الموقع شغال.",
  },
  seo: {
    title: "جهّز شكل المشاركة",
    description: "عنوان ووصف وصورة مشاركة عشان الرابط يظهر بشكل احترافي.",
  },
  publish: {
    title: "انشر الموقع",
    description: "بعد اكتمال الأساسيات، انشر الموقع وانسخ الرابط للعملاء.",
  },
};

function calcDaysRemaining(endDate: Date, now: Date): number {
  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function buildSubscriptionInfo(
  session: CurrentSession,
  now: Date,
  pendingRequestStatus: string | null,
): SubscriptionInfo | null {
  if (!session.subscription) return null;

  const sub = session.subscription;
  const tenant = session.tenant;
  const isTrial = sub.status === "TRIAL" || tenant.status === "TRIAL";
  const isActive = sub.status === "ACTIVE";
  const isExpired = sub.status === "EXPIRED" || tenant.status === "EXPIRED" || tenant.status === "TRIAL_EXPIRED";
  const isPastDue = sub.status === "PAST_DUE";
  const isCancelled = sub.status === "CANCELLED";
  const isSuspended = sub.status === "SUSPENDED" || tenant.status === "SUSPENDED";

  const endDate = isTrial ? tenant.trialEndsAt : (sub.currentPeriodEnd ?? tenant.trialEndsAt);

  return {
    status: sub.status,
    planName: sub.plan?.name ?? null,
    trialEndsAt: tenant.trialEndsAt ? tenant.trialEndsAt.toISOString() : null,
    daysRemaining: endDate ? calcDaysRemaining(endDate, now) : null,
    isExpired,
    isActive,
    isTrial,
    isPastDue,
    isCancelled,
    isSuspended,
    hasPendingRequest: pendingRequestStatus !== null,
    pendingRequestStatus,
  };
}

function buildPhases(items: ChecklistItem[]): DashboardWorkspacePhase[] {
  const phaseDefinitions: Array<Omit<DashboardWorkspacePhase, "done" | "total" | "state"> & { itemIds: string[] }> = [
    {
      id: "packages",
      title: "١. الباقات",
      description: "اكتب عروضك وأسعارك بوضوح.",
      href: "/dashboard/services",
      itemIds: ["package"],
    },
    {
      id: "contact",
      title: "٢. بيانات التواصل",
      description: "عرّف العميل عليك وخليه يعرف يحجز.",
      href: "/dashboard/site-info",
      itemIds: ["contact"],
    },
    {
      id: "photos",
      title: "٣. الصور",
      description: "الصورة الشخصية، الغلاف، وألبومات الأعمال.",
      href: "/dashboard/gallery",
      itemIds: ["avatar", "cover", "album"],
    },
    {
      id: "launch",
      title: "٤. النشر",
      description: "راجع الرابط، جهّز المشاركة، وانشر.",
      href: "/dashboard/publish",
      itemIds: ["seo", "publish"],
    },
  ];

  let previousDone = true;
  return phaseDefinitions.map((phase) => {
    const related = items.filter((item) => phase.itemIds.includes(item.id));
    const done = related.filter((item) => item.done).length;
    const total = related.length;
    const complete = done === total;
    const state: DashboardWorkspacePhase["state"] = complete ? "done" : previousDone ? "active" : "locked";
    previousDone = previousDone && complete;
    return { ...phase, done, total, state };
  });
}

function buildOperatingAlerts({
  isReadyToPublish,
  isPublished,
  subscription,
}: {
  isReadyToPublish: boolean;
  isPublished: boolean;
  subscription: SubscriptionInfo | null;
}): DashboardOperatingAlert[] {
  const alerts: DashboardOperatingAlert[] = [];

  if (subscription?.hasPendingRequest) {
    alerts.push({
      tone: "warning",
      title: "طلب التفعيل قيد المراجعة",
      description: "تم إرسال إثبات الدفع. تابع الحالة من صفحة الاشتراك.",
      href: "/dashboard/billing",
      actionLabel: "متابعة",
    });
  } else if (subscription?.isTrial) {
    alerts.push({
      tone: subscription.daysRemaining !== null && subscription.daysRemaining <= 3 ? "danger" : "warning",
      title: "حسابك تجريبي برجاء التأكد من التفعيل",
      description: subscription.daysRemaining !== null ? `متبقي ${subscription.daysRemaining} يوم على نهاية التجربة.` : "فعّل الاشتراك قبل نهاية الفترة التجريبية.",
      href: "/dashboard/billing",
      actionLabel: "زر التفعيل",
    });
  } else if (subscription?.isExpired || subscription?.isSuspended || subscription?.isPastDue) {
    alerts.push({
      tone: "danger",
      title: "الاشتراك يحتاج إجراء",
      description: "راجع الاشتراك حتى يظل الموقع شغال للعملاء.",
      href: "/dashboard/billing",
      actionLabel: "حل المشكلة",
    });
  }

  if (!isReadyToPublish) {
    alerts.push({
      tone: "info",
      title: "كمّل الخطوات بالترتيب",
      description: "ابدأ بالباقات، بعدها بيانات التواصل، بعدها الصور، ثم النشر.",
      href: "/dashboard/services",
      actionLabel: "ابدأ",
    });
  } else if (!isPublished) {
    alerts.push({
      tone: "success",
      title: "موقعك جاهز للنشر",
      description: "افتح صفحة النشر وراجع شكل الرابط قبل المشاركة.",
      href: "/dashboard/publish",
      actionLabel: "نشر",
    });
  }

  return alerts;
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
  pendingRequestStatus,
  hasSeoSettings,
  hasAvatarImage,
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
  pendingRequestStatus?: string | null;
  hasSeoSettings?: boolean;
  hasAvatarImage?: boolean;
}): DashboardViewModel {
  const hasPackages = packagesCount > 0;
  const hasImages = imagesCount > 0;
  const hasAlbums = albumsCount > 0;
  const isPublished = session.site.status === "PUBLISHED";

  const items: ChecklistItem[] = [
    {
      id: "package",
      label: "أضف أول باقة بأسلوبك",
      description: "الباقة لازم تكون من اختيارك أنت، باسم وسعر ومميزات واضحة.",
      done: hasPackages,
      href: "/dashboard/services",
      workspace: "sales",
    },
    {
      id: "contact",
      label: "أكمل بيانات التواصل",
      description: "اسم المصور، واتساب، فيسبوك، إنستجرام، وتيك توك.",
      done: hasContactInfo,
      href: "/dashboard/site-info",
      workspace: "studio",
    },
    {
      id: "avatar",
      label: "ارفع صورة المصور",
      description: "صورة شخصية مربعة وواضحة.",
      done: Boolean(hasAvatarImage),
      href: "/dashboard/gallery",
      workspace: "photos",
    },
    {
      id: "cover",
      label: "ارفع صورة الغلاف",
      description: "صورة رئيسية كبيرة للموقع.",
      done: hasCoverImage,
      href: "/dashboard/gallery",
      workspace: "photos",
    },
    {
      id: "album",
      label: "أنشئ ألبوم أعمال",
      description: "صور من أعمالك تظهر للعميل.",
      done: hasImages && hasAlbums,
      href: "/dashboard/gallery",
      workspace: "photos",
    },
    {
      id: "seo",
      label: "جهّز شكل المشاركة",
      description: "عنوان ووصف أو صورة للرابط.",
      done: Boolean(hasSeoSettings),
      href: "/dashboard/publish",
      workspace: "publish",
    },
    {
      id: "publish",
      label: "انشر الموقع",
      description: "حوّل الموقع لرابط جاهز للعملاء.",
      done: isPublished,
      href: "/dashboard/publish",
      workspace: "publish",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percent = calcPercent(doneCount, items.length);
  const subscription = buildSubscriptionInfo(session, now, pendingRequestStatus ?? null);
  const requiredBeforePublish = items.filter((item) => item.id !== "publish");
  const isReadyToPublish = requiredBeforePublish.every((item) => item.done);
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
    statusLabel: isPublished ? "منشور" : isReadyToPublish ? "جاهز للنشر" : "مسودة",
    percent,
    checklist: items,
    phases: buildPhases(items),
    operatingAlerts: buildOperatingAlerts({ isReadyToPublish, isPublished, subscription }),
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
    nextStepLabel: incomplete ? incomplete.label : isPublished ? "افتح الموقع" : "نشر الموقع",
    nextStepTitle: activeCopy.title,
    nextStepDescription: activeCopy.description,
    subscription,
  };
}
