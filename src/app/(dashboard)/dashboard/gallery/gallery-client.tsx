"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  FolderOpen,
  ImagePlus,
  Images,
  Pencil,
  Plus,
  Star,
  Trash2,
  UserSquare2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { BuilderNotice } from "@/components/dashboard/builder-primitives";
import { uploadSiteImageAction } from "@/app/(dashboard)/dashboard/site-info/actions";
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
  cover: { url: string } | null;
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
  avatarUrl: string | null;
  coverUrl: string | null;
  messages: Messages;
};

function getCoverUrl(album: AlbumWithImages): string | null {
  if (album.cover) return album.cover.url;
  if (album.images.length > 0) return album.images[0].asset.url;
  return null;
}

function getGalleryNotice(messages: Messages):
  | { tone: "success" | "error" | "warning"; title: string; description?: string; errorId?: string }
  | null {
  if (messages.error) {
    if (messages.error === "max-five-images") {
      return { tone: "warning", title: "وصلت للحد الحالي", description: "مسموح حالياً بخمس صور فقط داخل كل ألبوم." };
    }
    return {
      tone: "error",
      title: "مقدرناش ننفذ العملية",
      description: "جرب تاني، ولو المشكلة لسه موجودة انسخ رقم الخطأ وابعتلنا.",
      errorId: messages.error,
    };
  }
  if (messages.uploaded) return { tone: "success", title: `اترفع ${messages.uploaded} صورة` };
  if (messages.created) return { tone: "success", title: "الألبوم اتعمل" };
  if (messages.deleted) return { tone: "success", title: "اتمسح" };
  if (messages.renamed) return { tone: "success", title: "اتحدثت بيانات الألبوم" };
  if (messages.coverSet) return { tone: "success", title: "اتحددت صورة الغلاف" };
  if (messages.featuredToggled) return { tone: "success", title: "اتحدثت الصورة المميزة" };
  if (messages.reordered) return { tone: "success", title: "اترتبت الصور" };
  return null;
}

