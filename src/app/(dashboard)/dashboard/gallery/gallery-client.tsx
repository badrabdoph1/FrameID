"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  FolderOpen,
  ImagePlus,
  Images,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import {
  BuilderNotice,
  BuilderPageHeader,
} from "@/components/dashboard/builder-primitives";

import {
  createAlbumAction,
  deleteAlbumAction,
  deleteImageAction,
  renameAlbumAction,
  reorderImageAction,
  setCoverImageAction,
  toggleFeaturedAction,
  uploadToAlbumAction,
} from "@/app/(dashboard)/dashboard/gallery/actions";

type AssetInfo = {
  url: string;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
};

type GalleryImageInfo = {
  id: string;
  caption: string | null;
  sortOrder: number;
  isFeatured: boolean;
  asset: AssetInfo;
};

type AlbumWithImages = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverAsset: { url: string } | null;
  sortOrder: number;
  images: GalleryImageInfo[];
};

type Messages = {
  uploaded?: string;
  error?: string;
  created?: string;
  deleted?: string;
  renamed?: string;
  coverSet?: string;
  featuredToggled?: string;
  reordered?: string;
};

type GalleryClientProps = {
  albums: AlbumWithImages[];
  selectedAlbumId: string | null;
  messages: Messages;
};

function getCoverUrl(album: AlbumWithImages): string | null {
  if (album.coverAsset) return album.coverAsset.url;
  if (album.images.length > 0) return album.images[0].asset.url;
  return null;
}

function getGalleryNotice(messages: Messages):
  | { tone: "success" | "error"; title: string; description?: string; errorId?: string }
  | null {
  if (messages.error) {
    return {
      tone: "error",
      title: "مقدرناش ننفذ العملية",
      description: "جرب تاني، ولو المشكلة لسه موجودة، انسخ رقم الخطأ وإبعتلنا.",
      errorId: messages.error,
    };
  }
  if (messages.uploaded) {
    return {
      tone: "success",
      title: `اترفع ${messages.uploaded} ${messages.uploaded === "1" ? "صورة" : "صور"}`,
      description: "تقدر دلوقتي ترتب الصور وتختار الغلاف والصور المميزة.",
    };
  }
  if (messages.created) return { tone: "success", title: "الألبوم اتعمل" };
  if (messages.deleted) return { tone: "success", title: "اتمسح" };
  if (messages.renamed) return { tone: "success", title: "اتغير اسم الألبوم" };
  if (messages.coverSet) return { tone: "success", title: "اتحددت صورة الغلاف" };
  if (messages.featuredToggled) return { tone: "success", title: "اتحدثت الصورة المميزة" };
  if (messages.reordered) return { tone: "success", title: "اترتبت الصور" };
  return null;
}

