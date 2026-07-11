"use client";

import { Check, ImagePlus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { savePlatformSocialPreviewAction } from "@/app/(admin)/admin/settings/social-preview/actions";
import type { PlatformSocialPreviewSettings } from "@/modules/social-preview/social-preview";

type PreviewMode = "default" | "custom";

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
  const [mode, setMode] = useState<PreviewMode>(settings.enabled ? "custom" : "default");
  const [title, setTitle] = useState(settings.title ?? "");
  const [description, setDescription] = useState(settings.description ?? "");
  const [customImageUrl, setCustomImageUrl] = useState(settings.imageUrl ?? "");
  const [removeImage, setRemoveImage] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const hasCustomImage = Boolean(customImageUrl) && !removeImage;
  const activeImage = mode === "custom" && hasCustomImage ? customImageUrl : defaultImageUrl;
  const activeTitle = mode === "custom" && title.trim() ? title.trim() : defaultTitle;
  const activeDescription = mode === "custom" && description.trim() ? description.trim() : defaultDescription;

  function selectFile(file: File | undefined) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = file ? URL.createObjectURL(file) : null;
    if (!objectUrlRef.current) return;
    setCustomImageUrl(objectUrlRef.current);
    setRemoveImage(false);
    setMode("custom");
  }

  function deleteCustomImage() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setCustomImageUrl("");
    setRemoveImage(true);
    setMode("default");
  }

  return (
    <form action={savePlatformSocialPreviewAction} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="removeImage" value={removeImage ? "true" : "false"} />

      <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 md:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-black text-[#fff7e8]">اختر صورة المشاركة</h2>
          <p className="mt-1 text-sm font-bold leading-7 text-white/45">اختيار واحد فقط يُستخدم في روابط منصة FrameID.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ModeButton
            active={mode === "default"}
            title="الصورة الافتراضية"
            description="استخدام تصميم FrameID الحالي"
            icon={<RotateCcw className="size-5" />}
            onClick={() => setMode("default")}
          />
          <ModeButton
            active={mode === "custom"}
            title="صورة مخصصة"
            description={hasCustomImage ? "الصورة المرفوعة جاهزة" : "ارفع صورة لاستخدامها"}
            icon={<ImagePlus className="size-5" />}
            onClick={() => setMode("custom")}
          />
        </div>

        {mode === "custom" ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-4">
            <label className="grid cursor-pointer gap-2 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 transition hover:border-amber-300/35">
              <span className="inline-flex items-center gap-2 text-sm font-black text-white"><ImagePlus className="size-4 text-amber-300" /> رفع أو استبدال الصورة</span>
              <span className="text-xs font-bold text-white/40">JPG أو PNG أو WebP — المقاس الأفضل 1200×630 — حتى 8MB</span>
              <input type="file" name="previewImage" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFile(event.target.files?.[0])} className="mt-1 block w-full text-xs font-bold text-white/55 file:me-3 file:rounded-xl file:border-0 file:bg-amber-300 file:px-3 file:py-2 file:font-black file:text-[#17120a]" />
            </label>

            <div className="grid gap-2">
              <label htmlFor="social-title" className="text-xs font-black text-white/45">عنوان المشاركة</label>
              <input id="social-title" name="title" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={defaultTitle} className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-black text-white outline-none focus:border-amber-300/40" />
            </div>

            <div className="grid gap-2">
              <label htmlFor="social-description" className="text-xs font-black text-white/45">وصف المشاركة</label>
              <textarea id="social-description" name="description" maxLength={240} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={defaultDescription} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold leading-7 text-white outline-none focus:border-amber-300/40" />
            </div>

            {hasCustomImage ? (
              <button type="button" onClick={deleteCustomImage} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-300/[0.05] px-4 text-sm font-black text-red-200">
                <Trash2 className="size-4" /> حذف الصورة المخصصة
              </button>
            ) : (
              <p className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2 text-xs font-black text-amber-100">اختر صورة أولًا قبل الحفظ على الوضع المخصص.</p>
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm font-bold leading-7 text-white/50">
            سيتم استخدام صورة FrameID الافتراضية الحالية، ولن تُستخدم الصورة المخصصة حتى تختار زر «صورة مخصصة» وتحفظ.
          </div>
        )}

        <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-5 text-sm font-black text-[#17120a] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" disabled={mode === "custom" && !hasCustomImage}>
          <Save className="size-4" /> حفظ الاختيار
        </button>
      </section>

      <aside className="self-start rounded-3xl border border-white/8 bg-[#11151d] p-4 xl:sticky xl:top-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[#fff7e8]">المعاينة الفعلية</h2>
            <p className="mt-1 text-xs font-bold text-white/40">{mode === "custom" ? "صورة مخصصة" : "الصورة الافتراضية"}</p>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-200">{mode === "custom" ? "CUSTOM" : "DEFAULT"}</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <div className="aspect-[1200/630] bg-black/25">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

function ModeButton({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`relative min-h-24 rounded-2xl border p-4 text-start transition ${active ? "border-amber-300/45 bg-amber-300/10 text-white" : "border-white/10 bg-black/20 text-white/55 hover:border-white/20"}`}>
      {active ? <span className="absolute start-3 top-3 grid size-6 place-items-center rounded-full bg-amber-300 text-[#17120a]"><Check className="size-4" /></span> : null}
      <span className="mb-3 inline-flex text-amber-300">{icon}</span>
      <strong className="block text-sm font-black">{title}</strong>
      <span className="mt-1 block text-xs font-bold opacity-65">{description}</span>
    </button>
  );
}
