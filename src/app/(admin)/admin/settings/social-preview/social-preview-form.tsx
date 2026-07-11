"use client";

import { Check, Crop, ImagePlus, LoaderCircle, RotateCcw, Save, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { PlatformSocialPreviewSettings } from "@/modules/social-preview/social-preview";

type PreviewMode = "default" | "custom";
type Notice = { tone: "success" | "error" | "info"; message: string } | null;
type CropSource = { file: File; url: string; width: number; height: number };

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export function SocialPreviewForm({ settings, defaultTitle, defaultDescription, defaultImageUrl }: {
  settings: PlatformSocialPreviewSettings;
  defaultTitle: string;
  defaultDescription: string;
  defaultImageUrl: string;
}) {
  const [mode, setMode] = useState<PreviewMode>(settings.enabled ? "custom" : "default");
  const [title, setTitle] = useState(settings.title ?? "");
  const [description, setDescription] = useState(settings.description ?? "");
  const [customImageUrl, setCustomImageUrl] = useState(settings.imageData ? `/api/social-preview/platform-image?v=${Date.now()}` : "");
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropFrameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const hasCustomImage = Boolean(customImageUrl) && !deleteImage;
  const activeImage = mode === "custom" && hasCustomImage ? customImageUrl : defaultImageUrl;
  const activeTitle = mode === "custom" && title.trim() ? title.trim() : defaultTitle;
  const activeDescription = mode === "custom" && description.trim() ? description.trim() : defaultDescription;
  const busy = isSaving || uploadPhase === "uploading" || uploadPhase === "processing";

  async function chooseFile(file?: File) {
    setNotice(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setNotice({ tone: "error", message: "الملف المختار ليس صورة صالحة." });
    if (file.size > MAX_SOURCE_BYTES) return setNotice({ tone: "error", message: "حجم الصورة أكبر من 10MB." });

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    try {
      const dimensions = await getImageDimensions(url);
      setCropSource({ file, url, ...dimensions });
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setMode("custom");
    } catch {
      setNotice({ tone: "error", message: "تعذر قراءة الصورة. جرّب ملفًا آخر." });
    }
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropSource) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, panX, panY };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragRef.current;
    const frame = cropFrameRef.current;
    if (!start || !frame) return;
    const rect = frame.getBoundingClientRect();
    setPanX(clamp(start.panX + ((event.clientX - start.x) / rect.width) * 2, -1, 1));
    setPanY(clamp(start.panY + ((event.clientY - start.y) / rect.height) * 2, -1, 1));
  }

  function endDrag() { dragRef.current = null; }

  async function approveCrop() {
    if (!cropSource) return;
    setNotice({ tone: "info", message: "جاري تجهيز الصورة بالمقاس الصحيح..." });
    setUploadPhase("processing");
    try {
      const file = await renderCrop(cropSource, zoom, panX, panY);
      setUploadPhase("uploading");
      const result = await uploadImage(file, (progress) => setUploadProgress(progress), () => setUploadPhase("processing"));
      setCustomImageUrl(`${result.imageUrl}${result.imageUrl.includes("?") ? "&" : "?"}preview=${Date.now()}`);
      setDeleteImage(false);
      setCropSource(null);
      setUploadProgress(100);
      setUploadPhase("done");
      setNotice({ tone: "success", message: "تم رفع الصورة وتثبيتها بنجاح. اضغط حفظ لتفعيلها." });
      window.setTimeout(() => { setUploadProgress(null); setUploadPhase("idle"); }, 1200);
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
      const payload = await response.json() as { ok: boolean; error?: string; settings?: { imageUrl?: string | null; hasImage?: boolean } };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "تعذر حفظ الإعدادات.");
      if (payload.settings?.hasImage) setCustomImageUrl(`${payload.settings.imageUrl ?? "/api/social-preview/platform-image"}?v=${Date.now()}`);
      setDeleteImage(false);
      setNotice({ tone: "success", message: mode === "custom" ? "تم تفعيل الصورة المخصصة بنجاح." : "تم تفعيل الصورة الافتراضية بنجاح." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "تعذر حفظ الإعدادات." });
    } finally {
      setIsSaving(false);
    }
  }

  function removeImage() {
    setDeleteImage(true);
    setCustomImageUrl("");
    setMode("default");
    setNotice({ tone: "info", message: "سيتم حذف الصورة المخصصة نهائيًا بعد الضغط على حفظ." });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 md:p-6">
        <h2 className="text-lg font-black text-[#fff7e8]">صورة معاينة روابط FrameID</h2>
        <p className="mt-1 text-sm font-bold leading-7 text-white/45">اختر الصورة الافتراضية أو ارفع صورة مخصصة. الحفظ لا ينجح إلا بعد التأكد من وجود الصورة فعليًا.</p>

        {notice ? <NoticeBox notice={notice} /> : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ModeButton active={mode === "default"} title="الصورة الافتراضية" description="تصميم FrameID الرسمي" icon={<RotateCcw className="size-5" />} onClick={() => { setMode("default"); setNotice(null); }} />
          <ModeButton active={mode === "custom"} title="صورة مخصصة" description={hasCustomImage ? "الصورة محفوظة وجاهزة" : "ارفع صورة واضبط القص"} icon={<ImagePlus className="size-5" />} onClick={() => { setMode("custom"); setNotice(null); }} />
        </div>

        {mode === "custom" ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-4">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void chooseFile(event.target.files?.[0])} />
            <button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-black/20 px-4 text-sm font-black text-white hover:border-amber-300/40 disabled:opacity-50">
              <UploadCloud className="size-4 text-amber-300" /> {hasCustomImage ? "رفع صورة بديلة" : "اختيار صورة"}
            </button>
            <p className="text-center text-xs font-bold text-white/40">الصورة النهائية 1200×630 — يتم تخزينها بشكل دائم داخل إعدادات المنصة.</p>

            {uploadProgress !== null ? (
              <div className="grid gap-2 rounded-2xl border border-sky-300/15 bg-sky-300/[0.05] p-3">
                <div className="flex items-center justify-between text-xs font-black text-sky-100">
                  <span>{uploadPhase === "uploading" ? "جاري نقل الصورة" : uploadPhase === "done" ? "اكتمل الرفع" : "جاري تثبيت الصورة"}</span><span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky-300 transition-all" style={{ width: `${uploadProgress}%` }} /></div>
              </div>
            ) : null}

            <label className="grid gap-2"><span className="text-xs font-black text-white/45">عنوان المشاركة</span><input maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle} className="min-h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-black text-white outline-none focus:border-amber-300/40" /></label>
            <label className="grid gap-2"><span className="text-xs font-black text-white/45">وصف المشاركة</span><textarea maxLength={240} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={defaultDescription} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold leading-7 text-white outline-none focus:border-amber-300/40" /></label>

            {hasCustomImage ? <button type="button" disabled={busy} onClick={removeImage} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-300/[0.05] px-4 text-sm font-black text-red-200"><Trash2 className="size-4" /> حذف الصورة المخصصة</button> : null}
          </div>
        ) : null}

        <button type="button" onClick={() => void save()} disabled={busy || (mode === "custom" && !hasCustomImage)} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-5 text-sm font-black text-[#17120a] disabled:cursor-not-allowed disabled:opacity-50">
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{isSaving ? "جاري التحقق والحفظ..." : "حفظ وتفعيل الاختيار"}
        </button>
      </section>

      <aside className="self-start rounded-3xl border border-white/8 bg-[#11151d] p-4 xl:sticky xl:top-6">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-black text-[#fff7e8]">المعاينة الفعلية</h2><p className="mt-1 text-xs font-bold text-white/40">{mode === "custom" ? "الصورة المخصصة" : "الصورة الافتراضية"}</p></div><span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[.68rem] font-black text-emerald-200">{mode.toUpperCase()}</span></div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <div className="aspect-[1200/630] bg-black/25">
            {!imageError ? <img key={activeImage} src={activeImage} alt="معاينة المشاركة" className="size-full object-cover" onLoad={() => setImageError(false)} onError={() => setImageError(true)} /> : <div className="grid size-full place-items-center p-6 text-center text-sm font-black text-red-200">تعذر تحميل الصورة من المسار الفعلي. لن يعتبر الحفظ ناجحًا للصورة المخصصة بدون ملف مخزن.</div>}
          </div>
          <div className="grid gap-2 p-4"><span className="text-[.7rem] font-black uppercase tracking-[.12em] text-white/35">frameid.app</span><strong className="text-base font-black leading-7 text-white">{activeTitle}</strong><p className="line-clamp-3 text-sm font-bold leading-6 text-white/50">{activeDescription}</p></div>
        </div>
      </aside>

      {cropSource ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-3 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[#11151d] p-4 shadow-2xl md:p-6">
            <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-black text-white">قص صورة المشاركة</h3><p className="text-xs font-bold text-white/45">الإطار نفسه بنسبة 1200×630. اسحب الصورة بالماوس أو اللمس.</p></div><button type="button" onClick={() => setCropSource(null)} className="grid size-10 place-items-center rounded-full bg-white/5 text-white"><X className="size-5" /></button></div>
            <div ref={cropFrameRef} className="relative mx-auto aspect-[1200/630] w-full max-w-[900px] cursor-grab overflow-hidden rounded-2xl bg-black active:cursor-grabbing touch-none" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
              <CropImage source={cropSource} zoom={zoom} panX={panX} panY={panY} />
              <div className="pointer-events-none absolute inset-0 border-2 border-amber-300/70 shadow-[inset_0_0_0_9999px_rgba(0,0,0,.08)]" />
            </div>
            <div className="mx-auto mt-4 grid max-w-[900px] gap-3"><label className="grid gap-2"><span className="text-xs font-black text-white/55">التكبير: {zoom.toFixed(2)}×</span><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} className="min-h-11 flex-1 rounded-2xl border border-white/10 text-sm font-black text-white">إعادة الضبط</button><button type="button" onClick={() => void approveCrop()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-300 text-sm font-black text-[#17120a]"><Crop className="size-4" /> اعتماد القص ورفع الصورة</button></div></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CropImage({ source, zoom, panX, panY }: { source: CropSource; zoom: number; panX: number; panY: number }) {
  const frameRatio = TARGET_WIDTH / TARGET_HEIGHT;
  const imageRatio = source.width / source.height;
  const baseWidth = imageRatio > frameRatio ? imageRatio / frameRatio * 100 : 100;
  const baseHeight = imageRatio > frameRatio ? 100 : frameRatio / imageRatio * 100;
  const width = baseWidth * zoom;
  const height = baseHeight * zoom;
  const maxX = Math.max(0, (width - 100) / 2);
  const maxY = Math.max(0, (height - 100) / 2);
  return <img src={source.url} alt="قص الصورة" draggable={false} className="pointer-events-none absolute max-w-none select-none" style={{ width: `${width}%`, height: `${height}%`, left: `calc(50% + ${panX * maxX}%)`, top: `calc(50% + ${panY * maxY}%)`, transform: "translate(-50%, -50%)", objectFit: "fill" }} />;
}

function ModeButton({ active, title, description, icon, onClick }: { active: boolean; title: string; description: string; icon: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`relative min-h-24 rounded-2xl border p-4 text-start transition ${active ? "border-amber-300/45 bg-amber-300/10 text-white" : "border-white/10 bg-black/20 text-white/55"}`}>{active ? <span className="absolute start-3 top-3 grid size-6 place-items-center rounded-full bg-amber-300 text-[#17120a]"><Check className="size-4" /></span> : null}<span className="mb-3 inline-flex text-amber-300">{icon}</span><strong className="block text-sm font-black">{title}</strong><span className="mt-1 block text-xs font-bold opacity-65">{description}</span></button>;
}

function NoticeBox({ notice }: { notice: Exclude<Notice, null> }) {
  const tone = notice.tone === "success" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : notice.tone === "error" ? "border-red-300/20 bg-red-300/10 text-red-100" : "border-sky-300/20 bg-sky-300/10 text-sky-100";
  return <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-black ${tone}`}>{notice.message}</div>;
}

async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight }); image.onerror = reject; image.src = url; });
}

async function renderCrop(source: CropSource, zoom: number, panX: number, panY: number): Promise<File> {
  const image = await loadImage(source.url);
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_WIDTH; canvas.height = TARGET_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("المتصفح لا يدعم تجهيز الصورة.");
  const scale = Math.max(TARGET_WIDTH / source.width, TARGET_HEIGHT / source.height) * zoom;
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  const overflowX = Math.max(0, drawWidth - TARGET_WIDTH);
  const overflowY = Math.max(0, drawHeight - TARGET_HEIGHT);
  const x = -overflowX / 2 + panX * overflowX / 2;
  const y = -overflowY / 2 + panY * overflowY / 2;
  context.drawImage(image, x, y, drawWidth, drawHeight);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("تعذر إنشاء الصورة النهائية.");
  return new File([blob], `social-preview-${Date.now()}.jpg`, { type: "image/jpeg" });
}

function loadImage(url: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url; }); }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

function uploadImage(file: File, onProgress: (value: number) => void, onProcessing: () => void): Promise<{ imageUrl: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData(); form.append("image", file);
    xhr.open("POST", "/api/admin/social-preview/upload");
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.min(95, Math.round(event.loaded / event.total * 95))); };
    xhr.upload.onload = () => { onProgress(96); onProcessing(); };
    xhr.onerror = () => reject(new Error("انقطع الاتصال أثناء رفع الصورة."));
    xhr.onload = () => {
      let payload: { ok?: boolean; imageUrl?: string; error?: string } = {};
      try { payload = JSON.parse(xhr.responseText) as typeof payload; } catch { /* noop */ }
      if (xhr.status < 200 || xhr.status >= 300 || !payload.ok || !payload.imageUrl) return reject(new Error(payload.error ?? "فشل تثبيت الصورة على الخادم."));
      onProgress(100); resolve({ imageUrl: payload.imageUrl });
    };
    xhr.send(form);
  });
}
