import {
  Activity,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  CreditCard,
  DatabaseBackup,
  Edit,
  FileText,
  Flag,
  Globe,
  Headphones,
  Home,
  Image,
  Layout,
  Mail,
  MessageSquareText,
  Palette,
  PauseCircle,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminSectionId =
  | "command"
  | "customers"
  | "billing"
  | "content"
  | "communication"
  | "system";

export type AdminRouteVisibility = "daily" | "advanced" | "contextual";

export type AdminRouteDefinition = {
  id: string;
  href: string;
  labelAr: string;
  descriptionAr: string;
  sectionId: AdminSectionId;
  visibility: AdminRouteVisibility;
  keywords: readonly string[];
  icon: LucideIcon;
  parentHref?: string;
};

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  hidden?: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export type AdminSection = {
  id: AdminSectionId;
  title: string;
  description: string;
  shortDescription?: string;
  accent: "gold" | "teal" | "blue" | "rose" | "violet" | "slate" | "green";
  icon: LucideIcon;
  badge?: string;
  links: AdminNavItem[];
};

function defineRoute(route: AdminRouteDefinition): AdminRouteDefinition {
  return route;
}

export const adminRoutes: AdminRouteDefinition[] = [
  defineRoute({ id: "admin-home", href: "/admin", labelAr: "لوحة الإدارة", descriptionAr: "أولويات اليوم وحالة المنصة", sectionId: "command", visibility: "daily", keywords: ["الرئيسية", "القيادة", "اليوم"], icon: Home }),
  defineRoute({ id: "admin-search", href: "/admin/search", labelAr: "البحث الشامل", descriptionAr: "العثور على أي عميل أو موقع أو عملية", sectionId: "command", visibility: "daily", keywords: ["بحث", "عميل", "عملية"], icon: Search, parentHref: "/admin" }),

  defineRoute({ id: "customers", href: "/admin/customers", labelAr: "العملاء", descriptionAr: "إدارة العملاء وحالة حساباتهم", sectionId: "customers", visibility: "daily", keywords: ["عملاء", "حسابات", "مصورون"], icon: Users, parentHref: "/admin" }),
  defineRoute({ id: "customer-requests", href: "/admin/customer-requests", labelAr: "طلبات العملاء", descriptionAr: "طلبات الحذف والميزات والترقيات", sectionId: "customers", visibility: "daily", keywords: ["طلبات", "حذف", "ترقية", "ميزات"], icon: FileText, parentHref: "/admin" }),
  defineRoute({ id: "customer-details", href: "/admin/customers/[id]", labelAr: "ملف العميل", descriptionAr: "كل تفاصيل العميل واشتراكه وموقعه", sectionId: "customers", visibility: "contextual", keywords: ["تفاصيل", "عميل", "اشتراك"], icon: Users, parentHref: "/admin/customers" }),
  defineRoute({ id: "sites", href: "/admin/sites", labelAr: "المواقع", descriptionAr: "متابعة مواقع العملاء وحالة نشرها", sectionId: "customers", visibility: "daily", keywords: ["مواقع", "نشر", "دومين"], icon: Globe, parentHref: "/admin/customers" }),
  defineRoute({ id: "site-details", href: "/admin/sites/[id]", labelAr: "تفاصيل الموقع", descriptionAr: "محتوى الموقع ونشره وإعداداته", sectionId: "customers", visibility: "contextual", keywords: ["موقع", "قالب", "نشر"], icon: Globe, parentHref: "/admin/sites" }),

  defineRoute({ id: "billing", href: "/admin/billing", labelAr: "مركز المال", descriptionAr: "الأولويات المالية والإيرادات", sectionId: "billing", visibility: "daily", keywords: ["مال", "إيراد", "تحصيل"], icon: BriefcaseBusiness, parentHref: "/admin" }),
  defineRoute({ id: "payments", href: "/admin/payments", labelAr: "مراجعة المدفوعات", descriptionAr: "قبول أو رفض إثباتات الدفع", sectionId: "billing", visibility: "daily", keywords: ["دفع", "إثبات", "مراجعة"], icon: CreditCard, parentHref: "/admin/billing" }),
  defineRoute({ id: "subscriptions", href: "/admin/subscriptions", labelAr: "الاشتراكات", descriptionAr: "التجارب والاشتراكات والتجديدات", sectionId: "billing", visibility: "daily", keywords: ["اشتراك", "تجربة", "تجديد"], icon: BadgeCheck, parentHref: "/admin/billing" }),
  defineRoute({ id: "plans", href: "/admin/plans", labelAr: "الباقات", descriptionAr: "أسعار ومزايا الباقات", sectionId: "billing", visibility: "daily", keywords: ["باقات", "سعر", "خطة"], icon: BadgeCheck, parentHref: "/admin/billing" }),
  defineRoute({ id: "deactivation-control", href: "/admin/deactivation-control", labelAr: "التحكم في التعطيل", descriptionAr: "تعليق التعطيل التلقائي للحسابات التجريبية والمدفوعة", sectionId: "communication", visibility: "daily", keywords: ["تعطيل", "تعليق", "إيقاف", "حسابات"], icon: PauseCircle, parentHref: "/admin/communications" }),
  defineRoute({ id: "payment-settings", href: "/admin/settings/payment", labelAr: "وسائل الدفع", descriptionAr: "الحسابات التي يستقبل عليها الدفع", sectionId: "billing", visibility: "daily", keywords: ["حساب", "محفظة", "تحويل"], icon: Settings, parentHref: "/admin/settings" }),

  defineRoute({ id: "content", href: "/admin/content", labelAr: "مركز المحتوى", descriptionAr: "الوصول لكل أدوات المحتوى من مكان واحد", sectionId: "content", visibility: "daily", keywords: ["محتوى", "تحرير", "نشر"], icon: Palette, parentHref: "/admin" }),
  defineRoute({ id: "content-page-workspace", href: "/admin/content/pages/[pageKey]", labelAr: "تحرير الصفحة", descriptionAr: "تعديل الصفحة نفسها مباشرة", sectionId: "content", visibility: "contextual", keywords: ["صفحة", "تحرير", "معاينة"], icon: Edit, parentHref: "/admin/content" }),
  defineRoute({ id: "content-editor", href: "/admin/content/[...slug]", labelAr: "محرر المحتوى", descriptionAr: "تعديل نصوص وبيانات الصفحة المحددة", sectionId: "content", visibility: "contextual", keywords: ["تحرير", "نصوص", "صفحة"], icon: Edit, parentHref: "/admin/content" }),
  defineRoute({ id: "templates", href: "/admin/templates", labelAr: "القوالب", descriptionAr: "إدارة القوالب وصورها وإعداداتها", sectionId: "content", visibility: "daily", keywords: ["قالب", "تصميم", "صورة"], icon: Layout, parentHref: "/admin/content" }),
  defineRoute({ id: "onboarding-cards", href: "/admin/onboarding-cards", labelAr: "الكروت الترحيبية", descriptionAr: "إدارة نصوص الكروت التوجيهية والترحيبية", sectionId: "content", visibility: "daily", keywords: ["كروت", "ترحيب", "توجيه", "نصوص"], icon: Sparkles, parentHref: "/admin/content" }),
  defineRoute({ id: "themes", href: "/admin/themes", labelAr: "الثيمات", descriptionAr: "إدارة الهوية البصرية المتاحة", sectionId: "content", visibility: "daily", keywords: ["ثيم", "ألوان", "تصميم"], icon: Palette, parentHref: "/admin/content" }),
  defineRoute({ id: "media", href: "/admin/media", labelAr: "مكتبة الوسائط", descriptionAr: "الصور والملفات المستخدمة في المنصة", sectionId: "content", visibility: "daily", keywords: ["صور", "ملفات", "وسائط"], icon: Image, parentHref: "/admin/content" }),
  defineRoute({ id: "revisions", href: "/admin/revisions", labelAr: "سجل التعديلات", descriptionAr: "مراجعة نسخ المحتوى السابقة", sectionId: "content", visibility: "advanced", keywords: ["مراجعات", "نسخ", "استرجاع"], icon: ClipboardList, parentHref: "/admin/content" }),
  defineRoute({ id: "marketing-content", href: "/admin/marketing", labelAr: "محتوى التسويق", descriptionAr: "نصوص صفحات التعريف والتسويق", sectionId: "content", visibility: "advanced", keywords: ["تسويق", "صفحة", "نص"], icon: Share2, parentHref: "/admin/content" }),
  defineRoute({ id: "social-preview", href: "/admin/social-preview", labelAr: "معاينة المشاركة", descriptionAr: "صورة وعنوان الروابط عند مشاركتها", sectionId: "content", visibility: "daily", keywords: ["مشاركة", "صورة", "اجتماعي"], icon: Share2, parentHref: "/admin/content" }),
  defineRoute({ id: "social-preview-settings", href: "/admin/settings/social-preview", labelAr: "إعدادات المشاركة", descriptionAr: "الإعدادات المتقدمة لمعاينة الروابط", sectionId: "content", visibility: "advanced", keywords: ["مشاركة", "إعدادات", "صورة"], icon: Share2, parentHref: "/admin/settings" }),

  defineRoute({ id: "communications", href: "/admin/communications", labelAr: "مركز التواصل", descriptionAr: "الرسائل والإشعارات والدعم والبريد", sectionId: "communication", visibility: "daily", keywords: ["تواصل", "رسائل", "دعم"], icon: MessageSquareText, parentHref: "/admin" }),
  defineRoute({ id: "messages", href: "/admin/messages", labelAr: "رسائل الاشتراك", descriptionAr: "النصوص التي تظهر للعملاء حسب حالتهم", sectionId: "communication", visibility: "daily", keywords: ["رسائل", "اشتراك", "تفعيل"], icon: MessageSquareText, parentHref: "/admin/communications" }),
  defineRoute({ id: "notifications", href: "/admin/notifications", labelAr: "سجل الإشعارات", descriptionAr: "متابعة ما أرسل للعملاء ونتيجته", sectionId: "communication", visibility: "daily", keywords: ["إشعارات", "إرسال", "سجل"], icon: Bell, parentHref: "/admin/communications" }),
  defineRoute({ id: "support", href: "/admin/support", labelAr: "الدعم", descriptionAr: "طلبات الدعم التي تحتاج متابعة", sectionId: "communication", visibility: "daily", keywords: ["دعم", "طلب", "عميل"], icon: Headphones, parentHref: "/admin/communications" }),
  defineRoute({ id: "email", href: "/admin/email", labelAr: "تسليم البريد", descriptionAr: "تشخيص إرسال البريد ونتائج التسليم", sectionId: "communication", visibility: "daily", keywords: ["بريد", "تسليم", "إرسال"], icon: Mail, parentHref: "/admin/communications" }),

  defineRoute({ id: "system", href: "/admin/system", labelAr: "حالة النظام", descriptionAr: "صحة المنصة والأدوات الإدارية", sectionId: "system", visibility: "daily", keywords: ["نظام", "صحة", "حالة"], icon: ShieldCheck, parentHref: "/admin" }),
  defineRoute({ id: "operations", href: "/admin/operations", labelAr: "مركز التشغيل", descriptionAr: "الطوابير والعمليات التي تحتاج تدخلًا", sectionId: "system", visibility: "daily", keywords: ["تشغيل", "عمليات", "طوابير"], icon: Activity, parentHref: "/admin/system" }),
  defineRoute({ id: "errors", href: "/admin/errors", labelAr: "مشاكل العملاء", descriptionAr: "البلاغات والأخطاء التي أرسلها العملاء", sectionId: "system", visibility: "daily", keywords: ["مشاكل", "أخطاء", "بلاغات"], icon: Activity, parentHref: "/admin/system" }),
  defineRoute({ id: "issue-details", href: "/admin/errors/[id]", labelAr: "تفاصيل المشكلة", descriptionAr: "السياق الكامل للمشكلة وخطوات معالجتها", sectionId: "system", visibility: "contextual", keywords: ["مشكلة", "تفاصيل", "حل"], icon: Activity, parentHref: "/admin/errors" }),
  defineRoute({ id: "trash", href: "/admin/trash", labelAr: "سلة المحذوفات", descriptionAr: "استعادة أو حذف نهائي للعملاء المحذوفين", sectionId: "system", visibility: "daily", keywords: ["سلة", "محذوفات", "استعادة", "حذف نهائي"], icon: Trash2, parentHref: "/admin/system" }),
  defineRoute({ id: "backups", href: "/admin/backups", labelAr: "النسخ الاحتياطي", descriptionAr: "إنشاء النسخ والتحقق والاستعادة", sectionId: "system", visibility: "daily", keywords: ["نسخ", "استعادة", "طوارئ"], icon: DatabaseBackup, parentHref: "/admin/system" }),
  defineRoute({ id: "audit", href: "/admin/audit", labelAr: "سجل التدقيق", descriptionAr: "تتبع الإجراءات الحساسة ومن نفذها", sectionId: "system", visibility: "advanced", keywords: ["تدقيق", "سجل", "إجراء"], icon: ClipboardList, parentHref: "/admin/system" }),
  defineRoute({ id: "security", href: "/admin/security", labelAr: "الأمان", descriptionAr: "الجلسات والمخاطر وسياسات الوصول", sectionId: "system", visibility: "advanced", keywords: ["أمان", "جلسات", "وصول"], icon: ShieldCheck, parentHref: "/admin/system" }),
  defineRoute({ id: "jobs", href: "/admin/jobs", labelAr: "المهام الخلفية", descriptionAr: "متابعة المهام المجدولة والمتعثرة", sectionId: "system", visibility: "advanced", keywords: ["مهام", "طابور", "تشغيل"], icon: Activity, parentHref: "/admin/system" }),
  defineRoute({ id: "feature-flags", href: "/admin/feature-flags", labelAr: "الخصائص التجريبية", descriptionAr: "التحكم الآمن في تشغيل الخصائص", sectionId: "system", visibility: "advanced", keywords: ["خصائص", "تجريبية", "تشغيل"], icon: Flag, parentHref: "/admin/system" }),
  defineRoute({ id: "admin-users", href: "/admin/admin-users", labelAr: "المشرفون والصلاحيات", descriptionAr: "المشرفون وأدوارهم وجلساتهم", sectionId: "system", visibility: "advanced", keywords: ["مشرفون", "صلاحيات", "أدوار"], icon: Users, parentHref: "/admin/system" }),
  defineRoute({ id: "settings", href: "/admin/settings", labelAr: "الإعدادات", descriptionAr: "إعدادات المنصة العامة والمتقدمة", sectionId: "system", visibility: "daily", keywords: ["إعدادات", "منصة", "تهيئة"], icon: Settings, parentHref: "/admin" }),
  defineRoute({ id: "health", href: "/admin/health", labelAr: "صحة الخدمات", descriptionAr: "حالة قاعدة البيانات والخدمات الأساسية", sectionId: "system", visibility: "advanced", keywords: ["صحة", "خدمات", "قاعدة"], icon: Activity, parentHref: "/admin/system" }),
  defineRoute({ id: "analytics", href: "/admin/analytics", labelAr: "التحليلات", descriptionAr: "مؤشرات الاستخدام والأداء والنمو", sectionId: "system", visibility: "advanced", keywords: ["تحليلات", "أداء", "نمو"], icon: Activity, parentHref: "/admin/system" }),
  defineRoute({ id: "rendering-diagnostics", href: "/admin/rendering-diagnostics", labelAr: "تشخيص العرض", descriptionAr: "تتبع مشاكل عرض الواجهة عند العملاء", sectionId: "system", visibility: "advanced", keywords: ["تشخيص", "عرض", "واجهة"], icon: Activity, parentHref: "/admin/system" }),
];

const routeByHref = new Map(adminRoutes.map((route) => [route.href, route]));

function routeToNavItem(routeId: string): AdminNavItem {
  const route = adminRoutes.find((item) => item.id === routeId);
  if (!route) {
    throw new Error(`Unknown admin route: ${routeId}`);
  }
  return { href: route.href, label: route.labelAr, icon: route.icon };
}

const sectionDefinitions: Array<Omit<AdminSection, "links"> & { routeIds: string[] }> = [
  { id: "command", title: "القيادة", shortDescription: "ما يحتاج تدخلك الآن", description: "أولويات اليوم والبحث الشامل", accent: "gold", badge: "اليوم", icon: Home, routeIds: ["admin-home", "admin-search"] },
  { id: "customers", title: "العملاء", shortDescription: "العملاء والمواقع", description: "العملاء ومواقعهم وحالة حساباتهم", accent: "green", icon: Users, routeIds: ["customers", "customer-requests", "sites"] },
  { id: "billing", title: "المالية", shortDescription: "المدفوعات والاشتراكات", description: "التحصيل والتجديد والباقات ووسائل الدفع", accent: "blue", icon: CreditCard, routeIds: ["billing", "payments", "subscriptions", "plans", "payment-settings"] },
  { id: "content", title: "المحتوى", shortDescription: "الصفحات والقوالب والوسائط", description: "كل أدوات تحرير ونشر المحتوى", accent: "rose", icon: Palette, routeIds: ["content", "templates", "onboarding-cards", "themes", "media", "social-preview"] },
  { id: "communication", title: "التواصل", shortDescription: "الرسائل والدعم", description: "تجربة العميل والإشعارات والدعم والبريد", accent: "violet", icon: MessageSquareText, routeIds: ["deactivation-control", "communications", "messages", "notifications", "support", "email"] },
  { id: "system", title: "النظام", shortDescription: "الصحة والتشغيل والطوارئ", description: "الأخطاء والنسخ والإعدادات والأدوات المتقدمة", accent: "slate", icon: ShieldCheck, routeIds: ["system", "operations", "errors", "trash", "backups", "settings"] },
];

export const adminSections: AdminSection[] = sectionDefinitions.map(
  ({ routeIds, ...section }) => ({
    ...section,
    links: routeIds.map(routeToNavItem),
  }),
);

export const allAdminLinks: AdminNavItem[] = adminRoutes
  .filter((route) => route.visibility !== "contextual")
  .map((route) => ({ href: route.href, label: route.labelAr, icon: route.icon }));

export const advancedAdminLinks: AdminNavItem[] = adminRoutes
  .filter((route) => route.visibility === "advanced")
  .map((route) => ({ href: route.href, label: route.labelAr, icon: route.icon }));

function routePattern(href: string): RegExp {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const withCatchAll = escaped.replace(/\\\[\\\.\\\.\\\.[^\]]+\\\]/g, ".+");
  const withSegments = withCatchAll.replace(/\\\[[^\]]+\\\]/g, "[^/]+");
  return new RegExp(`^${withSegments}/?$`);
}

