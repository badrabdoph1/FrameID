import {
  Home,
  Users,
  Globe,
  BadgeCheck,
  CreditCard,
  Layout,
  FileText,
  Image,
  DatabaseBackup,
  BarChart3,
  Bell,
  ClipboardList,
  ShieldCheck,
  Headphones,
  Settings,
  Palette,
  UserCheck,
  Activity,
  BriefcaseBusiness,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export type AdminSection = {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  accent: "gold" | "teal" | "blue" | "rose" | "violet" | "slate" | "green";
  icon: LucideIcon;
  badge?: string;
  links: AdminNavItem[];
};

export const adminNavigation: AdminNavGroup[] = [
  {
    label: "الرئيسية",
    items: [
      { href: "/admin", label: "لوحة القيادة", icon: Home },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { href: "/admin/customers", label: "العملاء", icon: Users },
      { href: "/admin/sites", label: "المواقع", icon: Globe },
      { href: "/admin/subscriptions", label: "الاشتراكات", icon: BadgeCheck },
      { href: "/admin/payments", label: "المدفوعات", icon: CreditCard },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { href: "/admin/templates", label: "القوالب", icon: Layout },
      { href: "/admin/content", label: "المحتوى", icon: FileText },
      { href: "/admin/media", label: "الوسائط", icon: Image },
      { href: "/admin/themes", label: "السمات", icon: Palette },
    ],
  },
  {
    label: "التشغيل",
    items: [
      { href: "/admin/backups", label: "النسخ الاحتياطي", icon: DatabaseBackup },
      { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
      { href: "/admin/audit", label: "سجل التدقيق", icon: ClipboardList },
    ],
  },
  {
    label: "النظام",
    items: [
      { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
      { href: "/admin/errors", label: "الأخطاء", icon: Activity },
      { href: "/admin/security", label: "الأمان", icon: ShieldCheck },
      { href: "/admin/support", label: "الدعم", icon: Headphones },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings },
    ],
  },
];

export const adminSections: AdminSection[] = [
  {
    id: "dashboard",
    title: "الرئيسية",
    shortDescription: "نظرة عامة سريعة",
    description: "نظرة عامة وإحصائيات سريعة",
    accent: "gold",
    badge: "نظرة عامة",
    icon: Home,
    links: [
      { href: "/admin", label: "لوحة القيادة", icon: Home },
      { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
      { href: "/admin/health", label: "صحة النظام", icon: Activity },
    ],
  },
  {
    id: "management",
    title: "الإدارة",
    shortDescription: "العملاء والاشتراكات",
    description: "العملاء والمواقع والاشتراكات",
    accent: "gold",
    badge: "بيانات المنصة",
    icon: Users,

    links: [
      { href: "/admin/customers", label: "العملاء", icon: UserCheck },
      { href: "/admin/sites", label: "المواقع", icon: Globe },
      { href: "/admin/subscriptions", label: "الاشتراكات", icon: BadgeCheck },
      { href: "/admin/payments", label: "المدفوعات", icon: CreditCard },
    ],
  },
  {
    id: "content",
    title: "مساحة العمل",
    shortDescription: "القوالب والوسائط",
    description: "القوالب والوسائط والصفحات",
    accent: "rose",
    badge: "المحتوى",
    icon: Palette,
    links: [
      { href: "/admin/templates", label: "القوالب", icon: Layout },
      { href: "/admin/content", label: "المحتوى", icon: FileText },
      { href: "/admin/media", label: "الوسائط", icon: Image },
      { href: "/admin/themes", label: "السمات", icon: Palette },
    ],
  },
  {
    id: "operations",
    title: "التشغيل",
    shortDescription: "النسخ والمراقبة",
    description: "النسخ والتدقيق والمراقبة",
    accent: "blue",
    badge: "الصيانة",
    icon: DatabaseBackup,
    links: [
      { href: "/admin/backups", label: "النسخ الاحتياطي", icon: DatabaseBackup },
      { href: "/admin/audit", label: "سجل التدقيق", icon: ClipboardList },
      { href: "/admin/errors", label: "الأخطاء", icon: Activity },
    ],
  },
  {
    id: "system",
    title: "النظام",
    shortDescription: "الأمان والدعم",
    description: "الإشعارات والأمان والدعم",
    accent: "slate",
    badge: "إعدادات",
    icon: ShieldCheck,
    links: [
      { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
      { href: "/admin/security", label: "الأمان", icon: ShieldCheck },
      { href: "/admin/support", label: "الدعم", icon: Headphones },
      { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings },
    ],
  },
];

export const clientSections: AdminSection[] = [
  {
    id: "dashboard",
    title: "الرئيسية",
    shortDescription: "نظرة عامة سريعة",
    description: "نظرة عامة على موقعك",
    accent: "gold",
    badge: "الرئيسية",
    icon: Home,
    links: [
      { href: "/dashboard", label: "الرئيسية", icon: Home },
      { href: "/dashboard/services", label: "الخدمات", icon: BriefcaseBusiness as LucideIcon },
    ],
  },
  {
    id: "content",
    title: "المحتوى",
    shortDescription: "موقعك المرئي",
    description: "المحتوى والمعرض والخدمات",
    accent: "rose",
    badge: "المحتوى",
    icon: FileText,
    links: [
      { href: "/dashboard/content", label: "المحتوى", icon: FileText },
      { href: "/dashboard/gallery", label: "المعرض", icon: Image },
      { href: "/dashboard/services", label: "الخدمات", icon: BriefcaseBusiness as LucideIcon },
    ],
  },
  {
    id: "design",
    title: "التصميم",
    shortDescription: "شكل موقعك",
    description: "تخصيص مظهر موقعك",
    accent: "blue",
    badge: "التصميم",
    icon: Palette,
    links: [
      { href: "/dashboard/design", label: "التصميم", icon: Palette },
    ],
  },
  {
    id: "billing",
    title: "الاشتراك",
    shortDescription: "الفاتورة والتفعيل",
    description: "حالة اشتراكك والتفعيل",
    accent: "green",
    badge: "الاشتراك",
    icon: CreditCard,
    links: [
      { href: "/dashboard/billing", label: "التفعيل", icon: CreditCard },
    ],
  },
  {
    id: "settings",
    title: "الإعدادات",
    shortDescription: "بيانات حسابك",
    description: "إعدادات الملف الشخصي",
    accent: "slate",
    badge: "الإعدادات",
    icon: Settings,
    links: [
      { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

export const allAdminLinks = adminSections.flatMap((section) => section.links);
export const allClientLinks = clientSections.flatMap((section) => section.links);
