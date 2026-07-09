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
  Mail,
  Search,
  BriefcaseBusiness,
  type LucideIcon,
} from "lucide-react";

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
    label: "الاستخدام اليومي",
    items: [
      { href: "/admin", label: "القيادة", icon: Home },
      { href: "/admin/customers", label: "العملاء", icon: Users },
      { href: "/admin/billing", label: "الاشتراكات والدفع", icon: CreditCard },
      { href: "/admin/content", label: "المحتوى", icon: Palette },
      { href: "/admin/system", label: "النظام", icon: ShieldCheck },
    ],
  },
  {
    label: "أدوات متقدمة",
    items: [
      { href: "/admin/search", label: "البحث الشامل", icon: Search },
      { href: "/admin/operations", label: "Operations", icon: Activity },
      { href: "/admin/jobs", label: "Jobs Queue", icon: Activity },
      { href: "/admin/email", label: "Email Center", icon: Mail },
      { href: "/admin/security", label: "الأمان", icon: ShieldCheck },
      { href: "/admin/admin-users", label: "Admin Users", icon: UserCheck },
      { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/admin/support", label: "الدعم", icon: Headphones },
    ],
  },
];

export const advancedAdminLinks: AdminNavItem[] = [
  { href: "/admin/search", label: "البحث الشامل", icon: Search },
  { href: "/admin/operations", label: "Operations", icon: Activity },
  { href: "/admin/jobs", label: "Jobs Queue", icon: Activity },
  { href: "/admin/email", label: "Email Center", icon: Mail },
  { href: "/admin/security", label: "الأمان", icon: ShieldCheck },
  { href: "/admin/admin-users", label: "Admin Users", icon: UserCheck },
  { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
  { href: "/admin/support", label: "الدعم", icon: Headphones },
  { href: "/admin/analytics", label: "التحليلات", icon: BarChart3 },
  { href: "/admin/health", label: "صحة النظام", icon: Activity },
];

export const adminSections: AdminSection[] = [
  {
    id: "command",
    title: "القيادة",
    shortDescription: "ما يحتاج تدخلك الآن",
    description: "العمل اليومي والتنبيهات المهمة",
    accent: "gold",
    badge: "اليوم",
    icon: Home,
    links: [
      { href: "/admin", label: "Dashboard", icon: Home },
      { href: "/admin/search", label: "بحث سريع", icon: Search },
    ],
  },
  {
    id: "customers",
    title: "العملاء",
    shortDescription: "العملاء والمواقع",
    description: "كل ما يخص العميل في Workspace واحد",
    accent: "green",
    badge: "العملاء",
    icon: Users,
    links: [
      { href: "/admin/customers", label: "Workspace العملاء", icon: Users },
      { href: "/admin/sites", label: "المواقع", icon: Globe },
      { href: "/admin/customers/new", label: "إضافة عميل", icon: UserCheck },
    ],
  },
  {
    id: "billing",
    title: "المال",
    shortDescription: "الاشتراكات والدفع",
    description: "طلبات الدفع والاشتراكات والباقات",
    accent: "blue",
    badge: "Revenue",
    icon: CreditCard,
    links: [
      { href: "/admin/billing", label: "Workspace المال", icon: BriefcaseBusiness },
      { href: "/admin/payments", label: "مراجعة المدفوعات", icon: CreditCard },
      { href: "/admin/subscriptions", label: "الاشتراكات", icon: BadgeCheck },
      { href: "/admin/plans", label: "الباقات", icon: BadgeCheck },
      { href: "/admin/settings/payment", label: "إعدادات الدفع", icon: Settings },
    ],
  },
  {
    id: "content",
    title: "المحتوى",
    shortDescription: "القوالب والوسائط",
    description: "القوالب والثيمات والمحتوى المشترك",
    accent: "rose",
    badge: "Studio",
    icon: Palette,
    links: [
      { href: "/admin/content", label: "Workspace المحتوى", icon: Palette },
      { href: "/admin/templates", label: "القوالب", icon: Layout },
      { href: "/admin/themes", label: "الثيمات", icon: Palette },
      { href: "/admin/media", label: "الوسائط", icon: Image },
      { href: "/admin/content", label: "محتوى الموقع", icon: FileText },
    ],
  },
  {
    id: "system",
    title: "النظام",
    shortDescription: "الأخطاء والنسخ والسجلات",
    description: "صحة المنصة والمراقبة والإعدادات",
    accent: "slate",
    badge: "System",
    icon: ShieldCheck,
    links: [
      { href: "/admin/system", label: "Workspace النظام", icon: ShieldCheck },
      { href: "/admin/errors", label: "الأخطاء", icon: Activity },
      { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
      { href: "/admin/backups", label: "النسخ الاحتياطي", icon: DatabaseBackup },
      { href: "/admin/audit", label: "السجلات", icon: ClipboardList },
      { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings },
    ],
  },
];

export const allAdminLinks = [
  ...adminSections.flatMap((section) => section.links),
  ...advancedAdminLinks,
];
