import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { X, Image as ImageIcon, Upload, Search, Trash2 } from "lucide-react";

interface ImageReplaceDialogProps {
  path: string;
  currentSrc: string;
  onReplace: (newUrl: string) => void;
  onClose: () => void;
}

export function ImageReplaceDialog({ path, currentSrc, onReplace, onClose }: ImageReplaceDialogProps) {
  const [tab, setTab] = useState<"upload" | "url" | "library">("url");
  const [url, setUrl] = useState(currentSrc);
  const [preview, setPreview] = useState(currentSrc);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryImages, setLibraryImages] = useState<Array<{ id: string; url: string; alt: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch library images
    fetch("/api/admin/media/library")
      .then((r) => r.json())
      .then((data) => setLibraryImages(data.images || []))
      .catch(() => {});
  }, []);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (isValidUrl(newUrl)) {
      setPreview(newUrl);
      setError(null);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الملف يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    setIsLoading(true);
    setError(null);

    // Upload to media library
    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          setPreview(data.url);
          setUrl(data.url);
        } else {
          setError(data.error || "فشل الرفع");
        }
      })
      .catch(() => setError("فشل رفع الصورة"))
      .finally(() => setIsLoading(false));
  };

  const handleSave = () => {
    if (isValidUrl(url)) {
      onReplace(url);
    }
  };

  const handleLibrarySelect = (imageUrl: string) => {
    setUrl(imageUrl);
    setPreview(imageUrl);
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl h-[80vh] max-h-[80vh] bg-[#0b0d12] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="font-semibold text-white">استبدال الصورة</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-mono">{path}</span>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition">
              <X className="size-4 text-white/60" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Tabs */}
          <div className="w-32 border-r border-white/10 flex flex-col py-4">
            <button
              onClick={() => setTab("upload")}
              className={cn(
                "px-3 py-2 text-sm font-medium text-left transition",
                tab === "upload" && "bg-white/5 text-amber-300"
              )}
            >
              <Upload className="size-4 mr-2 inline" />
              رفع
            </button>
            <button
              onClick={() => setTab("url")}
              className={cn(
                "px-3 py-2 text-sm font-medium text-left transition",
                tab === "url" && "bg-white/5 text-amber-300"
              )}
            >
              <ImageIcon className="size-4 mr-2 inline" />
              رابط
            </button>
            <button
              onClick={() => setTab("library")}
              className={cn(
                "px-3 py-2 text-sm font-medium text-left transition",
                tab === "library" && "bg-white/5 text-amber-300"
              )}
            >
              <Search className="size-4 mr-2 inline" />
              المكتبة
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {tab === "upload" && (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.dataTransfer.files[0] && handleFileSelect(e.dataTransfer.files[0]);
                  }}
                  className={cn(
                    "w-full max-w-md aspect-square border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer transition hover:border-amber-300/50",
                    isLoading && "opacity-50 pointer-events-none"
                  )}
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-8 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                      <span className="text-amber-300">جاري الرفع...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-12 text-white/30 mb-3" />
                      <p className="text-white/60">اسحب الصورة هنا أو اضغط للاختيار</p>
                      <p className="text-xs text-white/30 mt-1">الحد الأقصى: 5 ميجابايت</p>
                    </>
                  )}
                </div>
                {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
              </div>
            )}

            {tab === "url" && (
              <div className="flex-1 flex flex-col p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/70 mb-2">رابط الصورة</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-300"
                  />
                </div>
                {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-md aspect-[4/3] bg-white/5 rounded-lg overflow-hidden border border-white/10">
                    {preview ? (
                      <Image
                        src={preview}
                        alt="معاينة"
                        fill
                        className="object-cover"
                        sizes="400px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        <ImageIcon className="size-12" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "library" && (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                {libraryImages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-white/40">
                    لا توجد صور في المكتبة
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {libraryImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => handleLibrarySelect(img.url)}
                        className={cn(
                          "aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-amber-300/50 transition relative",
                          preview === img.url && "border-amber-300"
                        )}
                      >
                        <Image
                          src={img.url}
                          alt={img.alt}
                          fill
                          className="object-cover"
                          sizes="150px"
                        />
                        {preview === img.url && (
                          <div className="absolute inset-0 bg-amber-300/20 flex items-center justify-center">
                            <ImageIcon className="size-6 text-amber-300" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition">
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidUrl(url) || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-black bg-amber-300 rounded-lg hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImageIcon className="size-4" />
            استبدال
          </button>
        </div>
      </div>
    </div>
  );
}