"use client";

import {
  Check,
  Crop,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { PlatformSocialPreviewSettings } from "@/modules/social-preview/social-preview";

type PreviewMode = "default" | "custom";
type Notice = { tone: "success" | "error" | "info"; message: string } | null;
type UploadResponse = { ok: boolean; imageUrl?: string; storageKey?: string; error?: string };

type CropSource = {
  file: File;
  url: string;
  width: number;
  height: number;
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;

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
  const [storageKey, setStorageKey] = useState(settings.storageKey ?? "");
  const [deleteImage, setDeleteImage] = useState(false);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [defaultImageFailed, setDefaultImageFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  const hasCustomImage = Boolean(customImageUrl) && !deleteImage;
  const activeImage = mode === "custom" && hasCustomImage ? customImageUrl : defaultImageUrl;
  const activeTitle = mode === "custom" && title.trim() ? title.trim() : defaultTitle;
  const activeDescription = mode === "custom" && description.trim() ? description.trim() : defaultDescription;
  const isBusy = isSaving || uploadProgress !== null || isCropping;

  const cropStyle = useMemo(() => {
    if (!cropSource) return undefined;
    const frameRatio = TARGET_WIDTH / TARGET_HEIGHT;
    const imageRatio = cropSource.width / cropSource.height;
    const baseScale = imageRatio > frameRatio ? TARGET_HEIGHT / cropSource.height : TARGET_WIDTH / cropSource.width;
    const renderedWidth = cropSource.width * baseScale * zoom;
    const renderedHeight = cropSource.height * baseScale * zoom;
    return {
      width: `${renderedWidth}px`,
      height: `${renderedHeight}px`,
      left: `${positionX}%`,
      top: `${positionY}%`,
      transform: `translate(-${positionX}%, -${positionY}%)`,
    };
  }, [cropSource, positionX, positionY, zoom]);

  async function selectFile(file: File | undefined) {
    setNotice(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice({ tone: "error", message: "الملف المختار ليس صورة صالحة." });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setNotice({ tone: "error", message: "حجم الصورة أكبر من 8MB. اختر صورة أصغر." });
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    try {
      const dimensions = await readImageDimensions(url);
      setCropSource({ file, url, ...dimensions });
      setZoom(1);
      setPositionX(50);
      setPositionY(50);
      setMode("custom");
    } catch {
      setNotice({ tone: "error", message: "تعذر قراءة الصورة. جرّب ملفًا آخر." });
    }
  }

  async function cropAndUpload() {
    if (!cropSource) return;
    setIsCropping(true);
    setNotice({ tone: "info", message: "جاري تجهيز الصورة بالمقاس المناسب..." });
    try {
      const croppedFile = await createCroppedFile(cropSource, zoom, positionX, positionY);
      const response = await uploadWithProgress(croppedFile, setUploadProgress);
      if (!response.ok || !response.imageUrl || !response.storageKey) {
        throw new Error(response.error ?? "تعذر رفع الصورة.");
      }
      setCustomImageUrl(response.imageUrl);
      setStorageKey(response.storageKey);
      setDeleteImage(false);
      setCropSource(null);
      setNotice({ tone: "success", message: "تم قص الصورة ورفعها بنجاح. اضغط حفظ لتطبيقها." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "تعذر تجهيز الصورة." });
    } finally {
      setUploadProgress(null);
      setIsCropping(false);
    }
  }

  function removeCustomImage() {
    setCustomImageUrl("");
    setStorageKey("");
    setDeleteImage(true);
    setMode("default");
    setCropSource(null);
    setNotice({ tone: "info", message: "سيتم حذف الصورة المخصصة عند حفظ التغييرات." });
  }

  async function saveSettings() {
    setNotice(null);
    if (mode === "custom" && !hasCustomImage) {
      setNotice({ tone: "error", message: "ارفع صورة مخصصة واعتمد القص قبل الحفظ." });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/social-preview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          title,
          description,
          imageUrl: customImageUrl || null,
          storageKey: storageKey || null,
          deleteImage,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "تعذر حفظ الإعدادات.");
      setDeleteImage(false);
      setNotice({ tone: "success", message: "تم حفظ إعدادات معاينة المشاركة بنجاح." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "تعذر حفظ الإعدادات." });
    } finally {
      setIsSaving(false);
    }
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!cropSource) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, panX, panY };
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const start = dragRef.current;
    const frame = cropFrameRef.current;
    if (!start || !frame) return;
    const rect = frame.getBoundingClientRect();
    setPanX(clamp(start.panX + ((event.clientX - start.x) / rect.width) * 2, -1, 1));
    setPanY(clamp(start.panY + ((event.clientY - start.y) / rect.height) * 2, -1, 1));
  }

  function endDrag() { dragRef.current = null; }

  async function approveCrop() {
    if (!cropSource || busy) return;
    setNotice({ tone: "info", message: "جاري تجهيز الصورة ورفعها..." });
    setUploadPhase("preparing");
    setUploadProgress(5);

    try {
      const file = await renderCrop(cropSource, zoom, panX, panY);
      setUploadProgress(15);
      setUploadPhase("uploading");
      const result = await uploadImage(file, setUploadProgress, () => {
        setUploadPhase("persisting");
        setUploadProgress(82);
      });

      setCustomImageUrl(result.imageUrl);
      setDeleteImage(false);
      setCropSource(null);
      setImageError(false);
      setUploadProgress(100);
      setUploadPhase("done");
      setNotice({ tone: "success", message: `تم رفع الصورة وتثبيتها فعليًا (${formatBytes(result.bytes)}). اضغط حفظ لتفعيلها.` });
      window.setTimeout(() => {
        setUploadProgress(null);
        setUploadPhase("idle");
      }, 2500);
    } catch (error) {
      setUploadProgress(null);
      setUploadPhase("idle");
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "تعذر رفع الصورة." });
    }
  }

  async function save() {
    setNotice(null);
    if (mode === "custom" && !hasCustomImage) {
      setNotice({ tone: "error", message: "ارفع صورة واعتمد القص قبل الحفظ." });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/social-preview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, title, description, deleteImage }),
      });
      const payload = await response.json() as {
        ok?: boolean;
        error?: string;
        settings?: { imageUrl?: string | null; defaultImageUrl?: string; hasImage?: boolean };
      };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "تعذر حفظ الإعدادات.");

      if (payload.settings?.imageUrl) setCustomImageUrl(toSameOriginUrl(payload.settings.imageUrl));
      if (payload.settings?.defaultImageUrl) setDefaultUrl(toSameOriginUrl(payload.settings.defaultImageUrl));
      setDeleteImage(false);
      setImageError(false);
      setNotice({ tone: "success", message: mode === "custom" ? "تم حفظ وتفعيل الصورة المخصصة بنجاح." : "تم حفظ وتفعيل صورة الهيرو الافتراضية بنجاح." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "تعذر حفظ الإعدادات." });
    } finally {
      setIsSaving(false);
    }
  }

  function restoreDefaultText() {
    setTitle(defaultTitle);
    setDescription(defaultDescription);
    setNotice({ tone: "info", message: "تمت استعادة النصوص الحالية من إعدادات الصفحة الرئيسية. اضغط حفظ لاعتمادها." });
  }

  function removeImage() {
    setDeleteImage(true);
    setMode("default");
    setNotice({ tone: "info", message: "سيتم حذف الصورة المخصصة نهائيًا بعد الضغط على حفظ." });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 md:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-black text-[#fff7e8]">اختر صورة المشاركة</h2>
          <p className="mt-1 text-sm font-bold leading-7 text-white/45">اختيار واضح واحد فقط يُستخدم في روابط منصة FrameID.</p>
        </div>

        {notice ? <NoticeBox notice={notice} /> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <ModeButton
            active={mode === "default"}
            title="الصورة الافتراضية"
            description="استخدام تصميم FrameID الحالي"
            icon={<RotateCcw className="size-5" />}
            onClick={() => {
              setMode("default");
              setNotice(null);
            }}
          />
          <ModeButton
            active={mode === "custom"}
            title="صورة مخصصة"
            description={hasCustomImage ? "الصورة المخصصة جاهزة" : "ارفع صورة ثم اضبط القص"}
            icon={<ImagePlus className="size-5" />}
            onClick={() => {
              setMode("custom");
              setNotice(null);
            }}
          />
        </div>

        {mode === "custom" ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => void selectFile(event.target.files?.[0])}
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-black/20 px-4 text-sm font-black text-white transition hover:border-amber-300/40 disabled:opacity-50"
            >
              <UploadCloud className="size-4 text-amber-300" /> {hasCustomImage ? "رفع صورة بديلة" : "اختيار صورة"}
            </button>
            <p className="text-center text-xs font-bold text-white/40">JPG أو PNG أو WebP — حتى 8MB — الناتج النهائي 1200×630</p>

            {uploadProgress !== null ? (
              <div className="grid gap-2 rounded-2xl border border-sky-300/15 bg-sky-300/[0.05] p-3">
                <div className="flex items-center justify-between text-xs font-black text-sky-100">
                  <span>جاري رفع الصورة</span><span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky-300 transition-all" style={{ width: `${uploadProgress}%` }} /></div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <label htmlFor="social-title" className="text-xs font-black text-white/45">عنوان المشاركة</label>
              <input id="social-title" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={defaultTitle} className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-black text-white outline-none focus:border-amber-300/40" />
            </div>

            <div className="grid gap-2">
              <label htmlFor="social-description" className="text-xs font-black text-white/45">وصف المشاركة</label>
              <textarea id="social-description" maxLength={240} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={defaultDescription} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold leading-7 text-white outline-none focus:border-amber-300/40" />
            </div>

            {hasCustomImage ? (
              <button type="button" disabled={isBusy} onClick={removeCustomImage} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-300/[0.05] px-4 text-sm font-black text-red-200 disabled:opacity-50">
                <Trash2 className="size-4" /> حذف الصورة المخصصة
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm font-bold leading-7 text-white/50">
            الصورة الافتراضية ظاهرة في المعاينة الجانبية، وسيتم استخدامها بعد الضغط على حفظ.
          </div>
        )}

        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={isBusy || (mode === "custom" && !hasCustomImage)}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-5 text-sm font-black text-[#17120a] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
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
            {!defaultImageFailed || mode === "custom" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={activeImage} src={activeImage} alt="معاينة صورة المشاركة" onError={() => mode === "default" && setDefaultImageFailed(true)} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center bg-gradient-to-br from-[#070707] via-[#17120b] to-[#6b5425] p-6 text-center text-sm font-black text-amber-100">
                تعذر تحميل المعاينة داخل اللوحة، لكن الصورة الافتراضية ستظل مستخدمة في روابط المشاركة.
              </div>
            )}
          </div>
          <div className="grid gap-2 p-4">
            <span className="text-[0.7rem] font-black uppercase tracking-[0.12em] text-white/35">frameid.app</span>
            <strong className="text-base font-black leading-7 text-white">{activeTitle}</strong>
            <p className="line-clamp-3 text-sm font-bold leading-6 text-white/50">{activeDescription}</p>
          </div>
          <div className="grid gap-2 p-4"><span className="text-[.7rem] font-black uppercase tracking-[.12em] text-white/35">frameid.app</span><strong className="text-base font-black leading-7 text-white">{activeTitle}</strong><p className="line-clamp-3 text-sm font-bold leading-6 text-white/50">{activeDescription}</p></div>
        </div>
      </aside>

      {cropSource ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="قص صورة المعاينة">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#11151d] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 p-4">
              <div><h3 className="font-black text-white">ضبط وقص الصورة</h3><p className="mt-1 text-xs font-bold text-white/40">حرّك موضع الصورة وعدّل التكبير حتى تناسب 1200×630.</p></div>
              <button type="button" onClick={() => setCropSource(null)} className="grid size-10 place-items-center rounded-xl border border-white/10 text-white/60"><X className="size-5" /></button>
            </div>
            <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="mx-auto aspect-[1200/630] w-full max-w-[720px] overflow-hidden rounded-2xl border border-amber-300/25 bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cropSource.url} alt="الصورة قبل القص" className="relative max-w-none select-none" draggable={false} style={cropStyle} />
              </div>
              <div className="grid content-start gap-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                <Slider label="التكبير" value={zoom} min={1} max={3} step={0.01} onChange={setZoom} />
                <Slider label="الموضع الأفقي" value={positionX} min={0} max={100} step={1} onChange={setPositionX} />
                <Slider label="الموضع الرأسي" value={positionY} min={0} max={100} step={1} onChange={setPositionY} />
                <button type="button" disabled={isCropping} onClick={() => void cropAndUpload()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 text-sm font-black text-[#17120a] disabled:opacity-50">
                  {isCropping ? <LoaderCircle className="size-4 animate-spin" /> : <Crop className="size-4" />} اعتماد القص ورفع الصورة
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModeButton({ active, title, description, icon, onClick }: { active: boolean; title: string; description: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`relative min-h-24 rounded-2xl border p-4 text-start transition ${active ? "border-amber-300/45 bg-amber-300/10 text-white" : "border-white/10 bg-black/20 text-white/55 hover:border-white/20"}`}>
      {active ? <span className="absolute start-3 top-3 grid size-6 place-items-center rounded-full bg-amber-300 text-[#17120a]"><Check className="size-4" /></span> : null}
      <span className="mb-3 inline-flex text-amber-300">{icon}</span><strong className="block text-sm font-black">{title}</strong><span className="mt-1 block text-xs font-bold opacity-65">{description}</span>
    </button>
  );
}

function NoticeBox({ notice }: { notice: Exclude<Notice, null> }) {
  const toneClass = notice.tone === "success" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : notice.tone === "error" ? "border-red-300/20 bg-red-300/10 text-red-100" : "border-sky-300/20 bg-sky-300/10 text-sky-100";
  return <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-black ${toneClass}`}>{notice.message}</div>;
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <label className="grid gap-2 text-xs font-black text-white/55"><span>{label}</span><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="accent-amber-300" /></label>;
}

async function readImageDimensions(url: string): Promise<{ width: number; height: number }> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
}

async function createCroppedFile(source: CropSource, zoom: number, positionX: number, positionY: number): Promise<File> {
  const image = new Image();
  image.src = source.url;
  await image.decode();

  const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
  let baseCropWidth = image.naturalWidth;
  let baseCropHeight = baseCropWidth / targetRatio;
  if (baseCropHeight > image.naturalHeight) {
    baseCropHeight = image.naturalHeight;
    baseCropWidth = baseCropHeight * targetRatio;
  }
  const cropWidth = baseCropWidth / zoom;
  const cropHeight = baseCropHeight / zoom;
  const sourceX = (image.naturalWidth - cropWidth) * (positionX / 100);
  const sourceY = (image.naturalHeight - cropHeight) * (positionY / 100);

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذر تجهيز أداة قص الصورة.");
  context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("تعذر إنشاء الصورة النهائية.");
  return new File([blob], "social-preview-1200x630.jpg", { type: "image/jpeg" });
}

function uploadWithProgress(file: File, setProgress: (value: number | null) => void): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("image", file);
    xhr.open("POST", "/api/admin/social-preview/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onerror = () => reject(new Error("انقطع الاتصال أثناء رفع الصورة."));
    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText) as UploadResponse;
        if (xhr.status < 200 || xhr.status >= 300) reject(new Error(payload.error ?? "تعذر رفع الصورة."));
        else resolve(payload);
      } catch {
        reject(new Error("استجابة الرفع غير صالحة."));
      }
    };
    setProgress(1);
    xhr.send(formData);
  });
}
