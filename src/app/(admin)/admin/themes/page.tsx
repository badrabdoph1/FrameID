import Link from "next/link";
import { Palette } from "lucide-react";

import { AdminEmptyState, AdminStatusBadge } from "@/components/admin/admin-workspace-primitives";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

const status = { PUBLISHED: { label: "منشور", tone: "success" as const }, DRAFT: { label: "مسودة", tone: "warning" as const }, ARCHIVED: { label: "مؤرشف", tone: "neutral" as const } };

export default async function AdminThemesPage() {
  await requireAdminPermission("themes", "view");

  let themes: any[] = [];
  if (process.env.DATABASE_URL) {
    try {
      themes = await prisma.theme.findMany({ where: { deletedAt: null }, orderBy: [{ status: "desc" }, { updatedAt: "desc" }], select: { id: true, code: true, name: true, category: true, version: true, status: true, updatedAt: true, _count: { select: { sites: true, templates: true } } } });
    } catch {
      // Database unavailable
    }
  }
  return (
    <AdminPageShell badge="المحتوى" title="الثيمات" description="مرجع الثيمات المستخدمة فعليًا وعدد القوالب والمواقع المرتبطة بكل ثيم." breadcrumbs={[{ label: "المحتوى", href: "/admin/content" }, { label: "الثيمات" }]} actions={[{ label: "إدارة القوالب", href: "/admin/templates", icon: Palette }]}>
      <section aria-label="قائمة الثيمات" className="grid gap-3">
        {themes.length === 0 ? <AdminEmptyState title="لا توجد ثيمات" description="أنشئ الثيم من مسار التطوير ثم سيظهر هنا تلقائيًا." icon={Palette} /> : themes.map((theme: { id: string; status: keyof typeof status; name: string; code: string; version: string; category: string | null; updatedAt: Date; _count: { sites: number; templates: number } }) => {
          const meta = status[theme.status as keyof typeof status];
          return <article key={theme.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-[#fff7e8]">{theme.name}</h2><AdminStatusBadge label={meta.label} tone={meta.tone} /></div><p className="mt-1 text-xs font-bold text-white/42">{theme.code} · الإصدار {theme.version} · {theme.category ?? "بلا تصنيف"}</p><p className="mt-2 text-sm font-bold text-white/55">{theme._count.templates.toLocaleString("ar-EG")} قوالب · {theme._count.sites.toLocaleString("ar-EG")} مواقع</p></div><Link href={`/admin/templates?theme=${theme.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-black text-white/70 no-underline hover:bg-white/5">عرض القوالب</Link></article>;
        })}
      </section>
    </AdminPageShell>
  );
}
