import { LayoutTemplate, Palette, Settings } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { TemplateReorderList } from "@/app/(admin)/admin/templates/template-reorder-list";
import { UnifiedContentSection } from "@/app/(admin)/admin/templates/unified-content-section";
import { TEMPLATE_STARTER_DEFAULTS_CODE } from "@/modules/themes/template-starter-defaults";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    saved?: string;
    toggled?: string;
    error?: string;
    unifiedContentSaved?: string;
  }>;
};

function getMessage(params: Awaited<Props["searchParams"]>) {
  if (params.error) return { tone: "danger" as const, text: decodeURIComponent(params.error) };
  if (params.unifiedContentSaved) return { tone: "success" as const, text: "تم حفظ المحتوى الموحد لكل القوالب." };
  if (params.saved) return { tone: "success" as const, text: "تم حفظ ترتيب القوالب." };
  if (params.toggled) return { tone: "success" as const, text: "تم تحديث حالة نشر القالب." };
  return null;
}

function pickImage(previewData: unknown): string {
  if (!previewData || typeof previewData !== "object") return "";
  const data = previewData as Record<string, unknown>;
  const direct = data.previewImage ?? data.image ?? data.cover ?? data.thumbnail;
  return typeof direct === "string" ? direct : "";
}

export default async function AdminTemplatesPage({ searchParams }: Props) {
  await requireAdminPermission("templates", "view");
  const params = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let templates: any[] = [];
  let publishedTemplates = 0;
  let themesCount = 0;

  if (process.env.DATABASE_URL) {
    try {
      [templates, publishedTemplates, themesCount] = await Promise.all([
        prisma.template.findMany({
          where: { deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
          orderBy: [{ showroomOrder: "asc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            showroomOrder: true,
            previewData: true,
          },
        }),
        prisma.template.count({
          where: { deletedAt: null, status: "PUBLISHED", code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
        }),
        prisma.theme.count({ where: { deletedAt: null } }),
      ]);
    } catch {
      // Database unavailable — show empty state
    }
  }

  const message = getMessage(params);

  return (
    <AdminPageShell
      badge="المحتوى"
      title="إدارة المحتوى الموحد للقوالب"
      description="عدّل المحتوى مرة واحدة — يطبّق على كل القوالب الجاهزة تلقائيًا، ولا يمس مواقع العملاء المنشأة."
      breadcrumbs={[{ label: "المحتوى", href: "/admin/content" }, { label: "القوالب" }]}
      actions={[
        { label: "الثيمات", href: "/admin/themes", icon: Palette },
        { label: "مركز المحتوى", href: "/admin/content", icon: Settings },
      ]}
    >
      {message ? (
        <div
          className={
            message.tone === "danger"
              ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300"
              : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"
          }
        >
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="كل القوالب" value={templates.length} icon={LayoutTemplate} />
        <Metric label="قوالب منشورة" value={publishedTemplates} accent icon={LayoutTemplate} />
        <Metric label="الثيمات المتاحة" value={themesCount} icon={Palette} />
      </section>

      <UnifiedContentSection />

      <TemplateReorderList
        templates={templates.map((template) => ({
          id: template.id,
          name: template.name,
          code: template.code,
          status: String(template.status),
          showroomOrder: template.showroomOrder,
          previewImage: pickImage(template.previewData),
        }))}
      />
    </AdminPageShell>
  );
}

function Metric({ label, value, accent, icon: Icon }: { label: string; value: number; accent?: boolean; icon: typeof LayoutTemplate }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <span className="grid size-10 place-items-center rounded-2xl bg-white/[0.05] text-white/45"><Icon className="size-4" /></span>
      <span><strong className={accent ? "block text-2xl font-black text-amber-200" : "block text-2xl font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</strong><small className="mt-1 block text-xs font-black text-white/38">{label}</small></span>
    </div>
  );
}
