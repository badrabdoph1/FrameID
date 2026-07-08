"use client";

import {
  type DragEvent,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  compressImage,
  formatFileSize,
  isImageType,
  revokePreview,
  type CompressedImage,
} from "@/components/dashboard/image-pipeline";

type ImageDropZoneProps = {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  className?: string;
};

type ImageUploaderProps = {
  onUpload: (files: File[]) => Promise<void> | void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
};

type PreviewFile = {
  id: string;
  file: File;
  preview: string;
  size: number;
};

function DropZone({
  onFiles,
  multiple,
  accept,
  disabled,
  className,
}: ImageDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropId = useId();

  const handleDrag = useCallback(
    (e: DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
    },
    [disabled],
  );

  const handleDragIn = useCallback(
    (e: DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
    },
    [disabled],
  );

  const handleDragOut = useCallback(
    (e: DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [disabled, onFiles],
  );

  const handleChange = useCallback(() => {
    const input = inputRef.current;
    if (!input?.files) return;
    const files = Array.from(input.files);
    if (files.length > 0) onFiles(files);
    input.value = "";
  }, [onFiles]);

  return (
    <div
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-panel)] border-2 border-dashed border-border bg-surface/50 p-8 text-center transition-colors",
        dragging && "border-champagne bg-champagne/10",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={multiple ? "اختار صور أو اسحبهم هنا" : "اختار صورة أو اسحبها هنا"}
    >
      <input
        ref={inputRef}
        id={dropId}
        type="file"
        accept={accept ?? "image/*"}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        aria-hidden
      />
      <div className="flex size-12 items-center justify-center rounded-full bg-champagne/10 text-champagne">
        {dragging ? <Upload className="size-6" /> : <ImagePlus className="size-6" />}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {dragging
            ? "حط الصور هنا"
            : multiple
              ? "اسحب الصور هنا أو ضغط عشان تختار"
              : "اسحب الصورة هنا أو ضغط عشان تختار"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {accept ?? "PNG, JPEG, WebP"}
        </p>
      </div>
    </div>
  );
}

export function ImageUploader({
  onUpload,
  multiple = true,
  maxFiles = 20,
  maxSizeMB = 30,
  accept,
  className,
  children,
  disabled,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const compressedRef = useRef<Map<string, CompressedImage>>(new Map());

  const maxBytes = maxSizeMB * 1024 * 1024;
  const rawMaxBytes = Math.max(maxBytes, 50 * 1024 * 1024);

  const addFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const valid: File[] = [];

      for (const f of incoming) {
        if (!isImageType(f.type)) {
          setError(`"${f.name}" مش صيغة صورة مدعومة`);
          continue;
        }
        if (f.size > rawMaxBytes) {
          setError(`"${f.name}" كبير أوي. جرب صورة أقل من ${formatFileSize(rawMaxBytes)}.`);
          continue;
        }
        valid.push(f);
      }

      if (valid.length === 0) return;

      setFiles((prev) => {
        const existingIds = new Set(prev.map((p) => p.file.name + p.file.size));
        const newFiles = valid
          .filter((f) => !existingIds.has(f.name + f.size))
          .slice(0, maxFiles - prev.length)
          .map((f) => ({
            id: `${f.name}-${f.size}-${Date.now()}`,
            file: f,
            preview: URL.createObjectURL(f),
            size: f.size,
          }));
        return [...prev, ...newFiles];
      });
    },
    [rawMaxBytes, maxFiles],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) revokePreview(target.preview);
      return prev.filter((f) => f.id !== id);
    });
    compressedRef.current.delete(id);
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0 || uploading) return;
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const total = files.length;
      const compressed: CompressedImage[] = [];

      for (let i = 0; i < total; i++) {
        setProgress(Math.round((i / total) * 100));
        const f = files[i];
        const cached = compressedRef.current.get(f.id);
        if (cached) {
          compressed.push(cached);
        } else {
          const result = await compressImage(f.file);
          compressedRef.current.set(f.id, result);
          compressed.push(result);
        }
      }

      setProgress(100);
      await onUpload(compressed.map((c) => c.file));

      for (const f of files) revokePreview(f.preview);
      setFiles([]);
      setProgress(0);
    } catch {
      setError("فشل رفع الصور. جرب تاني.");
    } finally {
      setUploading(false);
    }
  }, [files, uploading, onUpload]);

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files],
  );

  return (
    <div className={cn("space-y-4", className)}>
      {children}

      <DropZone
        onFiles={addFiles}
        multiple={multiple}
        accept={accept}
        disabled={disabled || uploading}
      />

      {error && (
        <div
          className="flex items-center gap-2 rounded-[var(--radius-control)] border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger"
          role="alert"
        >
          <XCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mr-auto rounded p-0.5 transition hover:bg-white/10"
            aria-label="إغلاق"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {files.length} {files.length === 1 ? "صورة" : "صور"} &mdash;{" "}
              {formatFileSize(totalSize)} قبل الضغط
            </p>
            <div className="flex items-center gap-2">
              {uploading && (
                <span className="inline-flex items-center gap-1.5 text-xs text-champagne">
                  <Loader2 className="size-3.5 animate-spin" />
                  {progress}%
                </span>
              )}
            </div>
          </div>

          {uploading && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-champagne transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            role="list"
            aria-label="الصور اللي اختارتها"
          >
            {files.map((f) => (
              <div
                key={f.id}
                className="group relative aspect-square overflow-hidden rounded-[var(--radius-control)] border border-border bg-surface"
                role="listitem"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs text-white/90">
                    {f.file.name}
                  </p>
                  <p className="text-[11px] text-white/60">
                    {formatFileSize(f.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  disabled={uploading}
                  className={cn(
                    "absolute left-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white/80 transition hover:bg-danger hover:text-white",
                    uploading && "pointer-events-none opacity-50",
                  )}
                  aria-label={`حذف ${f.file.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3">
            {!uploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  for (const f of files) revokePreview(f.preview);
                  setFiles([]);
                }}
              >
                <X className="size-4" />
                إلغاء الكل
              </Button>
            )}
            <Button
              variant="luxury"
              size="sm"
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploading
                ? "بيرفع..."
                : `رفع ${files.length} ${files.length === 1 ? "صورة" : "صور"}`}
            </Button>
          </div>
        </div>
      )}

      {files.length === 0 && !error && (
        <p className="text-center text-xs text-muted-foreground">
          <CheckCircle2 className="ml-1 inline size-3.5 align-text-top text-champagne" />
          {" "}بنضغط الصور تلقائياً واحنا بنرفعها
        </p>
      )}
    </div>
  );
}
