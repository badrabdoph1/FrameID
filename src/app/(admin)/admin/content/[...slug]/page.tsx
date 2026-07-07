import { notFound } from "next/navigation";
import { getContent, getManifest, ContentSchemas } from "@/lib/content";
import type { ContentSchemaKey } from "@/lib/content";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { ContentEditor } from "@/components/content/content-editor";

type Props = {
  params: Promise<{ slug: string[] }>;
};

const contentLabels: Partial<Record<ContentSchemaKey, { label: string; description: string }>> = {
  "marketing/homepage": { label: "الصفحة الرئيسية", description: "تحرير نصوص وأقسام الصفحة الرئيسية" },
  "marketing/faq": { label: "الأسئلة الشائعة", description: "تحرير الأسئلة والأجوبة" },
  "marketing/navigation": { label: "قائمة التنقل", description: "تحرير روابط الشريط العلوي" },
  "marketing/footer": { label: "التذييل", description: "تحرير محتوى التذييل" },
  "legal/privacy": { label: "سياسة الخصوصية", description: "تحرير نص سياسة الخصوصية" },
  "legal/terms": { label: "الشروط والأحكام", description: "تحرير نص الشروط والأحكام" },
  "seo/metadata": { label: "تحسين محركات البحث", description: "تحرير البيانات الوصفية للمنصة" },
  "settings/platform": { label: "إعدادات المنصة", description: "تحرير الإعدادات العامة" },
  "templates/registry": { label: "سجل القوالب", description: "تحرير بيانات القوالب" },
};

export const dynamic = "force-dynamic";

export default async function ContentEditorPage({ params }: Props) {
  const slug = (await params).slug;
  const rawType = slug.join("/") as ContentSchemaKey;

  if (!(rawType in contentLabels) || !(rawType in ContentSchemas)) {
    notFound();
  }

  const type = rawType;
  const content = getContent(type);
  const manifest = getManifest();
  const entry = manifest[type];

  const meta = contentLabels[type]!;

  return (
    <AdminPageShell
      badge={meta.label}
      title={meta.label}
      description={meta.description}
      breadcrumbs={[
        { label: "القيادة", href: "/admin" },
        { label: "Content Studio", href: "/admin/content" },
        { label: meta.label },
      ]}
    >
      {entry && (
        <p className="text-[11px] text-white/30 mb-4">
          النسخة {entry.version} · آخر تحديث: {new Date(entry.updatedAt).toLocaleString("ar-SA")}
        </p>
      )}
      <ContentEditor type={type} content={content as Record<string, unknown>} />
    </AdminPageShell>
  );
}