export function GalleryClient({
  albums,
  selectedAlbumId: initialAlbumId,
  messages,
}: GalleryClientProps) {
  const router = useRouter();

  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(() => {
    if (initialAlbumId && albums.some((a) => a.id === initialAlbumId)) {
      return initialAlbumId;
    }
    return null;
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [renamingAlbumId, setRenamingAlbumId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const selectedAlbum = currentAlbumId
    ? albums.find((a) => a.id === currentAlbumId)
    : null;
  const notice = getGalleryNotice(messages);

  const selectAlbum = (id: string) => {
    setCurrentAlbumId(id);
    router.replace(`/dashboard/gallery?albumId=${id}`, { scroll: false });
  };

  const deselectAlbum = () => {
    setCurrentAlbumId(null);
    setShowUpload(false);
    router.replace("/dashboard/gallery", { scroll: false });
  };

  function handleCreateAlbum(formData: FormData) {
    createAlbumAction(formData);
  }

  function handleRenameAlbum(formData: FormData) {
    renameAlbumAction(formData);
  }

  function handleDeleteAlbum(formData: FormData) {
    deleteAlbumAction(formData);
  }

  function handleUpload(files: File[]) {
    if (!selectedAlbum) return;
    const formData = new FormData();
    formData.set("albumId", selectedAlbum.id);
    files.forEach((f) => formData.append("images", f));
    uploadToAlbumAction(formData);
  }

  function handleDeleteImage(imageId: string) {
    const formData = new FormData();
    formData.set("imageId", imageId);
    formData.set("albumId", currentAlbumId ?? "");
    deleteImageAction(formData);
  }

  function handleReorder(imageId: string, direction: "up" | "down") {
    const formData = new FormData();
    formData.set("imageId", imageId);
    formData.set("albumId", currentAlbumId ?? "");
    formData.set("direction", direction);
    reorderImageAction(formData);
  }

  function handleSetCover(imageId: string) {
    const formData = new FormData();
    formData.set("imageId", imageId);
    formData.set("albumId", currentAlbumId ?? "");
    setCoverImageAction(formData);
  }

  function handleToggleFeatured(imageId: string) {
    const formData = new FormData();
    formData.set("imageId", imageId);
    formData.set("albumId", currentAlbumId ?? "");
    toggleFeaturedAction(formData);
  }

  function handleConfirmDelete(albumId: string) {
    const formData = new FormData();
    formData.set("albumId", albumId);
    handleDeleteAlbum(formData);
    setConfirmDelete(null);
  }

  return (
    <main className="space-y-5">
      <BuilderPageHeader
        eyebrow="معرض الصور"
        title="نظم صورك في ألبومات"
        description="ابدأ بألبوم، ارفع صورك، واختار الغلاف والصورة المميزة."
      />

      {notice ? (
        <BuilderNotice
          tone={notice.tone}
          title={notice.title}
          description={notice.description}
          errorId={notice.errorId}
        />
      ) : null}

      {selectedAlbum ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={deselectAlbum}>
                <X className="size-4" aria-hidden />
                رجوع
              </Button>
              <div>
                <h2 className="text-xl font-semibold">{selectedAlbum.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedAlbum.images.length} {selectedAlbum.images.length === 1 ? "صورة" : "صور"}
                </p>
              </div>
            </div>
            <Button
              variant="luxury"
              size="sm"
              onClick={() => setShowUpload((v) => !v)}
            >
              <ImagePlus className="size-4" aria-hidden />
              {showUpload ? "إخفاء" : "ضيف صور"}
            </Button>
          </div>

          {showUpload ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ارفع صور للألبوم {selectedAlbum.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  onUpload={handleUpload}
                  multiple
                  maxFiles={20}
                  maxSizeMB={10}
                />
              </CardContent>
            </Card>
          ) : null}

          {selectedAlbum.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {selectedAlbum.images.map((image, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === selectedAlbum.images.length - 1;
                return (
                  <div
                    key={image.id}
                    className="group relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-card"
                  >
                    <div className="relative aspect-square bg-muted">
                      <Image
                        src={image.asset.url}
                        alt={image.caption || "صورة"}
                        fill
                        sizes="(min-width: 768px) 20vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover"
                      />
                      {image.isFeatured ? (
                        <div className="absolute right-1 top-1">
                          <div className="flex size-6 items-center justify-center rounded-full bg-champagne/90">
                            <Star className="size-3.5 fill-amber-950 text-amber-950" />
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 via-transparent to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(image.id)}
                          className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white/90 transition hover:bg-champagne hover:text-black"
                          title="مميزة"
                        >
                          <Star
                            className={`size-3.5 ${image.isFeatured ? "fill-champagne text-champagne" : ""}`}
                          />
                        </button>
                        {!isFirst ? (
                          <button
                            type="button"
                            onClick={() => handleReorder(image.id, "up")}
                            className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white/90 transition hover:bg-champagne hover:text-black"
                            title="تحريك لأعلى"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                        ) : null}
                        {!isLast ? (
                          <button
                            type="button"
                            onClick={() => handleReorder(image.id, "down")}
                            className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white/90 transition hover:bg-champagne hover:text-black"
                            title="تحريك لأسفل"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleSetCover(image.id)}
                          className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white/90 transition hover:bg-champagne hover:text-black"
                          title="تعيين كغلاف"
                        >
                          <ImagePlus className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("متأكد إنك عايز تمسح الصورة دي؟")) {
                              handleDeleteImage(image.id);
                            }
                          }}
                          className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white/90 transition hover:bg-danger hover:text-white"
                          title="حذف"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    {image.caption ? (
                      <div className="px-2 py-1.5">
                        <p className="truncate text-xs text-muted-foreground">
                          {image.caption}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="grid justify-items-center gap-3 py-10 text-center text-muted-foreground">
                <Images className="size-8" aria-hidden />
                <p>لسه مفيش صور في الألبوم ده.</p>
                <Button
                  variant="luxury"
                  size="sm"
                  onClick={() => setShowUpload(true)}
                >
                  <ImagePlus className="size-4" aria-hidden />
                  ضيف صور
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">الألبومات</h2>

              <span className="text-sm text-muted-foreground">
                {albums.length} {albums.length === 1 ? "ألبوم" : "ألبومات"}
              </span>
            </div>
            <Button
              variant="luxury"
              size="sm"
              onClick={() => setShowCreateForm((v) => !v)}
            >
              <Plus className="size-4" aria-hidden />
              ألبوم جديد
            </Button>
          </div>

          {showCreateForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ألبوم جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={handleCreateAlbum}
                  className="flex flex-wrap items-end gap-3"
                  onSubmit={() => setShowCreateForm(false)}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <label htmlFor="new-album-title" className="block text-sm font-medium text-foreground">
                      اسم الألبوم
                    </label>
                    <Input
                      id="new-album-title"
                      name="title"
                       placeholder="مثلاً: جلسة زفاف"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="luxury" size="sm">
                      <Plus className="size-4" aria-hidden />
                      إضافة
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                    >
                      <X className="size-4" aria-hidden />
                      إلغاء
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {albums.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
              {albums.map((album) => {
                const coverUrl = getCoverUrl(album);
                return (
                  <div
                    key={album.id}
                    className="min-w-[70%] shrink-0 snap-x snap-mandatory sm:min-w-0"
                  >
                    {renamingAlbumId === album.id ? (
                      <Card>
                        <CardContent className="p-3">
                          <form
                            action={handleRenameAlbum}
                            className="flex flex-col gap-2"
                          >
                            <input type="hidden" name="albumId" value={album.id} />
                            <Input
                              name="title"
                              defaultValue={album.title}
                              autoFocus
                              required
                              className="text-sm"
                            />
                            <div className="flex gap-1">
                              <Button type="submit" size="sm" variant="luxury">
                                حفظ
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setRenamingAlbumId(null)}
                              >
                                إلغاء
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    ) : confirmDelete === album.id ? (
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="mb-2 text-sm text-foreground">
                            تمسيح &ldquo;{album.title}&rdquo;؟
                          </p>
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="luxury"
                              onClick={() => handleConfirmDelete(album.id)}
                            >
                              حذف
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDelete(null)}
                            >
                              إلغاء
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div
                        className="group relative cursor-pointer overflow-hidden rounded-[var(--radius-card)] border border-border bg-card transition hover:border-champagne/50"
                        onClick={() => selectAlbum(album.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectAlbum(album.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`فتح ألبوم ${album.title}`}
                      >
                        <div className="relative aspect-[4/3] bg-muted">
                          {coverUrl ? (
                            <Image
                              src={coverUrl}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 70vw"
                              className="object-cover"
                              aria-hidden
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <FolderOpen
                                className="size-10 text-muted-foreground/50"
                                aria-hidden
                              />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="truncate font-medium text-foreground">
                            {album.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {album.images.length}{" "}
                            {album.images.length === 1 ? "صورة" : "صور"}
                          </p>
                        </div>
                        <div className="absolute left-2 top-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingAlbumId(album.id);
                            }}
                            className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white/90 transition hover:bg-champagne hover:text-black"
                            title="تعديل الاسم"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(album.id);
                            }}
                            className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white/90 transition hover:bg-danger hover:text-white"
                            title="حذف الألبوم"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="grid justify-items-center gap-3 py-10 text-center text-muted-foreground">
                <FolderOpen className="size-8" aria-hidden />
                <p>لسه مفيش ألبومات. اعمل أول ألبوم لصورك.</p>
                <Button
                  variant="luxury"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="size-4" aria-hidden />
                  إنشاء ألبوم
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
