import Link from "next/link";
import { getManifest } from "@/lib/content";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import {
  Home,
  HelpCircle,
  Navigation,
  Layout,
  Shield,
  ScrollText,
  Search,
  Settings,
  Puzzle,
  FileText,
} from "lucide-react";

const contentTypes: Record<
  string,
  { label: string; description: string; icon: typeof Home }
> = {
  "marketing/homepage": { label: "الصفحة الرئيسية", description: "نصوص وأقسام الصفحة الرئيسية للتسويق", icon: Home },
  "marketing/faq": { label: "الأسئلة الشائعة", description: "أسئلة وأجوبة قسم الثقة", icon: HelpCircle },
  "marketing/navigation": { label: "قائمة التنقل", description: "روابط الشريط العلوي للموقع", icon: Navigation },
  "marketing/footer": { label: "التذييل", description: "محتوى التذييل وروابطه السريعة", icon: Layout },
  "legal/privacy": { label: "سياسة الخصوصية", description: "نص سياسة الخصوصية", icon: Shield },
  "legal/terms": { label: "الشروط والأحكام", description: "نص الشروط والأحكام", icon: ScrollText },
  "seo/metadata": { label: "تحسين محركات البحث", description: "البيانات الوصفية للصفحات", icon: Search },
  "settings/platform": { label: "إعدادات المنصة", description: "إعدادات عامة للمنصة", icon: Settings },
  "templates/registry": { label: "سجل القوالب", description: "بيانات القوالب المسجلة", icon: Puzzle },
};

export default function AdminContentPage() {
  const manifest = getManifest();

  return (
    <AdminPageShell
      badge="المحتوى"
      title="Content Studio"
      description="إدارة محتوى المنصة من ملفات JSON مباشرة. التغييرات تنعكس فوراً."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "Content Studio" }]}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(contentTypes).map(([key, config]) => {
          const entry = manifest[key];
          const Icon = config.icon;
          return (
            <Link
              key={key}
              href={`/admin/content/${key.replace("/", "/")}`}
              className="group rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.07] p-5 text-white transition hover:-translate-y-0.5 hover:border-champagne/45 hover:bg-white/[0.1]"
            >
              <div className="flex items-start justify-between gap-3">
                <Icon className="size-5 text-champagne shrink-0 mt-0.5" aria-hidden />
                <span className="text-[11px] text-white/30 font-mono dir-ltr text-left grow">
                  {key}
                </span>
              </div>
              <span className="mt-3 block font-semibold">{config.label}</span>
              <span className="mt-1 block text-sm text-white/55">
                {config.description}
              </span>
              {entry && (
                <span className="mt-2 block text-[11px] text-white/30">
                  v{entry.version} · آخر تحديث: {new Date(entry.updatedAt).toLocaleDateString("ar-SA")}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
