"use client";

import { useState, type ReactNode } from "react";
import {
  Check,
  Image as ImageIcon,
  Package,
  Pencil,
  Phone,
  Save,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { saveUnifiedContentAction } from "@/app/(admin)/admin/templates/unified-content-actions";
import type { z } from "zod";
import type { UnifiedTemplateContentSchema } from "@/lib/content/schemas/templates";

type UnifiedContent = z.infer<typeof UnifiedTemplateContentSchema>;

const inputClass = "min-h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs font-bold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/10";
const textareaClass = "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs font-bold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/10 resize-none";

export function UnifiedContentEditor({ content }: { content: UnifiedContent }) {
  const [tab, setTab] = useState<"hero" | "packages" | "extras" | "gallery" | "contact">("packages");

  const tabs: { key: typeof tab; icon: typeof Package; label: string }[] = [
    { key: "hero", icon: Sparkles, label: "الأساسي" },
    { key: "packages", icon: Package, label: "الباقات" },
    { key: "extras", icon: Sparkles, label: "الإضافات" },
    { key: "gallery", icon: ImageIcon, label: "المعرض" },
    { key: "contact", icon: Phone, label: "التواصل" },
  ];

  return (
    <form action={saveUnifiedContentAction} className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04]">
      {/* رأس القسم */}
      <div className="flex items-center gap-3 border-b border-white/6 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-[#f3cf73]"><Sparkles className="size-4" /></span>
        <div className="flex-1">
          <h2 className="text-sm font-black text-[#fff7e8]">المحتوى الموحد للقوالب</h2>
          <p className="text-[0.65rem] font-bold text-white/40">كل تعديل هنا يطبّق على جميع القوالب تلقائياً</p>
        </div>
        <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f3cf73] to-[#d4af37] px-3.5 text-xs font-black text-[#17120a]"><Save className="size-3.5" /> حفظ الكل</button>
      </div>

      {/* تبويبات */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/6 px-4 py-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={tab === t.key
              ? "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-amber-300/15 px-3 text-[0.7rem] font-bold text-[#f3cf73]"
              : "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[0.7rem] font-bold text-white/40 hover:bg-white/[0.04] hover:text-white/70"}
          >
            <t.icon className="size-3" /> {t.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      <div className="p-4">
        {tab === "hero" && <HeroEditor content={content} />}
        {tab === "packages" && <PackagesEditor content={content} />}
        {tab === "extras" && <ExtrasEditor content={content} />}
        {tab === "gallery" && <GalleryEditor content={content} />}
        {tab === "contact" && <ContactEditor content={content} />}
      </div>
    </form>
  );
}

/* ───────── Hero / الأساسي ───────── */
function HeroEditor({ content }: { content: UnifiedContent }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <F label="اسم المصور" wide><input name="photographerName" defaultValue={content.photographerName} className={inputClass} /></F>
      <F label="اسم الاستوديو"><input name="studioName" defaultValue={content.studioName} className={inputClass} /></F>
      <F label="مكان العمل"><input name="workLocation" defaultValue={content.workLocation} className={inputClass} /></F>
      <F label="الوصف العام" wide><textarea name="description" defaultValue={content.description} rows={2} className={textareaClass} /></F>
      <F label="عبارة Hero العلوية" wide><input name="heroEyebrow" defaultValue={content.heroEyebrow} className={inputClass} dir="ltr" /></F>
      <F label="نص زر الحجز"><input name="heroCtaLabel" defaultValue={content.heroCtaLabel} className={inputClass} /></F>
      <F label="صورة Hero" wide><Img name="heroImageUrl" defaultValue={content.heroImageUrl} /></F>
    </div>
  );
}

/* ───────── الباقات ───────── */
function PackagesEditor({ content }: { content: UnifiedContent }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <F label="عنوان القسم" className="flex-1"><input name="packagesTitle" defaultValue={content.packagesTitle} className={inputClass} /></F>
        <F label="الوصف" className="flex-[2]"><input name="packagesDescription" defaultValue={content.packagesDescription} className={inputClass} /></F>
      </div>

      <div className="grid gap-2">
        <p className="text-[0.65rem] font-bold text-white/35">{content.packages.length} باقات</p>
        {content.packages.map((pkg, i) => (
          <PackageRow key={pkg.id} pkg={pkg} index={i} />
        ))}
      </div>
    </div>
  );
}