export function GalleryClient({ albums, selectedAlbumId: initialAlbumId, avatarUrl, coverUrl, messages }: GalleryClientProps) {
  const router = useRouter();
  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(() => {
    if (initialAlbumId && albums.some((album) => album.id === initialAlbumId)) return initialAlbumId;
    return null;
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [renamingAlbumId, setRenamingAlbumId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [coverPreview, setCoverPreview] = useState<string | null>(coverUrl);
  const [imageState, setImageState] = useState<string | null>(null);
  const [imageOk, setImageOk] = useState(false);

  const selectedAlbum = currentAlbumId ? albums.find((album) => album.id === currentAlbumId) ?? null : null;
  const notice = getGalleryNotice(messages);
  const totalImages = albums.reduce((sum, album) => sum + album.images.length, 0);

  const selectAlbum = (id: string) => {
    setCurrentAlbumId(id);
    setShowUpload(false);
    router.replace(`/dashboard/gallery?albumId=${id}`, { scroll: false });
  };

  const deselectAlbum = () => {
    setCurrentAlbumId(null);
    setShowUpload(false);
    router.replace("/dashboard/gallery", { scroll: false });
  };

  async function uploadProfileImage(field: "avatarAssetId" | "coverAssetId", files: File[]) {
    const file = files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    fd.append("field", field);
    const result = await uploadSiteImageAction(fd);
    setImageState(result.message);
    setImageOk(result.ok);
    if (result.ok) {
      const url = URL.createObjectURL(file);
      if (field === "avatarAssetId") setAvatarPreview(url);
      else setCoverPreview(url);
    }
  }

  function handleCreateAlbum(formData: FormData) {
    createAlbumAction(formData);
  }

  function handleRenameAlbum(formData: FormData) {
    renameAlbumAction(formData);
    setRenamingAlbumId(null);
  }

  function handleUpload(files: File[]) {
    if (!selectedAlbum) return;
    const formData = new FormData();
    formData.set("albumId", selectedAlbum.id);
    files.slice(0, Math.max(0, 5 - selectedAlbum.images.length)).forEach((file) => formData.append("images", file));
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
    deleteAlbumAction(formData);
    setConfirmDelete(null);
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
              الصورة الشخصية والغلاف وألبومات من أعمالك. كل صورة ليها مكان محدد في الموقع.
            </p>
          </div>
        </div>
      </section>

      {notice ? <BuilderNotice tone={notice.tone} title={notice.title} description={notice.description} errorId={notice.errorId} /> : null}
      {imageState ? <BuilderNotice tone={imageOk ? "success" : "error"} title={imageState} /> : null}

      {selectedAlbum ? (
        <AlbumWorkspace
          album={selectedAlbum}
          showUpload={showUpload}
          setShowUpload={setShowUpload}
          onBack={deselectAlbum}
          handleUpload={handleUpload}
          handleToggleFeatured={handleToggleFeatured}
          handleReorder={handleReorder}
          handleSetCover={handleSetCover}
          handleDeleteImage={handleDeleteImage}
          renaming={renamingAlbumId === selectedAlbum.id}
          setRenamingAlbumId={setRenamingAlbumId}
          handleRenameAlbum={handleRenameAlbum}
        />
      ) : (
        <div data-smart-tip="gallery-grid">
          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <ImageCard
              title="صورة المصور"
              description="تظهر مربعة أعلى الموقع بجانب اسمك."
              preview={avatarPreview}
              square
              icon={UserSquare2}
              onUpload={(files) => uploadProfileImage("avatarAssetId", files)}
            />
            <ImageCard
              title="صورة الغلاف"
              description="تظهر عريضة في أعلى الصفحة الرئيسية."
              preview={coverPreview}
              icon={Images}
              onUpload={(files) => uploadProfileImage("coverAssetId", files)}
            />
          </section>

          <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
            <div className="flex items-start justify-between gap-3 border-b border-white/8 p-4">
              <div>
                <h2 className="text-base font-black text-[#fff7e8]">ألبومات الأعمال</h2>
                <p className="mt-1 text-xs font-bold leading-5 text-white/45">صور من أعمالك تظهر للعميل في قسم المعرض.</p>
              </div>
              <Button variant="luxury" className="min-h-10 rounded-2xl font-black" onClick={() => setShowCreateForm((value) => !value)}>
                {showCreateForm ? <X className="size-4" /> : <Plus className="size-4" />}
                ألبوم
              </Button>
            </div>

            <div className="p-4">
              {showCreateForm ? (
                <form action={handleCreateAlbum} className="grid gap-3 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3" onSubmit={() => setShowCreateForm(false)}>
                  <label className="grid gap-1.5"><span className="text-xs font-black text-white/55">عنوان الألبوم</span><Input name="title" placeholder="مثلاً: جلسات زفاف" required autoFocus /></label>
                  <label className="grid gap-1.5"><span className="text-xs font-black text-white/55">وصف الألبوم (اختياري)</span><Input name="description" placeholder="وصف بسيط يظهر للعميل" /></label>
                  <div className="grid grid-cols-2 gap-2"><Button type="submit" variant="luxury" className="rounded-xl">إنشاء</Button><Button type="button" variant="ghost" className="rounded-xl" onClick={() => setShowCreateForm(false)}>إلغاء</Button></div>
                </form>
              ) : null}

              {albums.length === 0 ? <EmptyGalleryState onCreate={() => setShowCreateForm(true)} /> : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {albums.map((album) => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      renaming={renamingAlbumId === album.id}
                      confirmingDelete={confirmDelete === album.id}
                      onOpen={() => selectAlbum(album.id)}
                      onRename={() => setRenamingAlbumId(album.id)}
                      onCancelRename={() => setRenamingAlbumId(null)}
                      onDelete={() => setConfirmDelete(album.id)}
                      onCancelDelete={() => setConfirmDelete(null)}
                      onConfirmDelete={() => handleConfirmDelete(album.id)}
                      handleRenameAlbum={handleRenameAlbum}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black text-white/38">ملخص الصور</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-lg font-black text-[#fff7e8]">{totalImages} صورة</span>
              <span className="text-xs font-bold text-white/45">· {albums.length} ألبوم</span>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function ImageCard({ title, description, preview, onUpload, square, icon: Icon }: { title: string; description: string; preview: string | null; onUpload: (files: File[]) => void; square?: boolean; icon: typeof UserSquare2 }) {
  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
      <div className="flex items-start gap-3 border-b border-white/8 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-[#f3cf73]"><Icon className="size-4" /></span>
        <div className="min-w-0"><h2 className="text-sm font-black text-[#fff7e8]">{title}</h2><p className="mt-0.5 text-[0.68rem] font-bold leading-5 text-white/45">{description}</p></div>
      </div>
      <div className="p-3">
        <div className={square ? "relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-black/20" : "relative aspect-[16/7] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20"}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={title} className="size-full object-cover" />
          ) : <div className="grid size-full place-items-center text-white/28"><ImagePlus className="size-7" /></div>}
        </div>
        <div className="mt-2.5"><ImageUploader onUpload={onUpload} multiple={false} maxFiles={1} maxSizeMB={20} /></div>
      </div>
    </section>
  );
}

function AlbumWorkspace({
  album,
  showUpload,
  setShowUpload,
  onBack,
  handleUpload,
  handleToggleFeatured,
  handleReorder,
  handleSetCover,
  handleDeleteImage,
  renaming,
  setRenamingAlbumId,
  handleRenameAlbum,
}: {
  album: AlbumWithImages;
  showUpload: boolean;
  setShowUpload: (value: boolean | ((value: boolean) => boolean)) => void;
  onBack: () => void;
  handleUpload: (files: File[]) => void;
  handleToggleFeatured: (imageId: string) => void;
  handleReorder: (imageId: string, direction: "up" | "down") => void;
  handleSetCover: (imageId: string) => void;
  handleDeleteImage: (imageId: string) => void;
  renaming: boolean;
  setRenamingAlbumId: (value: string | null) => void;
  handleRenameAlbum: (formData: FormData) => void;
}) {
  const remaining = Math.max(0, 5 - album.images.length);
  return (
    <section className="grid gap-3">
      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-xs font-black text-[#f3cf73]"><ArrowLeft className="size-3.5" /> كل الألبومات</button>
            <h2 className="text-xl font-black text-[#fff7e8]">{album.title}</h2>
            <p className="mt-1 text-sm font-bold text-white/45">{album.images.length}/5 صور · ارفع صور من أعمالك.</p>
          </div>
          <Button variant="luxury" disabled={remaining === 0} className="min-h-11 rounded-2xl font-black disabled:opacity-45" onClick={() => setShowUpload((value) => !value)}>
            <ImagePlus className="size-4" />
            {remaining === 0 ? "اكتمل 5 صور" : showUpload ? "إخفاء الرفع" : "ضيف صور"}
          </Button>
        </div>
      </div>

      {renaming ? (
        <form action={handleRenameAlbum} className="grid gap-3 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3">
          <input type="hidden" name="albumId" value={album.id} />
          <Input name="title" defaultValue={album.title} autoFocus required />
          <Input name="description" defaultValue={album.description ?? ""} placeholder="وصف الألبوم" />
          <div className="grid grid-cols-2 gap-2"><Button type="submit" variant="luxury" className="rounded-xl">حفظ</Button><Button type="button" variant="ghost" className="rounded-xl" onClick={() => setRenamingAlbumId(null)}>إلغاء</Button></div>
        </form>
      ) : (
        <Button variant="secondary" className="rounded-2xl border-white/10 bg-white/[0.04] font-black text-white" onClick={() => setRenamingAlbumId(album.id)}><Pencil className="size-4" /> تعديل عنوان ووصف الألبوم</Button>
      )}

      {showUpload && remaining > 0 ? (
        <div className="rounded-[1.2rem] border border-amber-300/18 bg-amber-300/8 p-4">
          <h3 className="text-base font-black text-[#fff7e8]">ارفع صور لـ {album.title}</h3>
          <p className="mt-1 text-xs font-bold leading-6 text-white/45">مسموح حالياً بخمس صور داخل كل ألبوم. باقي لك {remaining} صور.</p>
          <div className="mt-3"><ImageUploader onUpload={handleUpload} multiple maxFiles={remaining} maxSizeMB={20} /></div>
        </div>
      ) : null}

      {album.images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {album.images.map((image, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === album.images.length - 1;
            return (
              <article key={image.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                <div className="relative aspect-square bg-black/20"><Image src={image.asset.url} alt={image.caption || "صورة من المعرض"} fill sizes="(min-width: 1024px) 20vw, 50vw" className="object-cover" />{image.isFeatured ? <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#f3cf73] text-[#17120a]"><Star className="size-3.5 fill-current" /></span> : null}</div>
                <div className="grid grid-cols-5 gap-1 p-2">
                  <IconButton label="مميزة" onClick={() => handleToggleFeatured(image.id)}><Star className={image.isFeatured ? "size-3.5 fill-current" : "size-3.5"} /></IconButton>
                  <IconButton label="فوق" disabled={isFirst} onClick={() => handleReorder(image.id, "up")}><ArrowUp className="size-3.5" /></IconButton>
                  <IconButton label="تحت" disabled={isLast} onClick={() => handleReorder(image.id, "down")}><ArrowDown className="size-3.5" /></IconButton>
                  <IconButton label="غلاف" onClick={() => handleSetCover(image.id)}><ImagePlus className="size-3.5" /></IconButton>
                  <IconButton label="حذف" danger onClick={() => window.confirm("متأكد إنك عايز تمسح الصورة دي؟") ? handleDeleteImage(image.id) : undefined}><Trash2 className="size-3.5" /></IconButton>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="grid justify-items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-8 text-center">
          <Images className="size-10 text-white/30" />
          <div><h3 className="text-base font-black text-[#fff7e8]">الألبوم لسه فاضي</h3><p className="mt-1 text-sm font-bold text-white/45">ارفع صورة الغلاف أو أول صور من أعمالك.</p></div>
          <Button variant="luxury" className="rounded-2xl font-black" onClick={() => setShowUpload(true)}><ImagePlus className="size-4" />ضيف صور</Button>
        </div>
      )}
    </section>
  );
}

function AlbumCard({ album, renaming, confirmingDelete, onOpen, onRename, onCancelRename, onDelete, onCancelDelete, onConfirmDelete, handleRenameAlbum }: { album: AlbumWithImages; renaming: boolean; confirmingDelete: boolean; onOpen: () => void; onRename: () => void; onCancelRename: () => void; onDelete: () => void; onCancelDelete: () => void; onConfirmDelete: () => void; handleRenameAlbum: (formData: FormData) => void; }) {
  const coverUrl = getCoverUrl(album);
  if (renaming) return <form action={handleRenameAlbum} className="grid gap-2 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3"><input type="hidden" name="albumId" value={album.id} /><Input name="title" defaultValue={album.title} autoFocus required /><Input name="description" defaultValue={album.description ?? ""} placeholder="وصف الألبوم" /><div className="grid grid-cols-2 gap-2"><Button type="submit" variant="luxury" className="rounded-xl">حفظ</Button><Button type="button" variant="ghost" className="rounded-xl" onClick={onCancelRename}>إلغاء</Button></div></form>;
  if (confirmingDelete) return <div className="grid gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-center"><p className="text-sm font-black text-[#fff7e8]">تمسح &quot;{album.title}&quot;؟</p><p className="text-xs font-bold text-white/45">الصور المرتبطة بالألبوم مش هتظهر للعميل.</p><div className="grid grid-cols-2 gap-2"><Button size="sm" variant="luxury" onClick={onConfirmDelete}>حذف</Button><Button size="sm" variant="ghost" onClick={onCancelDelete}>إلغاء</Button></div></div>;
  return <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]"><button type="button" onClick={onOpen} className="block w-full text-start"><div className="relative aspect-[4/3] bg-black/20">{coverUrl ? <Image src={coverUrl} alt="" fill sizes="(min-width: 1024px) 25vw, 100vw" className="object-cover" aria-hidden /> : <div className="flex h-full items-center justify-center"><FolderOpen className="size-10 text-white/25" /></div>}</div><div className="p-3"><h3 className="truncate text-sm font-black text-[#fff7e8]">{album.title}</h3>{album.description ? <p className="mt-1 line-clamp-2 text-xs font-bold text-white/42">{album.description}</p> : null}<p className="mt-1 text-xs font-bold text-white/42">{album.images.length}/5 صور</p></div></button><div className="grid grid-cols-2 gap-2 border-t border-white/8 p-2"><button type="button" onClick={onRename} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-white/[0.04] text-xs font-black text-white/60"><Pencil className="size-3.5" />تعديل</button><button type="button" onClick={onDelete} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-red-500/10 text-xs font-black text-red-200"><Trash2 className="size-3.5" />حذف</button></div></article>;
}

function EmptyGalleryState({ onCreate }: { onCreate: () => void }) {
  return <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-white/14 bg-black/15 p-8 text-center"><FolderOpen className="size-10 text-white/28" /><div><h3 className="text-base font-black text-[#fff7e8]">اعمل أول ألبوم</h3><p className="mt-1 max-w-sm text-sm font-bold leading-7 text-white/45">اكتب عنوان الألبوم وبعدها ارفع لحد 5 صور كبداية.</p></div><Button variant="luxury" className="rounded-2xl font-black" onClick={onCreate}><Plus className="size-4" />إنشاء ألبوم</Button></div>;
}

function IconButton({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} title={label} className={danger ? "grid size-8 place-items-center rounded-xl bg-red-500/10 text-red-200 transition hover:bg-red-500/20 disabled:opacity-25" : "grid size-8 place-items-center rounded-xl bg-white/[0.06] text-white/65 transition hover:bg-amber-300/15 hover:text-[#f3cf73] disabled:opacity-25"}>{children}</button>;
}
