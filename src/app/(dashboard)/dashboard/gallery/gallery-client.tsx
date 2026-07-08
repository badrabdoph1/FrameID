"use client";

import { useMemo, useState } from "react";
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
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { BuilderNotice } from "@/components/dashboard/builder-primitives";
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
      description: "جرب تاني، ولو المشكلة لسه موجودة انسخ رقم الخطأ وابعتلنا.",
      errorId: messages.error,
    };
  }
  if (messages.uploaded) {
    return {
      tone: "success",
      title: `اترفع ${messages.uploaded} ${messages.uploaded === "1" ? "صورة" : "صور"}`,
      description: "دلوقتي تقدر ترتب الصور وتختار الغلاف والصور المميزة.",
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

export function GalleryClient({ albums, selectedAlbumId: initialAlbumId, messages }: GalleryClientProps) {
  const router = useRouter();
  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(() => {
    if (initialAlbumId && albums.some((album) => album.id === initialAlbumId)) return initialAlbumId;
    return null;
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [renamingAlbumId, setRenamingAlbumId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selectedAlbum = currentAlbumId ? albums.find((album) => album.id === currentAlbumId) ?? null : null;
  const notice = getGalleryNotice(messages);
  const totalImages = albums.reduce((sum, album) => sum + album.images.length, 0);
  const featuredImages = albums.reduce((sum, album) => sum + album.images.filter((image) => image.isFeatured).length, 0);
  const filteredAlbums = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return albums;
    return albums.filter((album) => album.title.toLowerCase().includes(normalized));
  }, [albums, query]);

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

  function handleCreateAlbum(formData: FormData) {
    createAlbumAction(formData);
  }

  function handleRenameAlbum(formData: FormData) {
    renameAlbumAction(formData);
    setRenamingAlbumId(null);
  }

  function handleDeleteAlbum(formData: FormData) {
    deleteAlbumAction(formData);
  }

  function handleUpload(files: File[]) {
    if (!selectedAlbum) return;
    const formData = new FormData();
    formData.set("albumId", selectedAlbum.id);
    files.forEach((file) => formData.append("images", file));
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
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4">
      <section className="rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.12),transparent_36%),rgba(255,255,255,0.035)] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">معرض الأعمال</p>
            <h1 className="mt-1 text-2xl font-black text-[#fff7e8] sm:text-3xl">صورك هي أهم حاجة في الموقع</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">
              اعمل ألبومات حسب نوع التصوير، ارفع أفضل الصور، واختار الغلاف والصور المميزة عشان العميل يفهم شغلك بسرعة.
            </p>
          </div>
          <div className="grid gap-2 sm:flex">
            <Button variant="luxury" className="min-h-11 rounded-2xl font-black" onClick={() => selectedAlbum ? setShowUpload(true) : setShowCreateForm(true)}>
              <ImagePlus className="size-4" aria-hidden />
              {selectedAlbum ? "ضيف صور" : "ألبوم جديد"}
            </Button>
            {selectedAlbum ? (
              <Button variant="secondary" className="min-h-11 rounded-2xl border-white/10 bg-white/[0.04] font-black text-white" onClick={deselectAlbum}>
                <X className="size-4" aria-hidden />
                كل الألبومات
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatCard label="الألبومات" value={albums.length} />
          <StatCard label="الصور" value={totalImages} />
          <StatCard label="مميزة" value={featuredImages} />
        </div>
      </section>

      {notice ? <BuilderNotice tone={notice.tone} title={notice.title} description={notice.description} errorId={notice.errorId} /> : null}

      {selectedAlbum ? (
        <AlbumWorkspace
          album={selectedAlbum}
          showUpload={showUpload}
          setShowUpload={setShowUpload}
          handleUpload={handleUpload}
          handleToggleFeatured={handleToggleFeatured}
          handleReorder={handleReorder}
          handleSetCover={handleSetCover}
          handleDeleteImage={handleDeleteImage}
        />
      ) : (
        <AlbumsWorkspace
          albums={filteredAlbums}
          allAlbumsCount={albums.length}
          query={query}
          setQuery={setQuery}
          showCreateForm={showCreateForm}
          setShowCreateForm={setShowCreateForm}
          renamingAlbumId={renamingAlbumId}
          setRenamingAlbumId={setRenamingAlbumId}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          selectAlbum={selectAlbum}
          handleCreateAlbum={handleCreateAlbum}
          handleRenameAlbum={handleRenameAlbum}
          handleConfirmDelete={handleConfirmDelete}
        />
      )}
    </main>
  );
}

function AlbumsWorkspace({
  albums,
  allAlbumsCount,
  query,
  setQuery,
  showCreateForm,
  setShowCreateForm,
  renamingAlbumId,
  setRenamingAlbumId,
  confirmDelete,
  setConfirmDelete,
  selectAlbum,
  handleCreateAlbum,
  handleRenameAlbum,
  handleConfirmDelete,
}: {
  albums: AlbumWithImages[];
  allAlbumsCount: number;
  query: string;
  setQuery: (value: string) => void;
  showCreateForm: boolean;
  setShowCreateForm: (value: boolean | ((value: boolean) => boolean)) => void;
  renamingAlbumId: string | null;
  setRenamingAlbumId: (value: string | null) => void;
  confirmDelete: string | null;
  setConfirmDelete: (value: string | null) => void;
  selectAlbum: (id: string) => void;
  handleCreateAlbum: (formData: FormData) => void;
  handleRenameAlbum: (formData: FormData) => void;
  handleConfirmDelete: (albumId: string) => void;
}) {
  return (
    <section className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث باسم الألبوم..."
            className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 pr-10 pl-3 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-amber-300/40"
          />
        </label>
        <Button variant="luxury" className="min-h-11 rounded-2xl font-black" onClick={() => setShowCreateForm((value) => !value)}>
          <Plus className="size-4" aria-hidden />
          ألبوم جديد
        </Button>
      </div>

      {showCreateForm ? (
        <form action={handleCreateAlbum} className="grid gap-3 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={() => setShowCreateForm(false)}>
          <label className="grid gap-1.5">
            <span className="text-xs font-black text-white/55">اسم الألبوم</span>
            <Input name="title" placeholder="مثلاً: جلسات زفاف، منتجات، أطفال" required autoFocus />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button type="submit" variant="luxury" className="min-h-10 rounded-xl font-black">إضافة</Button>
            <Button type="button" variant="ghost" className="min-h-10 rounded-xl" onClick={() => setShowCreateForm(false)}>إلغاء</Button>
          </div>
        </form>
      ) : null}

      {allAlbumsCount === 0 ? (
        <EmptyGalleryState onCreate={() => setShowCreateForm(true)} />
      ) : albums.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/15 p-8 text-center text-sm font-bold text-white/45">
          مفيش ألبوم بالاسم ده. جرّب كلمة تانية.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    </section>
  );
}

function AlbumWorkspace({
  album,
  showUpload,
  setShowUpload,
  handleUpload,
  handleToggleFeatured,
  handleReorder,
  handleSetCover,
  handleDeleteImage,
}: {
  album: AlbumWithImages;
  showUpload: boolean;
  setShowUpload: (value: boolean | ((value: boolean) => boolean)) => void;
  handleUpload: (files: File[]) => void;
  handleToggleFeatured: (imageId: string) => void;
  handleReorder: (imageId: string, direction: "up" | "down") => void;
  handleSetCover: (imageId: string) => void;
  handleDeleteImage: (imageId: string) => void;
}) {
  return (
    <section className="grid gap-3">
      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-black text-[#f3cf73]">داخل الألبوم</p>
            <h2 className="mt-1 text-xl font-black text-[#fff7e8]">{album.title}</h2>
            <p className="mt-1 text-sm font-bold text-white/45">{album.images.length} صورة · اختار الغلاف والصور المميزة ورتب ظهورهم.</p>
          </div>
          <Button variant="luxury" className="min-h-11 rounded-2xl font-black" onClick={() => setShowUpload((value) => !value)}>
            <ImagePlus className="size-4" aria-hidden />
            {showUpload ? "إخفاء الرفع" : "ضيف صور"}
          </Button>
        </div>
      </div>

      {showUpload ? (
        <div className="rounded-[1.35rem] border border-amber-300/18 bg-amber-300/8 p-4">
          <h3 className="text-base font-black text-[#fff7e8]">ارفع صور لـ {album.title}</h3>
          <p className="mt-1 text-xs font-bold leading-6 text-white/45">اختار صور واضحة. يفضل أقل من 10MB للصورة عشان الموقع يفضل سريع.</p>
          <div className="mt-3">
            <ImageUploader onUpload={handleUpload} multiple maxFiles={20} maxSizeMB={10} />
          </div>
        </div>
      ) : null}

      {album.images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {album.images.map((image, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === album.images.length - 1;
            return (
              <article key={image.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                <div className="relative aspect-square bg-black/20">
                  <Image src={image.asset.url} alt={image.caption || "صورة من المعرض"} fill sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
                  {image.isFeatured ? (
                    <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#f3cf73] text-[#17120a] shadow-lg">
                      <Star className="size-3.5 fill-current" aria-hidden />
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-2 p-2">
                  <div className="grid grid-cols-5 gap-1">
                    <IconButton label="مميزة" onClick={() => handleToggleFeatured(image.id)}><Star className={image.isFeatured ? "size-3.5 fill-current" : "size-3.5"} /></IconButton>
                    <IconButton label="فوق" disabled={isFirst} onClick={() => handleReorder(image.id, "up")}><ArrowUp className="size-3.5" /></IconButton>
                    <IconButton label="تحت" disabled={isLast} onClick={() => handleReorder(image.id, "down")}><ArrowDown className="size-3.5" /></IconButton>
                    <IconButton label="غلاف" onClick={() => handleSetCover(image.id)}><ImagePlus className="size-3.5" /></IconButton>
                    <IconButton label="حذف" danger onClick={() => window.confirm("متأكد إنك عايز تمسح الصورة دي؟") ? handleDeleteImage(image.id) : undefined}><Trash2 className="size-3.5" /></IconButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="grid justify-items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-10 text-center">
          <Images className="size-10 text-white/30" aria-hidden />
          <div>
            <h3 className="text-base font-black text-[#fff7e8]">الألبوم لسه فاضي</h3>
            <p className="mt-1 text-sm font-bold text-white/45">ارفع 6–12 صورة قوية كبداية، وبعدها رتبهم حسب الأفضل.</p>
          </div>
          <Button variant="luxury" className="rounded-2xl font-black" onClick={() => setShowUpload(true)}>
            <ImagePlus className="size-4" aria-hidden />
            ضيف صور
          </Button>
        </div>
      )}
    </section>
  );
}

function AlbumCard({
  album,
  renaming,
  confirmingDelete,
  onOpen,
  onRename,
  onCancelRename,
  onDelete,
  onCancelDelete,
  onConfirmDelete,
  handleRenameAlbum,
}: {
  album: AlbumWithImages;
  renaming: boolean;
  confirmingDelete: boolean;
  onOpen: () => void;
  onRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  handleRenameAlbum: (formData: FormData) => void;
}) {
  const coverUrl = getCoverUrl(album);

  if (renaming) {
    return (
      <form action={handleRenameAlbum} className="grid gap-2 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3">
        <input type="hidden" name="albumId" value={album.id} />
        <Input name="title" defaultValue={album.title} autoFocus required />
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" variant="luxury" className="rounded-xl">حفظ</Button>
          <Button type="button" variant="ghost" className="rounded-xl" onClick={onCancelRename}>إلغاء</Button>
        </div>
      </form>
    );
  }

  if (confirmingDelete) {
    return (
      <div className="grid gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-center">
        <p className="text-sm font-black text-[#fff7e8]">تمسح “{album.title}”؟</p>
        <p className="text-xs font-bold text-white/45">الصور المرتبطة بالألبوم مش هتظهر للعميل.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="luxury" onClick={onConfirmDelete}>حذف</Button>
          <Button size="sm" variant="ghost" onClick={onCancelDelete}>إلغاء</Button>
        </div>
      </div>
    );
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition hover:-translate-y-0.5 hover:border-amber-300/20">
      <button type="button" onClick={onOpen} className="block w-full text-start">
        <div className="relative aspect-[4/3] bg-black/20">
          {coverUrl ? (
            <Image src={coverUrl} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" aria-hidden />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FolderOpen className="size-10 text-white/25" aria-hidden />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="truncate text-sm font-black text-[#fff7e8]">{album.title}</h3>
          <p className="mt-1 text-xs font-bold text-white/42">{album.images.length} {album.images.length === 1 ? "صورة" : "صور"}</p>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-2 border-t border-white/8 p-2">
        <button type="button" onClick={onRename} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-white/[0.04] text-xs font-black text-white/60 transition hover:bg-white/[0.08] hover:text-white">
          <Pencil className="size-3.5" aria-hidden />
          تعديل
        </button>
        <button type="button" onClick={onDelete} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-red-500/10 text-xs font-black text-red-200 transition hover:bg-red-500/20">
          <Trash2 className="size-3.5" aria-hidden />
          حذف
        </button>
      </div>
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/18 p-3">
      <p className="text-xl font-black text-[#fff7e8]">{value}</p>
      <p className="text-[0.72rem] font-black text-white/38">{label}</p>
    </div>
  );
}

function IconButton({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={danger ? "grid size-8 place-items-center rounded-xl bg-red-500/10 text-red-200 transition hover:bg-red-500/20 disabled:opacity-25" : "grid size-8 place-items-center rounded-xl bg-white/[0.055] text-white/65 transition hover:bg-amber-300/15 hover:text-[#f3cf73] disabled:opacity-25"}
    >
      {children}
    </button>
  );
}

function EmptyGalleryState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-[1.35rem] border border-dashed border-white/14 bg-black/15 p-10 text-center">
      <FolderOpen className="size-10 text-white/28" aria-hidden />
      <div>
        <h3 className="text-base font-black text-[#fff7e8]">ابدأ بأول ألبوم</h3>
        <p className="mt-1 max-w-sm text-sm font-bold leading-7 text-white/45">الألبوم يخلي العميل يشوف نوع شغلك بسرعة: زفاف، منتجات، أطفال، حفلات، أو أي تصنيف مناسب ليك.</p>
      </div>
      <Button variant="luxury" className="rounded-2xl font-black" onClick={onCreate}>
        <Plus className="size-4" aria-hidden />
        إنشاء ألبوم
      </Button>
    </div>
  );
}
