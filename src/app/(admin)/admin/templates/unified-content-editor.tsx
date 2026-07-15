"use client";

import { useState, type ReactNode } from "react";
import { Package, Plus, Save, Sparkles, Image, Phone } from "lucide-react";
import { saveUnifiedContentAction } from "@/app/(admin)/admin/templates/unified-content-actions";
import type { z } from "zod";
import type { UnifiedTemplateContentSchema } from "@/lib/content/schemas/templates";

type UnifiedContent = z.infer<typeof UnifiedTemplateContentSchema>;

const inputClass = "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-4 focus:ring-amber-300/10";

export function UnifiedContentEditor({ content }: { content: UnifiedContent }) {
  const [activeTab, setActiveTab] = useState<"packages" | "extras" | "gallery" | "contact">("packages");

  return (
    <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.055] p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/12 text-[#f3cf73]"><Sparkles className="size-5" /></span>
        <div>
          <p className="text-xs font-black text-[#f3cf73]">المحتوى الموحد</p>
          <h2 className="mt-1 text-lg font-black text-[#fff7e8]">تحرير محتوى جميع القوالب</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-6 text-white/45">هذا المحتوى مشترك بين جميع القوالب. أي تغيير هنا سيظهر في كل القوالب تلقائيًا.</p>
        </div>
      </div>

      <form action={saveUnifiedContentAction} className="mt-4 grid gap-4">
        <input type="hidden" name="photographerName" defaultValue={content.photographerName} />
        <input type="hidden" name="studioName" defaultValue={content.studioName} />
        <input type="hidden" name="description" defaultValue={content.description} />
        <input type="hidden" name="heroImageUrl" defaultValue={content.heroImageUrl} />
        <input type="hidden" name="heroEyebrow" defaultValue={content.heroEyebrow} />
        <input type="hidden" name="heroCtaLabel" defaultValue={content.heroCtaLabel} />

        <div className="flex flex-wrap gap-2 border-b border-white/8 pb-3">
          <TabButton active={activeTab === "packages"} onClick={() => setActiveTab("packages")} icon={Package} label="الباقات" />
          <TabButton active={activeTab === "extras"} onClick={() => setActiveTab("extras")} icon={Sparkles} label="الإضافات" />
          <TabButton active={activeTab === "gallery"} onClick={() => setActiveTab("gallery")} icon={Image} label="المعرض" />
          <TabButton active={activeTab === "contact"} onClick={() => setActiveTab("contact")} icon={Phone} label="التواصل" />
        </div>

        {activeTab === "packages" ? <PackagesEditor content={content} /> : null}
        {activeTab === "extras" ? <ExtrasEditor content={content} /> : null}
        {activeTab === "gallery" ? <GalleryEditor content={content} /> : null}
        {activeTab === "contact" ? <ContactEditor content={content} /> : null}

        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5">
          <Save className="size-4" /> حفظ المحتوى الموحد
        </button>
      </form>
    </section>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Package; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active
        ? "inline-flex min-h-10 items-center gap-2 rounded-2xl border border-amber-300/40 bg-amber-300/15 px-4 text-xs font-black text-[#f3cf73]"
        : "inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black text-white/60 transition hover:bg-white/[0.08]"
      }
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}

function PackagesEditor({ content }: { content: UnifiedContent }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="عنوان قسم الباقات">
          <input name="packagesTitle" defaultValue={content.packagesTitle} className={inputClass} />
        </Field>
        <Field label="وصف قسم الباقات">
          <input name="packagesDescription" defaultValue={content.packagesDescription} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-3">
        <p className="text-xs font-black text-white/55">الباقات ({content.packages.length})</p>
        {content.packages.map((pkg, index) => (
          <PackageCard key={pkg.id} pkg={pkg} index={index} />
        ))}
      </div>
    </div>
  );
}

function PackageCard({ pkg, index }: { pkg: UnifiedContent["packages"][number]; index: number }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/16 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black text-[#f3cf73]">باقة {index + 1}: {pkg.name}</p>
        <input type="hidden" name={`package_${index}_id`} defaultValue={pkg.id} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="الاسم"><input name={`package_${index}_name`} defaultValue={pkg.name} className={inputClass} /></Field>
        <Field label="الوصف القصير"><input name={`package_${index}_subtitle`} defaultValue={pkg.subtitle} className={inputClass} /></Field>
        <Field label="السعر"><input name={`package_${index}_price`} type="number" defaultValue={pkg.priceAmount} className={inputClass} /></Field>
        <Field label="العملة"><input name={`package_${index}_currency`} defaultValue={pkg.currency} className={inputClass} /></Field>
      </div>
      <Field label="المميزات (سطر لكل ميزة)">
        <textarea name={`package_${index}_features`} defaultValue={pkg.features.join("\n")} rows={4} className={`${inputClass} min-h-24 py-3`} />
      </Field>
      <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65">
        <input type="checkbox" name={`package_${index}_highlighted`} defaultChecked={pkg.isHighlighted} className="size-4 accent-[#f3cf73]" /> شارة &quot;الأكثر طلباً&quot;
      </label>
    </div>
  );
}

