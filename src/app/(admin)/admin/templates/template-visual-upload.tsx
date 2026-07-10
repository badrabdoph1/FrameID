"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Save, X } from "lucide-react";

import { saveTemplateVisualImageAction } from "@/app/(admin)/admin/templates/template-visual-actions";

type Props = {
  templateId: string;
  target: "hero" | "package";
  targetKey?: string;
  label: string;
  description: string;
  currentUrl: string;
  compact?: boolean;
};

export function TemplateVisualUpload({
  templateId,
  target,
  targetKey = "",
  label,
  description,
  currentUrl,
  compact = false,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [useDefault, setUseDefault] = useState(!currentUrl);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function selectFile(file: File | undefined) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = file ? URL.createObjectURL(file) : null;
    setPreviewUrl(objectUrlRef.current ?? currentUrl);
    if (file) setUseDefault(false);
  }

  function resetSelection() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setPreviewUrl(currentUrl);
    setUseDefault(!currentUrl);
  }

  return (
    <form action={saveTemplateVisualImageAction} className="grid gap-3 rounded-2xl border border-white/10 bg-black/16 p-3">
      <input type="hidden" name="id" value={templateId} />
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="targetKey" value={targetKey} />

      <div className="flex items-start justify-between gap-3">
        <span><strong className="block text-sm font-black text-[#fff7e8]">{label}</strong><small className="mt-1 block text-xs font-bold leading-5 text-white/38">{description}</small></span>
        <ImagePlus className="size-4 shrink-0 text-[#f3cf73]" />
      </div>

      <div className={compact ? "grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]" : "grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]"}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black/25">
          {previewUrl && !useDefault ? <img src={previewUrl} alt={`معاينة ${label}`} className="size-full object-cover" /> : <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_top,rgba(243,207,115,0.14),transparent_48%),#11151d]"><span className="text-center"><ImagePlus className="mx-auto size-6 text-white/22" /><small className="mt-2 block text-[0.68rem] font-black text-white/35">الصورة الافتراضية</small></span></div>}
        </div>

        <div className="grid gap-2">
          <label className="grid cursor-pointer gap-1 rounded-2xl border border-dashed border-white/14 bg-white/[0.025] p-3 hover:border-amber-300/30">
            <span className="text-xs font-black text-white/62">اختيار صورة من الجهاز</span>
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" disabled={useDefault} onChange={(event) => selectFile(event.target.files?.[0])} className="block w-full text-[0.68rem] font-bold text-white/48 file:me-2 file:rounded-xl file:border-0 file:bg-amber-300 file:px-3 file:py-2 file:font-black file:text-[#17120a]" />
          </label>

          <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 text-xs font-black text-white/62"><input type="checkbox" name="useDefault" checked={useDefault} onChange={(event) => { setUseDefault(event.target.checked); if (event.target.checked) setPreviewUrl(""); }} /> استخدام الصورة الافتراضية</label>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={resetSelection} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2 text-[0.68rem] font-black text-white/50"><X className="size-3" /> إلغاء</button>
            <button className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#f3cf73] px-2 text-[0.68rem] font-black text-[#17120a]">{useDefault ? <RotateCcw className="size-3" /> : <Save className="size-3" />}{useDefault ? "تطبيق الافتراضي" : "حفظ الصورة"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}