export function getAdminRoute(pathname: string): AdminRouteDefinition | undefined {
  const cleanPathname = pathname.split(/[?#]/, 1)[0] || "/admin";
  const direct = routeByHref.get(cleanPathname);
  if (direct) return direct;

  const dynamic = adminRoutes.find((route) =>
    route.href.includes("[") && routePattern(route.href).test(cleanPathname),
  );
  if (dynamic) return dynamic;

  return adminRoutes
    .filter((route) => !route.href.includes("[") && cleanPathname.startsWith(`${route.href}/`))
    .sort((first, second) => second.href.length - first.href.length)[0];
}

export function getAdminBreadcrumbs(
  pathname: string,
): Array<{ label: string; href: string }> {
  const route = getAdminRoute(pathname) ?? routeByHref.get("/admin");
  if (!route) return [];

  const crumbs: Array<{ label: string; href: string }> = [];
  let current: AdminRouteDefinition | undefined = route;

  while (current) {
    crumbs.push({
      label: current.labelAr,
      href: current.href.includes("[") ? pathname : current.href,
    });
    current = current.parentHref ? routeByHref.get(current.parentHref) : undefined;
  }

  const ordered = crumbs.reverse();
  if (ordered[0]?.href !== "/admin") {
    const home = routeByHref.get("/admin");
    if (home) ordered.unshift({ label: home.labelAr, href: home.href });
  }
  return ordered;
}
