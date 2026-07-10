"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Save, X } from "lucide-react";

import { saveTemplateCoverAction } from "@/app/(admin)/admin/templates/template-image-actions";

type Props = {
  templateId: string;
  currentUrl: string;
};

export function TemplateCoverUpload({ templateId, currentUrl }: Props) {
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [useDefault, setUseDefault] = useState(!currentUrl);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleFile(file: File | undefined) {
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
    <form action={saveTemplateCoverAction} className="mt-4 grid gap-4 rounded-3xl border border-amber-300/18 bg-amber-300/[0.04] p-4">
      <input type="hidden" name="id" value={templateId} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-[#fff7e8]">صورة غلاف كارت القالب</h3>
          <p className="mt-1 text-xs font-bold leading-6 text-white/42">ارفع صورة من جهازك أو اترك القالب على الغلاف الافتراضي. لن تحتاج لكتابة رابط أو مسار.</p>
        </div>
        <ImagePlus className="size-5 shrink-0 text-[#f3cf73]" />
      </div>

      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black/25">
          {previewUrl && !useDefault ? (
            <img src={previewUrl} alt="معاينة غلاف القالب" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-[radial-gradient(circle_at_top,rgba(243,207,115,0.16),transparent_48%),#11151d] text-center">
              <span><ImagePlus className="mx-auto size-7 text-white/22" /><small className="mt-2 block text-xs font-black text-white/38">الغلاف الافتراضي</small></span>
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <label className="grid cursor-pointer gap-1.5 rounded-2xl border border-dashed border-white/14 bg-black/18 p-4 transition hover:border-amber-300/32 hover:bg-amber-300/[0.04]">
            <span className="text-sm font-black text-[#fff7e8]">اختيار صورة من الجهاز</span>
            <span className="text-xs font-bold text-white/38">JPG أو PNG أو WebP — بحد أقصى 8MB</span>
            <input
              type="file"
              name="coverImage"
              accept="image/jpeg,image/png,image/webp"
              className="mt-2 block w-full text-xs font-bold text-white/55 file:me-3 file:rounded-xl file:border-0 file:bg-amber-300 file:px-3 file:py-2 file:font-black file:text-[#17120a]"
              onChange={(event) => handleFile(event.target.files?.[0])}
              disabled={useDefault}
            />
          </label>

          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-sm font-black text-white/65">
            <input type="checkbox" name="useDefault" checked={useDefault} onChange={(event) => { setUseDefault(event.target.checked); if (event.target.checked) setPreviewUrl(""); }} />
            استخدام صورة القالب الافتراضية
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={resetSelection} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-white/55"><X className="size-3.5" /> إلغاء الاختيار</button>
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-3 text-xs font-black text-[#17120a]">{useDefault ? <RotateCcw className="size-3.5" /> : <Save className="size-3.5" />}{useDefault ? "تطبيق الافتراضي" : "حفظ الغلاف"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}