function PackageRow({ pkg, index: i }: { pkg: UnifiedContent["packages"][number]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/8 bg-black/12">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start"
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/[0.05] text-[0.6rem] font-bold text-white/35">{i + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-bold text-[#fff7e8]">{pkg.name}</span>
            {pkg.isHighlighted && <Star className="size-3 shrink-0 fill-amber-300/80 text-amber-300/80" />}
          </div>
          <span className="text-[0.65rem] font-bold text-white/35">{pkg.priceAmount.toLocaleString("ar-EG")} {pkg.currency}</span>
        </div>
        <span className={open ? "text-amber-300" : "text-white/25"}><Pencil className="size-3.5" /></span>
      </button>

      {open && (
        <div className="border-t border-white/6 p-3 pt-2.5 grid gap-2.5">
          <input type="hidden" name={`pkg_${i}_id`} defaultValue={pkg.id} />
          <div className="grid gap-2.5 sm:grid-cols-3">
            <F label="الاسم"><input name={`pkg_${i}_name`} defaultValue={pkg.name} className={inputClass} /></F>
            <F label="السعر"><input name={`pkg_${i}_price`} type="number" defaultValue={pkg.priceAmount} className={inputClass} /></F>
            <F label="العملة"><input name={`pkg_${i}_currency`} defaultValue={pkg.currency} className={inputClass} /></F>
          </div>
          <F label="الوصف القصير"><input name={`pkg_${i}_subtitle`} defaultValue={pkg.subtitle} className={inputClass} /></F>
          <Img name={`pkg_${i}_imageUrl`} defaultValue={pkg.imageUrl} />
          <F label="المميزات (كل ميزة في سطر)">
            <textarea name={`pkg_${i}_features`} defaultValue={pkg.features.join("\n")} rows={4} className={textareaClass} placeholder="فوتوسيشن خارجي&#10;تعديل احترافي&#10;ألبوم فاخر" />
          </F>
          <label className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/12 px-2.5 py-2 text-xs font-bold text-white/60 cursor-pointer hover:border-amber-300/20">
            <input type="checkbox" name={`pkg_${i}_highlighted`} defaultChecked={pkg.isHighlighted} className="size-3.5 accent-[#f3cf73]" />
            <Star className="size-3 text-amber-300/60" /> الباقة الأكثر طلباً
          </label>
        </div>
      )}
    </div>
  );
}

/* ───────── الإضافات ───────── */
function ExtrasEditor({ content }: { content: UnifiedContent }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <F label="عنوان القسم" className="flex-1"><input name="extrasTitle" defaultValue={content.extrasTitle} className={inputClass} /></F>
        <F label="الوصف" className="flex-[2]"><input name="extrasDescription" defaultValue={content.extrasDescription} className={inputClass} /></F>
      </div>

      <div className="grid gap-2">
        <p className="text-[0.65rem] font-bold text-white/35">{content.extras.length} إضافات</p>
        {content.extras.map((extra, i) => (
          <ExtraRow key={extra.id} extra={extra} index={i} />
        ))}
      </div>
    </div>
  );
}

function ExtraRow({ extra, index: i }: { extra: UnifiedContent["extras"][number]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/8 bg-black/12">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/[0.05] text-[0.6rem] font-bold text-white/35">{i + 1}</span>
        <div className="min-w-0 flex-1">
          <span className="truncate text-xs font-bold text-[#fff7e8]">{extra.name}</span>
          <span className="ml-2 text-[0.65rem] font-bold text-white/35">{extra.priceAmount.toLocaleString("ar-EG")} {extra.currency}</span>
        </div>
        <span className={open ? "text-amber-300" : "text-white/25"}><Pencil className="size-3.5" /></span>
      </button>

      {open && (
        <div className="border-t border-white/6 p-3 pt-2.5 grid gap-2.5">
          <input type="hidden" name={`ext_${i}_id`} defaultValue={extra.id} />
          <F label="الاسم"><input name={`ext_${i}_name`} defaultValue={extra.name} className={inputClass} /></F>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <F label="السعر"><input name={`ext_${i}_price`} type="number" defaultValue={extra.priceAmount} className={inputClass} /></F>
            <F label="العملة"><input name={`ext_${i}_currency`} defaultValue={extra.currency} className={inputClass} /></F>
          </div>
          <F label="الوصف"><input name={`ext_${i}_description`} defaultValue={extra.description} className={inputClass} /></F>
        </div>
      )}
    </div>
  );
}

