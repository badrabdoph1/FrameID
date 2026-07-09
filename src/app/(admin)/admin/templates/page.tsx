import Link from "next/link";
import { Eye, Layout, Palette, Settings, Sparkles } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickText(value: unknown, keys: string[], fallback = "") {
  if (!isRecord(value)) return fallback;
  for (const key of keys) {
    const item = value[key];
    if (typeof item === "string" && item.trim()) return item.trim();
  }
  return fallback;
}

function pickImage(value: unknown) {
  if (!isRecord(value)) return "";
  const direct = value.image ?? value.cover ?? value.previewImage ?? value.heroImage ?? value.thumbnail;
  if (typeof direct === "string") return direct;
  const hero = value.hero;
  if (isRecord(hero)) {
    const heroImage = hero.image ?? hero.cover ?? hero.backgroundImage;
    if (typeof heroImage === "string") return heroImage;
  }
  return "";
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "منشور";
  if (status === "ARCHIVED") return "مؤرشف";
  return "مسودة";
}

export default async function AdminTemplatesPage() {
  await requireAdminPermission("templates", "view");

  const [templates, themesCount, publishedTemplates] = await Promise.all([
    prisma.template.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "desc" }, { showroomOrder: "asc" }, { updatedAt: "desc" }],
      include: { theme: { select: { id: true, name: true, code: true, category: true, status: true } } },
    }),
    prisma.theme.count({ where: { deletedAt: null } }),
    prisma.template.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
  ]);

  return (
    <AdminPageShell
      badge="المحتوى"
      title="القوالب"
      description="عرض القوالب بشكل بصري قريب من طريقة ظهورها للعميل بدل صفحة تقنية أو فارغة."
      breadcrumbs={[{ label: "المحتوى", href: "/admin/content" }, { label: "القوالب" }]}
      actions={[{ label: "الثيمات", href: "/admin/themes", icon: Palette }, { label: "سجل القوالب", href: "/admin/content/templates/registry", icon: Settings }]}
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="كل القوالب" value={templates.length} />
        <Metric label="قوالب منشورة" value={publishedTemplates} accent />
        <Metric label="الثيمات" value={themesCount} />
      </section>

      {templates.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-16 text-center">
          <Layout className="mb-3 size-10 text-white/20" />
          <h2 className="text-lg font-black text-white/75">لا توجد قوالب حتى الآن</h2>
          <p className="mt-1 max-w-xl text-sm font-bold leading-7 text-white/42">عند إضافة القوالب ستظهر هنا كمعاينات بصرية يمكن إدارتها بسهولة.</p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-3">
          {templates.map((template) => {
            const previewTitle = pickText(template.previewData, ["title", "headline", "name"], template.name);
            const previewSubtitle = pickText(template.previewData, ["subtitle", "description", "tagline"], template.theme.category);
            const image = pickImage(template.previewData);
            return (
              <article key={template.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/10">
                <div className="relative min-h-56 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(243,207,115,0.18),transparent_42%),linear-gradient(135deg,#171a22,#0d0f14)] p-5">
                  {image ? (
                    <img src={image} alt="" className="absolute inset-0 size-full object-cover opacity-35" />
                  ) : null}
                  <div className="relative z-10 flex h-full min-h-44 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f3cf73] px-3 py-1 text-[0.7rem] font-black text-[#17120a]"><Sparkles className="size-3" /> {template.theme.name}</span>
                      <span className={template.status === "PUBLISHED" ? "rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : "rounded-full bg-white/10 px-2.5 py-1 text-[0.68rem] font-black text-white/48"}>{statusLabel(template.status)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[#fff7e8] drop-shadow">{previewTitle}</h2>
                      <p className="mt-2 line-clamp-2 text-sm font-bold leading-7 text-white/68">{previewSubtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#fff7e8]">{template.name}</h3>
                      <p className="mt-1 truncate font-mono text-xs font-bold text-white/35">{template.code}</p>
                    </div>
                    <span className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2 text-xs font-black text-white/45">ترتيب {template.showroomOrder}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/admin/content/templates/registry`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 text-sm font-black text-[#f3cf73] no-underline transition hover:bg-amber-500/15">
                      <Settings className="size-4" /> إدارة البيانات
                    </Link>
                    <Link href="/admin/content" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/62 no-underline transition hover:bg-white/[0.08] hover:text-white">
                      <Eye className="size-4" /> المحتوى
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </AdminPageShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className={accent ? "text-2xl font-black text-amber-200" : "text-2xl font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </div>
  );
}
