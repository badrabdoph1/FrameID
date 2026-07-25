import { LayoutTemplate, Palette, Settings } from "lucide-react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { TemplatesManager } from "@/app/(admin)/admin/templates/templates-manager";
import { UnifiedContentSection } from "@/app/(admin)/admin/templates/unified-content-section";
import { TEMPLATE_STARTER_DEFAULTS_CODE } from "@/modules/themes/template-starter-defaults";
import { ensureTemplatesInDatabase } from "@/app/(admin)/admin/templates/sync-template-definitions-action";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
    unifiedContentSaved?: string;
    created?: string;
    duplicated?: string;
    archived?: string;
  }>;
};

function getMessage(params: Awaited<Props["searchParams"]>) {
  if (params.error) return { tone: "danger" as const, text: decodeURIComponent(params.error) };
  if (params.unifiedContentSaved) return { tone: "success" as const, text: "تم حفظ المحتوى الموحد." };
  if (params.created) return { tone: "success" as const, text: "تم إنشاء القالب." };
  if (params.duplicated) return { tone: "success" as const, text: "تم إنشاء نسخة من القالب." };
  if (params.archived) return { tone: "success" as const, text: "تمت أرشفة القالب." };
  if (params.saved) return { tone: "success" as const, text: "تم حفظ التعديلات." };
  return null;
}

function pickImage(previewData: unknown): string {
  if (!previewData || typeof previewData !== "object") return "";
  const data = previewData as Record<string, unknown>;
  const direct = data.previewImage ?? data.image ?? data.cover ?? data.thumbnail;
  return typeof direct === "string" ? direct : "";
}

function pickDesc(previewData: unknown): string {
  if (!previewData || typeof previewData !== "object") return "";
  const data = previewData as Record<string, unknown>;
  return typeof data.description === "string" ? data.description : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default async function AdminTemplatesPage({ searchParams }: Props) {
  await requireAdminPermission("templates", "view");
  const params = await searchParams;

  // إنشاء أي قوالب/ثيمات جديدة في قاعدة البيانات تلقائياً
  await ensureTemplatesInDatabase();

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
            id: true, name: true, code: true, status: true, showroomOrder: true,
            previewData: true, settings: true,
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
    } catch { /* DB unavailable */ }
  }

  let unifiedContent: Record<string, unknown> = {};
  try {
    const raw = readFileSync(join(process.cwd(), "content", "templates", "unified-content.json"), "utf-8");
    const parsed = JSON.parse(raw);
    unifiedContent = parsed.data ?? {};
  } catch { /* file not available */ }

  const message = getMessage(params);
  const previewDataCache = new Map<string, Record<string, unknown>>();

  return (
    <AdminPageShell
      badge="المحتوى"
      title="إدارة المحتوى والقوالب"
      description="عدّل المحتوى الموحد لكل القوالب، واضغط على أي قالب لتعديل تفاصيله."
      breadcrumbs={[{ label: "المحتوى", href: "/admin/content" }, { label: "القوالب" }]}
      actions={[
        { label: "الثيمات", href: "/admin/themes", icon: Palette },
        { label: "مركز المحتوى", href: "/admin/content", icon: Settings },
      ]}
    >
      {message ? (
        <div className={message.tone === "danger" ? "rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300" : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300"}>
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-2 sm:grid-cols-3">
        <Metric label="كل القوالب" value={templates.length} icon={LayoutTemplate} />
        <Metric label="قوالب منشورة" value={publishedTemplates} accent icon={LayoutTemplate} />
        <Metric label="الثيمات" value={themes.length} icon={Palette} />
      </section>

      <UnifiedContentSection />

      <TemplatesManager
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          code: t.code,
          status: String(t.status),
          showroomOrder: t.showroomOrder,
          previewImage: pickImage(t.previewData),
          description: pickDesc(t.previewData),
          previewData: isRecord(t.previewData) ? (t.previewData as Record<string, unknown>) : {},
          settings: isRecord(t.settings) ? (t.settings as Record<string, unknown>) : {},
          theme: { id: t.theme.id, name: t.theme.name, code: t.theme.code },
        }))}
        themes={themes.map((t) => ({ id: t.id, name: t.name, code: t.code }))}
        unifiedDefaults={unifiedContent}
      />
    </AdminPageShell>
  );
}

function Metric({ label, value, accent, icon: Icon }: { label: string; value: number; accent?: boolean; icon: typeof LayoutTemplate }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <span className="grid size-8 place-items-center rounded-xl bg-white/[0.05] text-white/40"><Icon className="size-3.5" /></span>
      <span>
        <strong className={accent ? "block text-lg font-black text-amber-200" : "block text-lg font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</strong>
        <small className="block text-[0.6rem] font-black text-white/35">{label}</small>
      </span>
    </div>
  );
}
