import { LayoutTemplate, Palette, Settings } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { TemplateManager } from "@/app/(admin)/admin/templates/template-manager";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    saved?: string;
    toggled?: string;
    created?: string;
    duplicated?: string;
    restored?: string;
    archived?: string;
    coverSaved?: string;
    visualSaved?: string;
    error?: string;
  }>;
};

function getMessage(params: Awaited<Props["searchParams"]>) {
  if (params.error) {
    return { tone: "danger" as const, text: decodeURIComponent(params.error) };
  }
  if (params.visualSaved) return { tone: "success" as const, text: "تم تحديث صورة القالب من الجهاز." };
  if (params.coverSaved) return { tone: "success" as const, text: "تم تحديث غلاف بطاقة القالب." };
  if (params.created) return { tone: "success" as const, text: "تم إنشاء القالب كمسودة ويمكنك تعديله الآن." };
  if (params.duplicated) return { tone: "success" as const, text: "تم إنشاء نسخة مستقلة من القالب." };
  if (params.restored) return { tone: "success" as const, text: "تمت استعادة الإعدادات الافتراضية للقالب." };
  if (params.archived) return { tone: "success" as const, text: "تمت أرشفة القالب وإخفاؤه من القائمة." };
  if (params.saved) return { tone: "success" as const, text: "تم حفظ كل تعديلات القالب." };
  if (params.toggled) return { tone: "success" as const, text: "تم تحديث حالة نشر القالب." };
  return null;
}

export default async function AdminTemplatesPage({ searchParams }: Props) {
  await requireAdminPermission("templates", "view");
  const params = await searchParams;

  const [templates, themes, publishedTemplates] = await Promise.all([
    prisma.template.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "desc" }, { showroomOrder: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        showroomOrder: true,
        previewData: true,
        settings: true,
        theme: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            status: true,
          },
        },
      },
    }),
    prisma.theme.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "desc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, status: true },
    }),
    prisma.template.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
  ]);

  return (
    <AdminPageShell
      badge="المحتوى"
      title="إدارة القوالب الجاهزة"
      description="أنشئ القوالب وعدّل النصوص والصور والباقات والإضافات من واجهة واضحة، ثم عاين النتيجة وانشرها."
      breadcrumbs={[{ label: "المحتوى", href: "/admin/content" }, { label: "القوالب" }]}
      actions={[
        { label: "الثيمات", href: "/admin/themes", icon: Palette },
        { label: "مركز المحتوى", href: "/admin/content", icon: Settings },
      ]}
    >
      <style>{`
        label:has(> input[name="previewImage"]),
        label:has(> input[name="heroImageUrl"]),
        label:has(> input[name$="_imageUrl"]),
        label:has(> input[name="newPackageImageUrl"]) { display: none; }
      `}</style>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="كل القوالب" value={templates.length} icon={LayoutTemplate} />
        <Metric label="قوالب منشورة" value={publishedTemplates} accent icon={LayoutTemplate} />
        <Metric label="الثيمات المتاحة" value={themes.length} icon={Palette} />
      </section>

      <TemplateManager
        templates={templates.map((template) => ({
          ...template,
          status: String(template.status),
          theme: { ...template.theme, status: String(template.theme.status) },
        }))}
        themes={themes.map((theme) => ({ ...theme, status: String(theme.status) }))}
        message={getMessage(params)}
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
