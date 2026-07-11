"use client";

import { ImagePlus, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { savePlatformSocialPreviewAction } from "@/app/(admin)/admin/settings/social-preview/actions";
import type { PlatformSocialPreviewSettings } from "@/modules/social-preview/social-preview";

export function SocialPreviewForm({
  settings,
  defaultTitle,
  defaultDescription,
  defaultImageUrl,
}: {
  settings: PlatformSocialPreviewSettings;
  defaultTitle: string;
  defaultDescription: string;
  defaultImageUrl: string;
}) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [title, setTitle] = useState(settings.title ?? "");
  const [description, setDescription] = useState(settings.description ?? "");
  const [imageUrl, setImageUrl] = useState(settings.imageUrl ?? "");
  const [removeImage, setRemoveImage] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const activeImage = enabled && imageUrl && !removeImage ? imageUrl : defaultImageUrl;
  const activeTitle = enabled && title.trim() ? title.trim() : defaultTitle;
  const activeDescription = enabled && description.trim() ? description.trim() : defaultDescription;

  function selectFile(file: File | undefined) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = file ? URL.createObjectURL(file) : null;
    if (objectUrlRef.current) {
      setImageUrl(objectUrlRef.current);
      setRemoveImage(false);
    }
  }

  return (
    <form action={savePlatformSocialPreviewAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="grid gap-5 rounded-3xl border border-white/8 bg-white/[0.03] p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#fff7e8]">إعدادات معاينة المشاركة</h2>
            <p className="mt-1 text-sm font-bold leading-7 text-white/45">مصدر واحد لمعاينة صفحات FrameID. مواقع العملاء لها Resolver مستقل ولا تستخدم صورة المنصة.</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-white/70">
            <input name="enabled" type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            تفعيل المخصص
          </label>
        </div>

        <div className="grid gap-2">
          <label htmlFor="social-title" className="text-xs font-black text-white/45">عنوان المعاينة</label>
          <input id="social-title" name="title" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={defaultTitle} className="min-h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-black text-white outline-none focus:border-amber-300/40" />
        </div>

        <div className="grid gap-2">
          <label htmlFor="social-description" className="text-xs font-black text-white/45">وصف المعاينة</label>
          <textarea id="social-description" name="description" maxLength={240} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={defaultDescription} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold leading-7 text-white outline-none focus:border-amber-300/40" />
        </div>

        <label className="grid cursor-pointer gap-2 rounded-2xl border border-dashed border-white/14 bg-black/18 p-4 transition hover:border-amber-300/30">
          <span className="inline-flex items-center gap-2 text-sm font-black text-[#fff7e8]"><ImagePlus className="size-4 text-amber-300" /> رفع أو استبدال الصورة</span>
          <span className="text-xs font-bold text-white/38">JPG أو PNG أو WebP — المقاس المفضل 1200×630 — بحد أقصى 8MB</span>
          <input type="file" name="previewImage" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFile(event.target.files?.[0])} className="mt-2 block w-full text-xs font-bold text-white/55 file:me-3 file:rounded-xl file:border-0 file:bg-amber-300 file:px-3 file:py-2 file:font-black file:text-[#17120a]" />
        </label>

        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-red-300/12 bg-red-300/[0.04] px-3 text-sm font-black text-red-100/75">
          <input name="removeImage" type="checkbox" checked={removeImage} onChange={(event) => setRemoveImage(event.target.checked)} />
          <Trash2 className="size-4" /> حذف الصورة المخصصة والعودة للافتراضي
        </label>

        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-5 text-sm font-black text-[#17120a] transition hover:-translate-y-0.5">
          <Save className="size-4" /> حفظ إعدادات المعاينة
        </button>
      </section>

      <aside className="self-start rounded-3xl border border-white/8 bg-[#11151d] p-4 xl:sticky xl:top-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[#fff7e8]">معاينة قبل الحفظ</h2>
            <p className="mt-1 text-xs font-bold text-white/38">{enabled ? "المعاينة المخصصة" : "المعاينة الافتراضية الحالية"}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.68rem] font-black text-white/50">1200×630</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <div className="aspect-[1200/630] bg-black/25">
            <img src={activeImage} alt="معاينة صورة المشاركة" className="size-full object-cover" />
          </div>
          <div className="grid gap-2 p-4">
            <span className="text-[0.7rem] font-black uppercase tracking-[0.12em] text-white/35">frameid.app</span>
            <strong className="text-base font-black leading-7 text-white">{activeTitle}</strong>
            <p className="line-clamp-3 text-sm font-bold leading-6 text-white/50">{activeDescription}</p>
          </div>
        </div>
      </aside>
    </form>
  );
}
