import type { CurrentSession } from "@/modules/auth/current-session-service";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  description: string;
  workspace: "studio" | "gallery" | "sales" | "design" | "publish" | "billing";
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
  id: "setup" | "portfolio" | "commerce" | "launch";
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
  cover: {
    title: "ابدأ بصورة الغلاف",
    description: "اختر صورة قوية تظهر في أول شاشة من موقعك وتثبت هوية شغلك من أول ثانية.",
  },
  contact: {
    title: "أكمل بيانات التواصل",
    description: "أضف الهاتف وواتساب والمدينة حتى يعرف العميل كيف يحجز معك فوراً.",
  },
  album: {
    title: "ارفع أول ألبوم",
    description: "اجمع أفضل أعمالك في ألبوم واحد ليسهل على العميل فهم أسلوبك وجودة تصويرك.",
  },
  package: {
    title: "أضف أول باقة",
    description: "حوّل الأسعار من محادثات متكررة إلى عروض واضحة قابلة للمقارنة والحجز.",
  },
  template: {
    title: "اختر شكل الموقع",
    description: "فعّل القالب الأقرب لهوية تصويرك ويمكنك تغييره لاحقاً بدون فقد المحتوى.",
  },
  seo: {
    title: "جهّز عنوان المشاركة",
    description: "اكتب عنوان ووصف وصورة مشاركة عشان الرابط يظهر بشكل احترافي في واتساب وجوجل.",
  },
  review: {
    title: "راجع موقعك قبل النشر",
    description: "افتح الموقع كما سيراه العميل وتأكد أن الصور والباقات وطرق التواصل واضحة.",
  },
  publish: {
    title: "انشر وشارك الرابط",
    description: "انقل الموقع من مسودة لرابط جاهز، وانسخه لعملائك أو ضيفه على السوشيال.",
  },
  billing: {
    title: "فعّل الاشتراك",
    description: "اختار خطة وارفع إثبات الدفع حتى يظل الموقع شغال بعد التجربة المجانية.",
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

  const trialEndDate = tenant.trialEndsAt;
  const periodEnd = sub.currentPeriodEnd;
  const endDate = isTrial ? trialEndDate : (periodEnd ?? trialEndDate);
  const daysRemaining = endDate ? calcDaysRemaining(endDate, now) : null;

  return {
    status: sub.status,
    planName: sub.plan?.name ?? null,
    trialEndsAt: trialEndDate ? trialEndDate.toISOString() : null,
    daysRemaining,
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

function buildPhases(items: ChecklistItem[], subscription: SubscriptionInfo | null): DashboardWorkspacePhase[] {
  const phaseDefinitions: Array<Omit<DashboardWorkspacePhase, "done" | "total" | "state"> & { itemIds: string[] }> = [
    {
      id: "setup",
      title: "تجهيز الاستوديو",
      description: "الاسم، الغلاف، التواصل، والقالب الأساسي.",
      href: "/dashboard/site-info",
      itemIds: ["contact", "cover", "template"],
    },
    {
      id: "portfolio",
      title: "بناء المعرض",
      description: "ألبومات وصور تثبت جودة شغلك.",
      href: "/dashboard/gallery",
      itemIds: ["album"],
    },
    {
      id: "commerce",
      title: "تجهيز البيع والحجز",
      description: "باقات وأسعار واضحة للعميل.",
      href: "/dashboard/services",
      itemIds: ["package"],
    },
    {
      id: "launch",
      title: "الإطلاق والتفعيل",
      description: "SEO، نشر الموقع، وتفعيل الاشتراك.",
      href: "/dashboard/publish",
      itemIds: ["seo", "review", "publish"],
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

    if (phase.id === "launch" && subscription?.isActive) {
      return { ...phase, done, total, state };
    }

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

  if (!isReadyToPublish) {
    alerts.push({
      tone: "warning",
      title: "الموقع لسه محتاج تجهيز قبل المشاركة",
      description: "كمّل الخطوات الناقصة في خطة اليوم، وبعدها انشر الرابط بثقة.",
      href: "/dashboard",
      actionLabel: "راجع الخطة",
    });
  } else if (!isPublished) {
    alerts.push({
      tone: "info",
      title: "موقعك جاهز للنشر",
      description: "كل الأساسيات موجودة. راجع المعاينة واضغط نشر من Workspace النشر.",
      href: "/dashboard/publish",
      actionLabel: "انشر الموقع",
    });
  } else {
    alerts.push({
      tone: "success",
      title: "موقعك منشور وجاهز للعملاء",
      description: "انسخ الرابط أو افتحه كعميل وابدأ مشاركته على السوشيال.",
      href: "/dashboard/publish",
      actionLabel: "نسخ ومشاركة",
    });
  }

  if (subscription?.hasPendingRequest) {
    alerts.push({
      tone: "warning",
      title: "طلب التفعيل قيد المراجعة",
      description: "الإدارة تراجع إثبات الدفع. تابع حالة الطلب من صفحة الاشتراك.",
      href: "/dashboard/billing",
      actionLabel: "متابعة الطلب",
    });
  } else if (subscription?.isTrial && subscription.daysRemaining !== null && subscription.daysRemaining <= 3) {
    alerts.push({
      tone: "danger",
      title: "التجربة قربت تنتهي",
      description: "فعّل الاشتراك الآن حتى لا يتأثر ظهور موقعك للعملاء.",
      href: "/dashboard/billing",
      actionLabel: "فعّل الاشتراك",
    });
  } else if (subscription?.isExpired || subscription?.isSuspended || subscription?.isPastDue) {
    alerts.push({
      tone: "danger",
      title: "الاشتراك يحتاج إجراء",
      description: "راجع حالة الاشتراك لاستعادة التشغيل الكامل للموقع.",
      href: "/dashboard/billing",
      actionLabel: "حل المشكلة",
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
}): DashboardViewModel {
  const hasPackages = packagesCount > 0;
  const hasImages = imagesCount > 0;
  const hasAlbums = albumsCount > 0;
  const hasTheme = currentThemeName !== "بدون";
  const isPublished = session.site.status === "PUBLISHED";

  const items: ChecklistItem[] = [
    {
      id: "contact",
      label: "إكمال بيانات التواصل",
      description: "رقم، واتساب، بريد، ومدينة حتى يقدر العميل يحجز.",
      done: hasContactInfo,
      href: "/dashboard/site-info",
      workspace: "studio",
    },
    {
      id: "cover",
      label: "رفع صورة الغلاف",
      description: "صورة قوية تعطي أول انطباع عن شغلك.",
      done: hasCoverImage,
      href: "/dashboard/site-info",
      workspace: "studio",
    },
    {
      id: "album",
      label: "رفع أول ألبوم",
      description: "ألبوم واحد على الأقل يعرض أفضل أعمالك.",
      done: hasImages && hasAlbums,
      href: "/dashboard/gallery",
      workspace: "gallery",
    },
    {
      id: "package",
      label: "إضافة أول باقة",
      description: "باقة واضحة بالسعر والمميزات تساعد العميل يقرر.",
      done: hasPackages,
      href: "/dashboard/services",
      workspace: "sales",
    },
    {
      id: "template",
      label: "اختيار شكل الموقع",
      description: "قالب مناسب لهوية تصويرك وعميلك المستهدف.",
      done: hasTheme,
      href: "/dashboard/templates",
      workspace: "design",
    },
    {
      id: "seo",
      label: "تجهيز شكل المشاركة",
      description: "عنوان ووصف وصورة تظهر عند إرسال الرابط.",
      done: Boolean(hasSeoSettings),
      href: "/dashboard/publish",
      workspace: "publish",
    },
    {
      id: "review",
      label: "مراجعة الموقع كعميل",
      description: "افتح الرابط وتأكد أن التجربة مفهومة وجذابة.",
      done: isPublished,
      href: `/p/${session.site.slug}`,
      workspace: "publish",
    },
    {
      id: "publish",
      label: "نشر الموقع",
      description: "حوّل الموقع من مسودة إلى رابط جاهز للمشاركة.",
      done: isPublished,
      href: "/dashboard/publish",
      workspace: "publish",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percent = calcPercent(doneCount, items.length);
  const subscription = buildSubscriptionInfo(session, now, pendingRequestStatus ?? null);

  const requiredBeforePublish = items.filter((item) => !["review", "publish"].includes(item.id));
  const isReadyToPublish = requiredBeforePublish.every((item) => item.done);
  const incomplete = items.find((i) => !i.done);
  const activeStep = incomplete ?? items.find((i) => i.id === "publish") ?? items[0];
  const activeCopy = nextStepCopy[activeStep.id] ?? {
    title: activeStep.label,
    description: "أكمل هذه الخطوة للانتقال للخطوة التالية.",
  };

  const phases = buildPhases(items, subscription);
  const operatingAlerts = buildOperatingAlerts({ isReadyToPublish, isPublished, subscription });

  return {
    photographerName: session.tenant.displayName,
    siteTitle: session.site.title,
    siteSlug: session.site.slug,
    siteUrl: `${platformBaseUrl.replace(/\/$/u, "")}/p/${session.site.slug}`,
    statusLabel: isPublished ? "منشور" : isReadyToPublish ? "جاهز للنشر" : "مسودة",
    percent,
    checklist: items,
    phases,
    operatingAlerts,
    stats: [
      { label: "الصور", value: String(imagesCount), tone: imagesCount > 0 ? "success" : "neutral" },
      { label: "الألبومات", value: String(albumsCount), tone: albumsCount > 0 ? "success" : "neutral" },
      { label: "الباقات", value: String(packagesCount), tone: packagesCount > 0 ? "success" : "neutral" },
      { label: "القوالب", value: currentThemeName, tone: hasTheme ? "success" : "warning" },
      { label: "المشاركة", value: hasSeoSettings ? "جاهزة" : "ناقص SEO", tone: hasSeoSettings ? "success" : "warning" },
      { label: "النشر", value: isPublished ? "منشور" : isReadyToPublish ? "جاهز" : "مسودة", tone: isPublished ? "success" : isReadyToPublish ? "warning" : "neutral" },
    ],
    lastModified: formatRelativeTime(lastModifiedAt, now),
    currentTheme: currentThemeName,
    isPublished,
    isReadyToPublish,
    nextStepHref: activeStep.href,
    nextStepLabel: incomplete
      ? incomplete.label
      : isPublished
        ? "افتح الموقع المنشور"
        : "نشر الموقع",
    nextStepTitle: activeCopy.title,
    nextStepDescription: activeCopy.description,
    subscription,
  };
}
