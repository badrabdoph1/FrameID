import {
  Home,
  Users,
  Globe,
  BadgeCheck,
  CreditCard,
  Layout,
  Image,
  DatabaseBackup,
  Bell,
  ClipboardList,
  ShieldCheck,
  Headphones,
  Settings,
  Palette,
  Activity,
  Flag,
  Mail,
  Search,
  BriefcaseBusiness,
  MessageSquareText,
  Share2,
  Edit,
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
      { href: "/admin", label: "لوحة القيادة", icon: Home },
      { href: "/admin/search", label: "بحث سريع", icon: Search },
    ],
  },
  {
    id: "backups",
    title: "النسخ الاحتياطي",
    shortDescription: "نسخ واستعادة وطوارئ",
    description: "مركز متكامل للنسخ الاحتياطي والاستعادة وإدارة الطوارئ",
    accent: "gold",
    badge: "حرج",
    icon: DatabaseBackup,
    links: [
      { href: "/admin/backups", label: "مركز النسخ الاحتياطي", icon: DatabaseBackup },
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
      { href: "/admin/customers", label: "مركز العملاء", icon: Users },
      { href: "/admin/sites", label: "المواقع", icon: Globe },
    ],
  },
  {
    id: "billing",
    title: "المالية",
    shortDescription: "المدفوعات والاشتراكات",
    description: "المدفوعات والاشتراكات والباقات وإعدادات الدفع",
    accent: "blue",
    badge: "مالية",
    icon: CreditCard,
    links: [
      { href: "/admin/billing", label: "نظرة عامة", icon: BriefcaseBusiness },
      { href: "/admin/payments", label: "مراجعة المدفوعات", icon: CreditCard },
      { href: "/admin/subscriptions", label: "الاشتراكات", icon: BadgeCheck },
      { href: "/admin/plans", label: "الباقات", icon: BadgeCheck },
      { href: "/admin/settings/payment", label: "إعدادات الدفع", icon: Settings },
    ],
  },
  {
    id: "content",
    title: "المحتوى",
    shortDescription: "القوالب والوسائط والمحرر",
    description: "Page Studio والقوالب والثيمات والوسائط ومعاينة المشاركة",
    accent: "rose",
    badge: "محتوى",
    icon: Palette,
    links: [
      { href: "/admin/content", label: "مركز المحتوى", icon: Palette },
      { href: "/admin/page-studio", label: "محرر الصفحات", icon: Edit },
      { href: "/admin/templates", label: "القوالب", icon: Layout },
      { href: "/admin/themes", label: "الثيمات", icon: Palette },
      { href: "/admin/media", label: "الوسائط", icon: Image },
      { href: "/admin/social-preview", label: "معاينة المشاركة", icon: Share2 },
    ],
  },
  {
    id: "messages",
    title: "التواصل",
    shortDescription: "الرسائل والإشعارات والدعم",
    description: "إرسال الرسائل والإشعارات والدعم والبريد",
    accent: "violet",
    badge: "تواصل",
    icon: MessageSquareText,
    links: [
      { href: "/admin/messages", label: "الرسائل", icon: MessageSquareText },
      { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
      { href: "/admin/support", label: "الدعم", icon: Headphones },
      { href: "/admin/email", label: "البريد", icon: Mail },
    ],
  },
  {
    id: "system",
    title: "النظام",
    shortDescription: "الأخطاء والسجلات والأمان",
    description: "أخطاء المنصة والسجلات والأمان والإعدادات",
    accent: "slate",
    badge: "نظام",
    icon: ShieldCheck,
    links: [
      { href: "/admin/system", label: "نظرة عامة", icon: ShieldCheck },
      { href: "/admin/errors", label: "مشاكل العملاء", icon: Activity },
      { href: "/admin/audit", label: "السجلات", icon: ClipboardList },
      { href: "/admin/security", label: "الأمان", icon: ShieldCheck },
      { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/admin/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

export const allAdminLinks = adminSections.flatMap((section) => section.links);
