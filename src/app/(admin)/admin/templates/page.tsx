import { LayoutTemplate, Palette, Settings } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { TemplateManager } from "@/app/(admin)/admin/templates/template-manager";
import { StarterDefaultsCard } from "@/app/(admin)/admin/templates/starter-defaults-card";
import {
  normalizeTemplateStarterSharedDefaults,
  OFFICIAL_TEMPLATE_STARTER_DEFAULTS,
  TEMPLATE_STARTER_DEFAULTS_CODE,
} from "@/modules/themes/template-starter-defaults";

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
    starterDefaultsSaved?: string;
    error?: string;
  }>;
};

function getMessage(params: Awaited<Props["searchParams"]>) {
  if (params.error) return { tone: "danger" as const, text: decodeURIComponent(params.error) };
  if (params.starterDefaultsSaved) return { tone: "success" as const, text: "تم حفظ بيانات البداية المشتركة لكل القوالب." };
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

  const [templates, themes, publishedTemplates, sharedDefaultsRow] = await Promise.all([
    prisma.template.findMany({
      where: { deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
      orderBy: [{ status: "desc" }, { showroomOrder: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        showroomOrder: true,
        previewData: true,
        settings: true,
        theme: { select: { id: true, name: true, code: true, category: true, status: true } },
      },
    }),
    prisma.theme.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "desc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, status: true },
    }),
    prisma.template.count({
      where: { deletedAt: null, status: "PUBLISHED", code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
    }),
    prisma.template.findUnique({
      where: { code: TEMPLATE_STARTER_DEFAULTS_CODE },
      select: { previewData: true },
    }),
  ]);

  const sharedDefaultsSource = isRecord(sharedDefaultsRow?.previewData)
    ? sharedDefaultsRow.previewData.sharedDefaults
    : null;
  const sharedDefaults = sharedDefaultsSource
    ? normalizeTemplateStarterSharedDefaults(sharedDefaultsSource)
    : OFFICIAL_TEMPLATE_STARTER_DEFAULTS;

  return (
    <AdminPageShell
      badge="المحتوى"
      title="إدارة القوالب الجاهزة"
      description="أدر بيانات البداية المشتركة مرة واحدة، ثم خصص القوالب فقط عند وجود استثناء حقيقي."
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

      <StarterDefaultsCard defaults={sharedDefaults} />

      <TemplateManager
        templates={templates.map((template) => ({
          id: template.id,
          name: template.name,
          code: template.code,
          status: String(template.status),
          showroomOrder: template.showroomOrder,
          previewData: template.previewData,
          settings: template.settings,
          theme: {
            id: template.theme.id,
            name: template.theme.name,
            code: template.theme.code,
            category: template.theme.category ?? "",
            status: String(template.theme.status),
          },
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
