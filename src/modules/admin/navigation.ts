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
