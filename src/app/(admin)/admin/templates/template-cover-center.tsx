"use client";

import { useMemo, useState } from "react";
import { Images } from "lucide-react";

import { TemplateCoverUpload } from "@/app/(admin)/admin/templates/template-cover-upload";

type TemplateCoverItem = {
  id: string;
  name: string;
  code: string;
  currentUrl: string;
};

export function TemplateCoverCenter({ templates }: { templates: TemplateCoverItem[] }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const selected = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? templates[0] ?? null,
    [selectedId, templates],
  );

  if (!selected) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Images className="size-5" /></span>
          <span><p className="text-xs font-black text-[#f3cf73]">صور القوالب</p><h2 className="mt-1 text-lg font-black text-[#fff7e8]">غلاف بطاقة القالب</h2><p className="mt-1 text-xs font-bold leading-6 text-white/42">اختار القالب ثم ارفع الغلاف من جهازك أو ارجع للصورة الافتراضية.</p></span>
        </div>
        <label className="grid min-w-60 gap-1.5"><span className="text-xs font-black text-white/42">القالب المطلوب</span><select value={selected.id} onChange={(event) => setSelectedId(event.target.value)} className="min-h-11 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm font-black text-[#fff7e8] outline-none"><option value={selected.id}>{selected.name} — {selected.code}</option>{templates.filter((template) => template.id !== selected.id).map((template) => <option key={template.id} value={template.id}>{template.name} — {template.code}</option>)}</select></label>
      </div>
      <TemplateCoverUpload key={selected.id} templateId={selected.id} currentUrl={selected.currentUrl} />
    </section>
  );
}
