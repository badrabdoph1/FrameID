import Link from "next/link";
import {
  ArrowLeft,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Layout,
  Navigation,
  Palette,
  Puzzle,
  ScrollText,
  Search,
  Settings,
  Shield,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { getManifest } from "@/lib/content";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

const contentTypes: Record<string, { label: string; description: string; icon: LucideIcon }> = {
  "marketing/homepage": { label: "الصفحة الرئيسية", description: "نصوص وأقسام الصفحة الرئيسية للتسويق", icon: Home },
  "marketing/faq": { label: "الأسئلة الشائعة", description: "أسئلة وأوبة قسم الثقة", icon: HelpCircle },
  "marketing/navigation": { label: "قائمة التنقل", description: "روابط الشريط العلوي للموقع", icon: Navigation },
  "marketing/footer": { label: "التذييل", description: "محتوى التذييل وروابطه السريعة", icon: Layout },
  "legal/privacy": { label: "سياسة الخصوصية", description: "نص سياسة الخصوصية", icon: Shield },
  "legal/terms": { label: "الشروط والأحكام", description: "نص الشروط والأحكام", icon: ScrollText },
  "seo/metadata": { label: "تحسين محركات البحث", description: "البيانات الوصفية للصفحات", icon: Search },
  "settings/platform": { label: "إعدادات المنصة", description: "إعدادات عامة للمنصة", icon: Settings },
  "templates/registry": { label: "سجل القوالب", description: "بيانات القوالب المسجلة", icon: Puzzle },
};

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdminPermission("content", "view");
  const manifest = getManifest();

  const [templatesCount, themesCount, mediaCount, publishedThemes, recentMedia] = await Promise.all([
    prisma.template.count(),
    prisma.theme.count(),
    prisma.mediaAsset.count({ where: { deletedAt: null } }),
    prisma.theme.count({ where: { status: "PUBLISHED" } }),
    prisma.mediaAsset.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, storageKey: true, mimeType: true, sizeBytes: true, createdAt: true },
    }),
  ]);

  const contentEntries = Object.entries(contentTypes).map(([key, config]) => ({ key, config, entry: manifest[key] }));

  return (
    <AdminPageShell
      badge="المحتوى"
      title="Content Workspace"
      description="كل ما يخص واجهة المنصة ومكتبة القوالب والوسائط في مكان واحد."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "المحتوى" }]}
      actions={[
        { label: "القوالب", href: "/admin/templates", icon: Layout },
        { label: "الوسائط", href: "/admin/media", icon: ImageIcon },
      ]}
    >
      <div className="grid gap-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="القوالب" value={templatesCount} icon={Layout} href="/admin/templates" />
          <MetricCard label="الثيمات" value={themesCount} icon={Palette} href="/admin/themes" />
          <MetricCard label="ثيمات منشورة" value={publishedThemes} icon={Sparkles} href="/admin/themes" />
          <MetricCard label="ملفات الوسائط" value={mediaCount} icon={ImageIcon} href="/admin/media" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <WorkspacePanel title="مراكز المحتوى" description="روابط سريعة لأهم مهام المحتوى اليومية." href="/admin/templates" cta="إدارة القوالب">
            <div className="grid gap-2 sm:grid-cols-2">
              <PrimaryLink href="/admin/templates" icon={Layout} label="القوالب" description="قوالب مواقع المصورين" />
              <PrimaryLink href="/admin/themes" icon={Palette} label="الثيمات" description="ألوان وإعدادات القوالب" />
              <PrimaryLink href="/admin/media" icon={ImageIcon} label="الوسائط" description="الصور والملفات المشتركة" />
              <PrimaryLink href="/admin/content/templates/registry" icon={Puzzle} label="سجل القوالب" description="بيانات القوالب المسجلة" />
            </div>
          </WorkspacePanel>

          <WorkspacePanel title="محتوى الموقع" description="النصوص الثابتة في موقع FrameID التسويقي والقانوني." href="/admin/content/marketing/homepage" cta="تعديل الصفحة الرئيسية">
            <div className="grid gap-2 sm:grid-cols-2">
              {contentEntries.slice(0, 8).map(({ key, config, entry }) => {
                const Icon = config.icon;
                return (
                  <Link key={key} href={`/admin/content/${key.replace("/", "/")}`} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white no-underline transition hover:-translate-y-0.5 hover:border-amber-300/30 hover:bg-amber-300/8">
                    <div className="flex items-start justify-between gap-3">
                      <Icon className="mt-0.5 size-5 shrink-0 text-[#f3cf73]" aria-hidden />
                      <span className="truncate text-left font-mono text-[0.68rem] text-white/30" dir="ltr">{key}</span>
                    </div>
                    <strong className="mt-3 block text-sm font-black text-[#fff7e8]">{config.label}</strong>
                    <span className="mt-1 block text-xs font-bold leading-5 text-white/50">{config.description}</span>
                    {entry ? <span className="mt-2 block text-[0.68rem] font-bold text-white/30">v{entry.version} · {new Date(entry.updatedAt).toLocaleDateString("ar-EG")}</span> : null}
                  </Link>
                );
              })}
            </div>
          </WorkspacePanel>
        </section>

        <WorkspacePanel title="آخر الوسائط" description="أحدث الملفات المرفوعة لمراجعة سريعة." href="/admin/media" cta="فتح مكتبة الوسائط">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {recentMedia.length === 0 ? <EmptyState text="لا توجد وسائط مرفوعة بعد." /> : recentMedia.map((asset) => (
              <Link key={asset.id} href="/admin/media" className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/24 hover:bg-amber-300/8">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><ImageIcon className="size-5" aria-hidden /></span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-black text-[#fff7e8]">{asset.storageKey.split("/").pop() ?? asset.storageKey}</strong>
                  <small className="mt-1 block truncate text-xs font-bold text-white/38">{asset.mimeType} · {Math.round(asset.sizeBytes / 1024)} KB · {new Date(asset.createdAt).toLocaleDateString("ar-EG")}</small>
                </span>
              </Link>
            ))}
          </div>
        </WorkspacePanel>
      </div>
    </AdminPageShell>
  );
}

function MetricCard({ label, value, icon: Icon, href }: { label: string; value: number; icon: LucideIcon; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/24 hover:bg-amber-300/8">
      <Icon className="size-5 text-[#f3cf73]" aria-hidden />
      <p className="mt-3 text-xs font-black text-white/42">{label}</p>
      <p className="mt-1 truncate text-2xl font-black text-[#fff7e8]">{value.toLocaleString("ar-EG")}</p>
    </Link>
  );
}

function WorkspacePanel({ title, description, href, cta, children }: { title: string; description: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <header className="flex items-start justify-between gap-3 border-b border-white/8 p-4">
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
          <p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p>
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/62 no-underline transition hover:bg-white/[0.08] hover:text-white">
          {cta}
          <ArrowLeft className="size-3.5" aria-hidden />
        </Link>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function PrimaryLink({ href, icon: Icon, label, description }: { href: string; icon: LucideIcon; label: string; description: string }) {
  return (
    <Link href={href} className="grid gap-2 rounded-2xl border border-white/8 bg-white/[0.035] p-4 no-underline transition hover:border-amber-300/24 hover:bg-amber-300/8">
      <Icon className="size-5 text-[#f3cf73]" aria-hidden />
      <strong className="text-sm font-black text-[#fff7e8]">{label}</strong>
      <span className="text-xs font-bold leading-5 text-white/42">{description}</span>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/12 bg-black/15 p-6 text-center text-sm font-bold text-white/40">{text}</div>;
}
