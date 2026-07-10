"use client";

import { useMemo, useState } from "react";
import { Images, Package } from "lucide-react";

import { TemplateCoverUpload } from "@/app/(admin)/admin/templates/template-cover-upload";
import { TemplateVisualUpload } from "@/app/(admin)/admin/templates/template-visual-upload";

type JsonRecord = Record<string, unknown>;

type TemplateImageItem = {
  id: string;
  name: string;
  code: string;
  previewData: unknown;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function coverUrl(value: unknown): string {
  if (!isRecord(value)) return "";
  return text(value.previewImage ?? value.thumbnail ?? value.image ?? value.cover);
}

function heroUrl(value: unknown): string {
  if (!isRecord(value) || !isRecord(value.hero)) return "";
  return text(value.hero.imageUrl ?? value.hero.image ?? value.hero.cover);
}

function packageImages(value: unknown): Array<{ id: string; name: string; imageUrl: string }> {
  if (!isRecord(value) || !Array.isArray(value.packages)) return [];
  return value.packages.filter(isRecord).map((item, index) => ({
    id: text(item.id) || `package-${index + 1}`,
    name: text(item.name) || `باقة ${index + 1}`,
    imageUrl: text(item.imageUrl),
  }));
}

export function TemplateImageCenter({ templates }: { templates: TemplateImageItem[] }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const selected = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? templates[0] ?? null,
    [selectedId, templates],
  );

  if (!selected) return null;
  const packages = packageImages(selected.previewData);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Images className="size-5" /></span>
          <span><p className="text-xs font-black text-[#f3cf73]">مركز صور القالب</p><h2 className="mt-1 text-lg font-black text-[#fff7e8]">كل الصور من الجهاز</h2><p className="mt-1 text-xs font-bold leading-6 text-white/42">غلاف الكارت وصورة الـHero وصور الباقات بدون كتابة روابط أو مسارات.</p></span>
        </div>
        <label className="grid min-w-60 gap-1.5"><span className="text-xs font-black text-white/42">القالب المطلوب</span><select value={selected.id} onChange={(event) => setSelectedId(event.target.value)} className="min-h-11 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm font-black text-[#fff7e8] outline-none">{templates.map((template) => <option key={template.id} value={template.id}>{template.name} — {template.code}</option>)}</select></label>
      </div>

      <div className="mt-4 grid gap-4">
        <TemplateCoverUpload key={`${selected.id}-cover`} templateId={selected.id} currentUrl={coverUrl(selected.previewData)} />

        <TemplateVisualUpload
          key={`${selected.id}-hero`}
          templateId={selected.id}
          target="hero"
          label="صورة القسم الرئيسي Hero"
          description="الصورة الكبيرة التي تظهر في أول الموقع."
          currentUrl={heroUrl(selected.previewData)}
        />

        <section className="grid gap-3 rounded-3xl border border-white/10 bg-black/12 p-4">
          <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-white/45"><Package className="size-4" /></span><span><h3 className="text-sm font-black text-[#fff7e8]">صور الباقات</h3><p className="mt-1 text-xs font-bold leading-6 text-white/42">احفظ الباقة أولًا، ثم ارفع صورتها من هنا.</p></span></div>
          {packages.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-xs font-black text-white/35">لا توجد باقات محفوظة في هذا القالب بعد.</div> : <div className="grid gap-3 xl:grid-cols-2">{packages.map((item) => <TemplateVisualUpload key={`${selected.id}-${item.id}`} templateId={selected.id} target="package" targetKey={item.id} label={item.name} description="صورة بطاقة هذه الباقة داخل المعاينة." currentUrl={item.imageUrl} compact />)}</div>}
        </section>
      </div>
    </section>
  );
}
