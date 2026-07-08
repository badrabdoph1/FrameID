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
  Flag,
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
      { href: "/admin/operations", label: "Operations", icon: Activity },
      { href: "/admin/search", label: "البحث الشامل", icon: Activity },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { href: "/admin/customers", label: "العملاء", icon: Users },
      { href: "/admin/sites", label: "المواقع", icon: Globe },
      { href: "/admin/plans", label: "الخطط", icon: BadgeCheck },
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
      { href: "/admin/operations", label: "Command Center", icon: Activity },
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
      { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/admin/support", label: "الدعم", icon: Headphones },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings },
      { href: "/admin/settings/payment", label: "إعدادات الدفع", icon: CreditCard },
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
      { href: "/admin/operations", label: "Operations", icon: Activity },
      { href: "/admin/search", label: "البحث الشامل", icon: Activity },
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
      { href: "/admin/plans", label: "الخطط", icon: BadgeCheck },
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
      { href: "/admin/operations", label: "Operations", icon: Activity },
      { href: "/admin/backups", label: "النسخ الاحتياطي", icon: DatabaseBackup },
      { href: "/admin/audit", label: "Audit Explorer", icon: ClipboardList },
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
      { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/admin/support", label: "الدعم", icon: Headphones },
      { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings },
      { href: "/admin/settings/payment", label: "إعدادات الدفع", icon: CreditCard },
    ],
  },
];

export const allAdminLinks = adminSections.flatMap((section) => section.links);