function ExtrasEditor({ content }: { content: UnifiedContent }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="عنوان قسم الإضافات"><input name="extrasTitle" defaultValue={content.extrasTitle} className={inputClass} /></Field>
        <Field label="وصف قسم الإضافات"><input name="extrasDescription" defaultValue={content.extrasDescription} className={inputClass} /></Field>
      </div>
      <div className="grid gap-3">
        <p className="text-xs font-black text-white/55">الإضافات ({content.extras.length})</p>
        {content.extras.map((extra, index) => (
          <div key={extra.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/16 p-3">
            <p className="text-xs font-black text-[#f3cf73]">إضافة {index + 1}: {extra.name}</p>
            <input type="hidden" name={`extra_${index}_id`} defaultValue={extra.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الاسم"><input name={`extra_${index}_name`} defaultValue={extra.name} className={inputClass} /></Field>
              <Field label="الوصف"><input name={`extra_${index}_description`} defaultValue={extra.description} className={inputClass} /></Field>
              <Field label="السعر"><input name={`extra_${index}_price`} type="number" defaultValue={extra.priceAmount} className={inputClass} /></Field>
              <Field label="العملة"><input name={`extra_${index}_currency`} defaultValue={extra.currency} className={inputClass} /></Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryEditor({ content }: { content: UnifiedContent }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="عنوان المعرض"><input name="galleryTitle" defaultValue={content.galleryTitle} className={inputClass} /></Field>
        <Field label="وصف المعرض"><input name="galleryDescription" defaultValue={content.galleryDescription} className={inputClass} /></Field>
      </div>
      <div className="grid gap-3">
        <p className="text-xs font-black text-white/55">الصور ({content.gallery.length})</p>
        {content.gallery.map((image, index) => (
          <div key={image.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/16 p-3">
            <p className="text-xs font-black text-[#f3cf73]">صورة {index + 1}</p>
            <input type="hidden" name={`gallery_${index}_id`} defaultValue={image.id} />
            <Field label="رابط الصورة"><input name={`gallery_${index}_url`} defaultValue={image.url} className={inputClass} dir="ltr" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="النص البديل"><input name={`gallery_${index}_alt`} defaultValue={image.alt} className={inputClass} /></Field>
              <Field label="التسمية"><input name={`gallery_${index}_caption`} defaultValue={image.caption} className={inputClass} /></Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactEditor({ content }: { content: UnifiedContent }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="اسم المصور"><input name="photographerName" defaultValue={content.photographerName} className={inputClass} /></Field>
      <Field label="اسم الاستوديو"><input name="studioName" defaultValue={content.studioName} className={inputClass} /></Field>
      <Field label="الهاتف"><input name="contactPhone" defaultValue={content.contactPhone} className={inputClass} dir="ltr" /></Field>
      <Field label="واتساب"><input name="contactWhatsapp" defaultValue={content.contactWhatsapp} className={inputClass} dir="ltr" /></Field>
      <Field label="البريد الإلكتروني"><input name="contactEmail" type="email" defaultValue={content.contactEmail} className={inputClass} dir="ltr" /></Field>
      <Field label="إنستغرام"><input name="contactInstagram" defaultValue={content.contactInstagram} className={inputClass} dir="ltr" /></Field>
      <Field label="فيسبوك"><input name="contactFacebook" defaultValue={content.contactFacebook} className={inputClass} dir="ltr" /></Field>
      <Field label="تيك توك"><input name="contactTiktok" defaultValue={content.contactTiktok} className={inputClass} dir="ltr" /></Field>
      <Field label="مكان العمل" wide><input name="workLocation" defaultValue={content.workLocation} className={inputClass} /></Field>
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? "grid gap-1.5 sm:col-span-2" : "grid gap-1.5"}><span className="text-xs font-black text-white/55">{label}</span>{children}</label>;
}
