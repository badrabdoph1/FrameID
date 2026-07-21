import { LayoutTemplate, Palette, Settings } from "lucide-react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { TemplatesManager } from "@/app/(admin)/admin/templates/templates-manager";
import { UnifiedContentSection } from "@/app/(admin)/admin/templates/unified-content-section";
import { TEMPLATE_STARTER_DEFAULTS_CODE } from "@/modules/themes/template-starter-defaults";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    saved?: string;
    toggled?: string;
    error?: string;
    unifiedContentSaved?: string;
    created?: string;
    duplicated?: string;
    archived?: string;
  }>;
};

function getMessage(params: Awaited<Props["searchParams"]>) {
  if (params.error) return { tone: "danger" as const, text: decodeURIComponent(params.error) };
  if (params.unifiedContentSaved) return { tone: "success" as const, text: "تم حفظ المحتوى الموحد لكل القوالب." };
  if (params.created) return { tone: "success" as const, text: "تم إنشاء القالب كمسودة." };
  if (params.duplicated) return { tone: "success" as const, text: "تم إنشاء نسخة من القالب." };
  if (params.archived) return { tone: "success" as const, text: "تمت أرشفة القالب." };
  if (params.saved) return { tone: "success" as const, text: "تم حفظ التعديلات." };
  if (params.toggled) return { tone: "success" as const, text: "تم تحديث حالة النشر." };
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let themes: any[] = [];
  let publishedTemplates = 0;

  if (process.env.DATABASE_URL) {
    try {
      [templates, themes, publishedTemplates] = await Promise.all([
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
            settings: true,
            theme: { select: { id: true, name: true, code: true } },
          },
        }),
        prisma.theme.findMany({
          where: { deletedAt: null },
          orderBy: [{ status: "desc" }, { name: "asc" }],
          select: { id: true, name: true, code: true },
        }),
        prisma.template.count({
          where: { deletedAt: null, status: "PUBLISHED", code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
        }),
      ]);
    } catch {
      // Database unavailable — show empty state
    }
  }

  const message = getMessage(params);

  let unifiedContent: Record<string, unknown> = {};
  try {
    const raw = readFileSync(join(process.cwd(), "content", "templates", "unified-content.json"), "utf-8");
    const parsed = JSON.parse(raw);
    unifiedContent = parsed.data ?? {};
  } catch {
    // file not available
  }

  return (
    <AdminPageShell
      badge="المحتوى"
      title="إدارة المحتوى والقوالب"
      description="عدّل المحتوى الموحد لكل القوالب، وعدّل تفاصيل كل قالب بشكل منفصل."
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
        <Metric label="الثيمات المتاحة" value={themes.length} icon={Palette} />
      </section>

      <UnifiedContentSection />

      <TemplatesManager
        templates={templates.map((template) => ({
          id: template.id,
          name: template.name,
          code: template.code,
          status: String(template.status),
          showroomOrder: template.showroomOrder,
          previewImage: pickImage(template.previewData),
          description: isRecord(template.previewData) ? (template.previewData as Record<string, unknown>).description as string ?? "" : "",
          previewData: isRecord(template.previewData) ? (template.previewData as Record<string, unknown>) : {},
          settings: isRecord(template.settings) ? (template.settings as Record<string, unknown>) : {},
          theme: {
            id: template.theme.id,
            name: template.theme.name,
            code: template.theme.code,
          },
        }))}
        themes={themes.map((theme) => ({
          id: theme.id,
          name: theme.name,
          code: theme.code,
        }))}
        unifiedDefaults={unifiedContent}
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
