"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";

import { uploadPlatformPageImageAction } from "@/app/(admin)/admin/content/pages/actions";
import type { HomeImageReference } from "@/modules/platform-pages/home-page-content";

type ImageReplaceSheetProps = {
  currentUrl: string;
  alt: string;
  onClose: () => void;
  onReplace: (reference: Exclude<HomeImageReference, string>) => void;
};

export function ImageReplaceSheet({ currentUrl, alt, onClose, onReplace }: ImageReplaceSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [focusX, setFocusX] = useState(0.5);
  const [focusY, setFocusY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 16, height: 9 });
  const previewStyle = useMemo(
    () => calculateCropPreviewStyle(naturalSize.width, naturalSize.height, focusX, focusY, zoom),
    [focusX, focusY, naturalSize.height, naturalSize.width, zoom],
  );

  useEffect(() => {
    if (!file) {
      setPreviewUrl(currentUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [currentUrl, file]);

  async function replace() {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("focusX", String(focusX));
    formData.set("focusY", String(focusY));
    formData.set("zoom", String(zoom));
    const result = await uploadPlatformPageImageAction(formData);
    setUploading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    onReplace({ ...result.asset, alt });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/68 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="استبدال الصورة"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-white/10 bg-[#0c0e13] p-4 text-[#fff7e8] shadow-2xl sm:max-w-2xl sm:rounded-[1.75rem] sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-black">استبدال الصورة</h2>
            <p className="mt-1 text-xs leading-5 text-white/48">اختر الصورة وحدد الجزء المهم. الضغط والتحويل يتمان تلقائيًا عند الاستخدام.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق استبدال الصورة" className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/6 text-white/58 hover:text-white">
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-black">
          {/* A plain image is intentional here: this is a local object URL before upload. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="معاينة القص"
            className="absolute max-w-none"
            style={previewStyle}
            onLoad={(event) => setNaturalSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
          />
          <div className="pointer-events-none absolute inset-0 border border-white/20" />
        </div>

        <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/18 bg-white/[0.035] px-4 text-sm font-bold text-white/72 hover:bg-white/7 hover:text-white">
          <ImagePlus className="size-4" aria-hidden />
          <span>{file ? file.name : "اختيار صورة"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="اختيار صورة"
            className="sr-only"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
          />
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <RangeControl label="موضع أفقي" value={focusX} min={0} max={1} step={0.01} onChange={setFocusX} />
          <RangeControl label="موضع رأسي" value={focusY} min={0} max={1} step={0.01} onChange={setFocusY} />
          <RangeControl label="التقريب" value={zoom} min={1} max={3} step={0.05} onChange={setZoom} />
        </div>

        {error ? <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200">{error}</p> : null}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={() => void replace()} disabled={!file || uploading} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] disabled:opacity-38">
            {uploading ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
            {uploading ? "جارٍ التجهيز" : "استخدام الصورة"}
          </button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-bold text-white/58 hover:bg-white/6 hover:text-white">إلغاء</button>
        </div>
      </section>
    </div>
  );
}

function calculateCropPreviewStyle(width: number, height: number, focusX: number, focusY: number, zoom: number): CSSProperties {
  const aspectRatio = 16 / 9;
  const baseWidth = Math.min(width, height * aspectRatio);
  const baseHeight = baseWidth / aspectRatio;
  const cropWidth = Math.max(1, baseWidth / zoom);
  const cropHeight = Math.max(1, baseHeight / zoom);
  const left = clamp(focusX * width - cropWidth / 2, 0, width - cropWidth);
  const top = clamp(focusY * height - cropHeight / 2, 0, height - cropHeight);

  return {
    width: `${(width / cropWidth) * 100}%`,
    height: `${(height / cropHeight) * 100}%`,
    left: `${(-left / cropWidth) * 100}%`,
    top: `${(-top / cropHeight) * 100}%`,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function RangeControl({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-xs font-bold text-white/58">
      <span className="flex items-center justify-between gap-3">
        {label}
        <span className="tabular-nums text-white/35">{label === "التقريب" ? `${value.toFixed(1)}×` : `${Math.round(value * 100)}%`}</span>
      </span>
      <input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="h-8 w-full accent-[#f3cf73]" />
    </label>
  );
}
