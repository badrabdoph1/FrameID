"use client";

import { useMemo, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";

import { saveSocialPreviewAction } from "@/app/(admin)/admin/social-preview/actions";
import type { PlatformSocialPreviewSettings } from "@/modules/seo/platform-social-preview";

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-4 focus:ring-amber-300/10";

export function SocialPreviewForm({ settings }: { settings: PlatformSocialPreviewSettings }) {
  const [title, setTitle] = useState(settings.title);
  const [description, setDescription] = useState(settings.description);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [imagePreview, setImagePreview] = useState<string | null>(settings.imageUrl);
  const [removeImage, setRemoveImage] = useState(false);

  const effectiveImage = useMemo(
    () => imagePreview || "/frameid-social-preview.png",
    [imagePreview],
  );

  return (
    <form action={saveSocialPreviewAction} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <input type="hidden" name="removeImage" value={String(removeImage)} />

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/15 p-3">
          <span>
            <strong className="block text-sm font-black text-[#fff7e8]">استخدام معاينة مخصصة</strong>
            <small className="mt-1 block text-xs font-bold leading-5 text-white/45">عند التعطيل يعود النظام تلقائيًا إلى المعاينة الافتراضية الحالية.</small>
          </span>
          <input
            name="enabled"
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="size-5 accent-[#f3cf73]"
          />
        </label>

        <Field label="عنوان المعاينة">
          <input name="title" required value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </Field>

        <Field label="وصف المعاينة">
          <textarea
            name="description"
            required
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={`${inputClass} min-h-32 resize-y py-3`}
          />
        </Field>

        <Field label="صورة المعاينة — 1200 × 630 مفضلة">
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300/25 bg-amber-300/[0.055] px-4 text-sm font-black text-[#f3cf73] transition hover:bg-amber-300/10">
            <ImagePlus className="size-4" /> رفع أو استبدال الصورة
            <input
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setImagePreview(URL.createObjectURL(file));
                setRemoveImage(false);
              }}
            />
          </label>
        </Field>

        {settings.imageUrl || imagePreview ? (
          <button
            type="button"
            onClick={() => {
              setImagePreview(null);
              setRemoveImage(true);
            }}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/8 px-4 text-sm font-black text-red-300 transition hover:bg-red-400/14"
          >
            <Trash2 className="size-4" /> حذف الصورة المخصصة
          </button>
        ) : null}

        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-5 text-sm font-black text-[#17120a] shadow-lg sm:w-fit">
          <Save className="size-4" /> حفظ معاينة المشاركة
        </button>
      </section>

      <aside className="xl:sticky xl:top-5 xl:self-start">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#11151d] shadow-2xl">
          <div className="aspect-[1200/630] overflow-hidden bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={effectiveImage} alt="معاينة المشاركة" className="h-full w-full object-cover" />
          </div>
          <div className="grid gap-2 p-4">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/35">frameid.app</p>
            <h2 className="line-clamp-2 text-base font-black leading-7 text-[#fff7e8]">{title || "عنوان المعاينة"}</h2>
            <p className="line-clamp-3 text-xs font-bold leading-6 text-white/48">{description || "وصف المعاينة"}</p>
            <span className={enabled ? "text-xs font-black text-emerald-300" : "text-xs font-black text-amber-300"}>
              {enabled ? "المعاينة المخصصة مفعلة" : "سيتم استخدام المعاينة الافتراضية"}
            </span>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-white/55">{label}</span>
      {children}
    </label>
  );
}
