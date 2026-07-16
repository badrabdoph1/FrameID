"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff, ImagePlus, Images, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BuilderNotice } from "@/components/dashboard/builder-primitives";
import { uploadSiteImageAction } from "@/app/(dashboard)/dashboard/site-info/actions";
import { replaceGallerySlotAction, toggleGallerySectionAction } from "@/app/(dashboard)/dashboard/gallery/actions";

type SlotImage = { slot: number; imageId: string | null; url: string | null };

type GalleryClientProps = {
  coverUrl: string | null;
  galleryVisible: boolean;
  slotImages: SlotImage[];
  toggled: boolean;
  replaced?: string;
  coverReplaced: boolean;
  error?: string;
};

const SLOT_LABELS: Record<number, string> = {
  0: "الصورة الأولى بالمعرض",
  1: "الصورة الثانية بالمعرض",
  2: "الصورة الثالثة بالمعرض",
  3: "الصورة الرابعة بالمعرض",
};

export function GalleryClient({ coverUrl, galleryVisible, slotImages, toggled, replaced, coverReplaced, error }: GalleryClientProps) {
  const [coverUploading, setCoverUploading] = useState(false);
  const [slotUploading, setSlotUploading] = useState<number | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);
  const [localSlots, setLocalSlots] = useState<SlotImage[]>(slotImages);
  const [localVisible, setLocalVisible] = useState(galleryVisible);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [caughtError, setCaughtError] = useState<string | null>(null);

  const notice = caughtError
    ? { tone: "error" as const, text: caughtError }
    : toggled
      ? { tone: "success" as const, text: localVisible ? "تم إظهار قسم المعرض" : "تم إخفاء قسم المعرض" }
      : replaced
        ? { tone: "success" as const, text: "تم استبدال الصورة بنجاح" }
        : coverReplaced
          ? { tone: "success" as const, text: "تم استبدال صورة الغلاف بنجاح" }
          : error
            ? { tone: "error" as const, text: error === "no-image" ? "الرجاء اختيار صورة" : error === "invalid-slot" ? "بيانات غير صالحة" : "حدث خطأ، حاول مرة أخرى" }
            : null;

  async function handleCoverUpload() {
    const file = coverInputRef.current?.files?.[0];
    if (!file) return;
    setCaughtError(null);
    setCoverUploading(true);
    setLocalCoverUrl(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("field", "coverAssetId");
      await uploadSiteImageAction(fd);
    } catch {
      setCoverUploading(false);
      setLocalCoverUrl(null);
      setCaughtError("فشل رفع صورة الغلاف، حاول مرة أخرى");
    }
  }

  async function handleSlotUpload(slotIndex: number, file: File) {
    setCaughtError(null);
    setSlotUploading(slotIndex);
    setLocalSlots((prev) => prev.map((s) => s.slot === slotIndex ? { ...s, url: URL.createObjectURL(file) } : s));
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("slot", String(slotIndex));
      await replaceGallerySlotAction(fd);
    } catch {
      setSlotUploading(null);
      setCaughtError("فشل استبدال الصورة، حاول مرة أخرى");
    }
  }

  async function handleToggle() {
    setCaughtError(null);
    const next = !localVisible;
    setLocalVisible(next);
    try {
      await toggleGallerySectionAction();
    } catch {
      setLocalVisible(!next);
      setCaughtError("فشل تحديث حالة المعرض، حاول مرة أخرى");
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4">
      <section className="rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.12),transparent_36%),rgba(255,255,255,0.035)] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Images className="size-5" /></span>
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">الصور</p>
            <h1 className="mt-1 text-2xl font-black text-[#fff7e8] sm:text-3xl">معرض الصور</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/55">
              صورة الغلاف ومعرض الأعمال. كل صورة تظهر في مكان محدد داخل موقعك.
            </p>
          </div>
        </div>
      </section>

      {notice ? <BuilderNotice tone={notice.tone} title={notice.text} /> : null}

      <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
        <header className="flex items-start gap-3 border-b border-white/8 px-4 py-3 sm:px-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-[#f3cf73]"><Images className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-[#fff7e8]">صورة الغلاف</h2>
            <p className="mt-0.5 text-[0.68rem] font-bold leading-5 text-white/45">تظهر عريضة في أعلى الصفحة الرئيسية للموقع.</p>
          </div>
        </header>

        <div className="p-4 sm:p-5">
          <div className="relative aspect-[16/6] w-full overflow-hidden rounded-2xl border border-white/8 bg-black/20 sm:aspect-[16/5]">
            {(localCoverUrl || coverUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={localCoverUrl || coverUrl!} alt="صورة الغلاف" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center gap-2 text-white/20">
                <ImagePlus className="size-10" />
                <span className="text-xs font-bold">لا توجد صورة غلاف</span>
              </div>
            )}
            {coverUploading ? (
              <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
                <div className="grid justify-items-center gap-3">
                  <RefreshCw className="size-8 animate-spin text-[#f3cf73]" />
                  <span className="text-xs font-black text-[#f3cf73]">جاري استبدال صورة الغلاف...</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex justify-center">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverUpload}
            />
            <Button
              type="button"
              variant="luxury"
              className="min-h-10 rounded-2xl px-5 text-sm font-black"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
            >
              {coverUploading ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  جاري الاستبدال...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  استبدال صورة الغلاف
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
        <header className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3 sm:px-5">
          <div className="flex items-start gap-3 min-w-0">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-[#f3cf73]">
              {localVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-[#fff7e8]">قسم معرض الأعمال</h2>
              <p className="mt-0.5 text-[0.68rem] font-bold leading-5 text-white/45">
                {localVisible ? "القسم ظاهر للزوار في موقعك." : "القسم مخفي عن الزوار حاليًا."}
              </p>
            </div>
          </div>
          <Switch
            checked={localVisible}
            onCheckedChange={handleToggle}
          />
        </header>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {localSlots.map((slot) => (
              <GallerySlotCard
                key={slot.slot}
                slot={slot}
                label={SLOT_LABELS[slot.slot]}
                uploading={slotUploading === slot.slot}
                onReplace={handleSlotUpload}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function GallerySlotCard({ slot, label, uploading, onReplace }: { slot: SlotImage; label: string; uploading: boolean; onReplace: (slotIndex: number, file: File) => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    await onReplace(slot.slot, file);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/15">
      <div className="relative aspect-square bg-black/20">
        {slot.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.url} alt={label} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-white/15">
            <ImagePlus className="size-7" />
          </div>
        )}
        {uploading ? (
          <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
            <RefreshCw className="size-6 animate-spin text-[#f3cf73]" />
          </div>
        ) : null}
      </div>
      <div className="p-2.5">
        <p className="truncate text-[0.65rem] font-bold leading-5 text-white/40">{label}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-2 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-[0.65rem] font-black text-white/55 transition hover:bg-amber-300/10 hover:text-[#f3cf73] disabled:opacity-50"
        >
          {uploading ? (
            <>
              <RefreshCw className="size-3 animate-spin" />
              جاري...
            </>
          ) : (
            <>
              <RefreshCw className="size-3" />
              استبدال
            </>
          )}
        </button>
      </div>
    </div>
  );
}