/* ───────── المعرض ───────── */
function GalleryEditor({ content }: { content: UnifiedContent }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <F label="عنوان القسم" className="flex-1"><input name="galleryTitle" defaultValue={content.galleryTitle} className={inputClass} /></F>
        <F label="الوصف" className="flex-[2]"><input name="galleryDescription" defaultValue={content.galleryDescription} className={inputClass} /></F>
      </div>

      <div className="grid gap-2">
        <p className="text-[0.65rem] font-bold text-white/35">{content.gallery.length} صور</p>
        {content.gallery.map((img, i) => (
          <GalleryRow key={img.id} img={img} index={i} />
        ))}
      </div>
    </div>
  );
}

function GalleryRow({ img, index: i }: { img: UnifiedContent["gallery"][number]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/8 bg-black/12">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start">
        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/[0.05] text-[0.6rem] font-bold text-white/35">{i + 1}</span>
        <div className="size-7 shrink-0 overflow-hidden rounded-lg bg-black/20">
          {img.url ? <img src={img.url} alt="" className="size-full object-cover" /> : <ImageIcon className="m-auto size-3 text-white/15" />}
        </div>
        <span className="truncate text-xs font-bold text-[#fff7e8]">{img.alt || img.caption || `صورة ${i + 1}`}</span>
        <span className={open ? "text-amber-300" : "text-white/25"}><Pencil className="size-3.5" /></span>
      </button>

      {open && (
        <div className="border-t border-white/6 p-3 pt-2.5 grid gap-2.5">
          <input type="hidden" name={`gal_${i}_id`} defaultValue={img.id} />
          <Img name={`gal_${i}_url`} defaultValue={img.url} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <F label="النص البديل"><input name={`gal_${i}_alt`} defaultValue={img.alt} className={inputClass} /></F>
            <F label="التسمية"><input name={`gal_${i}_caption`} defaultValue={img.caption} className={inputClass} /></F>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── التواصل ───────── */
function ContactEditor({ content }: { content: UnifiedContent }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      <F label="الهاتف"><input name="contactPhone" defaultValue={content.contactPhone ?? ""} className={inputClass} dir="ltr" /></F>
      <F label="واتساب"><input name="contactWhatsapp" defaultValue={content.contactWhatsapp ?? ""} className={inputClass} dir="ltr" /></F>
      <F label="البريد"><input name="contactEmail" type="email" defaultValue={content.contactEmail ?? ""} className={inputClass} dir="ltr" /></F>
      <F label="إنستغرام"><input name="contactInstagram" defaultValue={content.contactInstagram ?? ""} className={inputClass} dir="ltr" /></F>
      <F label="فيسبوك"><input name="contactFacebook" defaultValue={content.contactFacebook ?? ""} className={inputClass} dir="ltr" /></F>
      <F label="تيك توك"><input name="contactTiktok" defaultValue={content.contactTiktok ?? ""} className={inputClass} dir="ltr" /></F>
    </div>
  );
}

/* ───────── Helpers ───────── */
function Img({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
      <span className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white/30"><Upload className="size-3.5" /></span>
      <input name={name} defaultValue={defaultValue} className={inputClass} placeholder="https://..." dir="ltr" />
    </div>
  );
}

function F({ label, children, className = "", wide }: { label: string; children: ReactNode; className?: string; wide?: boolean }) {
  return <label className={`${wide ? "sm:col-span-2" : ""} grid gap-1 ${className}`}><span className="text-[0.65rem] font-bold text-white/40">{label}</span>{children}</label>;
}
