import Link from "next/link";
import {
  HelpCircle,
  History,
  Home,
  Image as ImageIcon,
  Layout,
  Navigation,
  Palette,
  Megaphone,
  ScrollText,
  Search,
  Settings,
  Shield,
  Sparkles,
  Share2,
  type LucideIcon,
} from "lucide-react";

import { getManifest } from "@/lib/content";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

const contentTypes: Record<string, { label: string; description: string; icon: LucideIcon }> = {
  "marketing/homepage": { label: "الصفحة الرئيسية", description: "نصوص وأقسام الصفحة الرئيسية للتسويق", icon: Home },
  "marketing/faq": { label: "الأسئلة الشائعة", description: "أسئلة وأجوبة قسم الثقة", icon: HelpCircle },
  "marketing/navigation": { label: "قائمة التنقل", description: "روابط الشريط العلوي للموقع", icon: Navigation },
  "marketing/footer": { label: "التذييل", description: "محتوى التذييل وروابطه السريعة", icon: Layout },
  "legal/privacy": { label: "سياسة الخصوصية", description: "نص سياسة الخصوصية", icon: Shield },
  "legal/terms": { label: "الشروط والأحكام", description: "نص الشروط والأحكام", icon: ScrollText },
  "seo/metadata": { label: "تحسين محركات البحث", description: "البيانات الوصفية للصفحات", icon: Search },
  "settings/platform": { label: "إعدادات المنصة", description: "إعدادات عامة للمنصة", icon: Settings },
};

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdminPermission("content", "view");
  const manifest = getManifest();

  const [templatesCount, themesCount, mediaCount, publishedThemes] = await Promise.all([
    prisma.template.count(),
    prisma.theme.count(),
    prisma.mediaAsset.count({ where: { deletedAt: null } }),
    prisma.theme.count({ where: { status: "PUBLISHED" } }),
  ]);

  const contentEntries = Object.entries(contentTypes).map(([key, config]) => ({ key, config, entry: manifest[key] }));

  return (
    <AdminPageShell
      badge="المحتوى"
      title="إدارة المحتوى"
      description="بوابة مختصرة للقوالب والوسائط ونصوص موقع FrameID. كل نوع محتوى يُعدّل في مكان واحد."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "المحتوى" }]}
    >
      <div className="grid gap-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="القوالب" value={templatesCount} icon={Layout} />
          <Metric label="الثيمات" value={themesCount} icon={Palette} />
          <Metric label="ثيمات منشورة" value={publishedThemes} icon={Sparkles} />
          <Metric label="ملفات الوسائط" value={mediaCount} icon={ImageIcon} />
        </section>

        <nav aria-label="أقسام المحتوى" className="grid gap-2 border-y border-white/8 py-3 sm:grid-cols-2 xl:grid-cols-3">
          <ManagementLink href="/admin/templates" icon={Layout} label="إدارة القوالب" />
          <ManagementLink href="/admin/themes" icon={Palette} label="إعدادات الثيمات" />
          <ManagementLink href="/admin/media" icon={ImageIcon} label="مكتبة الوسائط" />
          <ManagementLink href="/admin/page-studio" icon={Home} label="محرر صفحات المنصة" />
          <ManagementLink href="/admin/marketing" icon={Megaphone} label="أدوات التسويق" />
          <ManagementLink href="/admin/social-preview" icon={Share2} label="معاينة المشاركة" />
          <ManagementLink href="/admin/revisions" icon={History} label="سجل تعديلات المحتوى" />
        </nav>

        <section className="border-t border-white/8 pt-4">
          <header>
            <h2 className="text-base font-black text-[#fff7e8]">محتوى الموقع</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/45">النصوص الثابتة في موقع FrameID التسويقي والقانوني.</p>
          </header>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {contentEntries.map(({ key, config, entry }) => {
              const Icon = config.icon;
              return (
                <Link key={key} href={`/admin/content/${key}`} className="group flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-white no-underline transition hover:border-amber-300/25 hover:bg-amber-300/8">
                  <Icon className="mt-0.5 size-4 shrink-0 text-[#f3cf73]" aria-hidden />
                  <span className="min-w-0"><strong className="block text-sm font-black text-[#fff7e8]">{config.label}</strong><span className="mt-1 block text-xs font-bold leading-5 text-white/45">{config.description}</span>{entry ? <small className="mt-1 block text-[0.68rem] font-bold text-white/30">آخر تحديث {new Date(entry.updatedAt).toLocaleDateString("ar-EG")}</small> : null}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <Icon className="size-5 text-[#f3cf73]" aria-hidden />
      <p className="mt-3 text-xs font-black text-white/42">{label}</p>
      <p className="mt-1 truncate text-2xl font-black text-[#fff7e8]">{value.toLocaleString("ar-EG")}</p>
    </div>
  );
}

function ManagementLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 no-underline transition hover:border-amber-300/25 hover:bg-amber-300/8">
      <Icon className="size-4 text-[#f3cf73]" aria-hidden />
      <strong className="text-sm font-black text-[#fff7e8]">{label}</strong>
    </Link>
  );
}
