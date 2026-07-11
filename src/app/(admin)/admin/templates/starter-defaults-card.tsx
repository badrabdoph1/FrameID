"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Camera, Database, ImagePlus, Images, PackagePlus, Plus, Save, Search, Sparkles, Trash2 } from "lucide-react";

import { saveStarterDefaultsAction } from "@/app/(admin)/admin/templates/starter-defaults-actions";
import type { TemplateStarterSharedDefaults } from "@/modules/themes/template-starter-defaults";

type Item = Record<string, unknown>;

const inputClass = "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-4 focus:ring-amber-300/10";
const textareaClass = `${inputClass} min-h-24 py-3`;

function text(value: unknown, fallback = "") { return typeof value === "string" ? value : fallback; }
function num(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function recordArray(value: unknown): Item[] { return Array.isArray(value) ? value.filter((item): item is Item => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : []; }

export function StarterDefaultsCard({ defaults }: { defaults: TemplateStarterSharedDefaults }) {
  const [heroPreview, setHeroPreview] = useState(defaults.heroImageUrl ?? "");
  const [gallery, setGallery] = useState<Item[]>(() => recordArray(defaults.galleryImages));
  const [packages, setPackages] = useState<Item[]>(() => recordArray(defaults.packages));
  const [extras, setExtras] = useState<Item[]>(() => recordArray(defaults.extras));

  const galleryJson = useMemo(() => JSON.stringify(gallery), [gallery]);
  const packagesJson = useMemo(() => JSON.stringify(packages), [packages]);
  const extrasJson = useMemo(() => JSON.stringify(extras), [extras]);

  return (
    <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.055] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/12 text-[#f3cf73]"><Sparkles className="size-5" /></span><div><p className="text-xs font-black text-[#f3cf73]">Template Content Source</p><h2 className="mt-1 text-lg font-black text-[#fff7e8]">تعديل محتوى القالب الافتراضي</h2><p className="mt-1 max-w-3xl text-xs font-bold leading-6 text-white/45">رتبنا الحقول بنفس ترتيب ظهورها في الموقع. عدّل النص أو استبدل الصورة وشاهد الصورة الحالية أمامك؛ لا تحتاج لكتابة روابط أو JSON.</p></div></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1.5 text-[0.7rem] font-black text-emerald-300"><Database className="size-3.5" /> مصدر المحتوى الوحيد</span>
      </div>

      <form action={saveStarterDefaultsAction} className="mt-5 grid gap-4" encType="multipart/form-data">
        <input type="hidden" name="heroImageUrl" value={defaults.heroImageUrl ?? ""} />
        <input type="hidden" name="galleryImagesJson" value={galleryJson} />
        <input type="hidden" name="packagesJson" value={packagesJson} />
        <input type="hidden" name="extrasJson" value={extrasJson} />

        <EditorSection step="1" title="القسم الرئيسي — Hero" description="أول جزء يراه الزائر عند فتح القالب.">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="اسم المصور" hint="يظهر كالعنوان الرئيسي واسم الموقع."><input name="photographerName" required defaultValue={defaults.photographerName} className={inputClass} placeholder="مثال: كريم مجدي" /></Field>
              <Field label="اسم الاستوديو أو المجال" hint="يظهر في بيانات التواصل وتعريف النشاط."><input name="studioName" required defaultValue={defaults.studioName} className={inputClass} placeholder="مثال: Wedding Photography" /></Field>
              <Field label="الوصف الرئيسي" hint="النص الموجود أسفل اسم المصور في أول الصفحة." wide><textarea name="description" required rows={3} defaultValue={defaults.description} className={textareaClass} placeholder="اكتب وصفًا قصيرًا وواضحًا للخدمة" /></Field>
            </div>
            <ImageReplacement label="صورة الغلاف الرئيسية" hint="هذه هي الصورة الكبيرة في أول الموقع. ارفع صورة فقط لو تريد استبدال الحالية." currentUrl={heroPreview} inputName="heroImage" onPreview={setHeroPreview} />
          </div>
        </EditorSection>

        <EditorSection step="2" title="المعرض" description="قسم الصور الذي يأتي بعد الـHero مباشرة.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="عنوان المعرض" hint="العنوان الظاهر فوق صور الأعمال."><input name="galleryTitle" defaultValue={defaults.commonTexts?.galleryTitle ?? ""} className={inputClass} placeholder="أعمال مختارة" /></Field>
            <Field label="وصف المعرض" hint="جملة قصيرة تشرح نوع الصور المعروضة."><input name="galleryDescription" defaultValue={defaults.commonTexts?.galleryDescription ?? ""} className={inputClass} placeholder="لحظات حقيقية بعدسة احترافية" /></Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {gallery.map((item, index) => <GalleryCard key={text(item.id, String(index))} item={item} index={index} onChange={(next) => setGallery((items) => items.map((entry, i) => i === index ? next : entry))} onDelete={() => setGallery((items) => items.filter((_, i) => i !== index))} />)}
            <button type="button" onClick={() => setGallery((items) => [...items, { id: `gallery-${Date.now()}`, url: "", alt: "صورة من المعرض", caption: "", sortOrder: items.length, isFeatured: false }])} className="grid min-h-44 place-items-center rounded-3xl border border-dashed border-amber-300/25 bg-amber-300/[0.035] text-sm font-black text-[#f3cf73]"><span><Plus className="mx-auto mb-2 size-5" /> إضافة صورة للمعرض</span></button>
          </div>
        </EditorSection>

        <EditorSection step="3" title="الباقات" description="نفس فكرة تعديل الباقات في لوحة العميل: كل باقة كارت مستقل وواضح.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="عنوان قسم الباقات" hint="العنوان الذي يظهر فوق كروت الأسعار."><input name="packagesTitle" defaultValue={defaults.commonTexts?.packagesTitle ?? ""} className={inputClass} placeholder="الباقات" /></Field>
            <Field label="وصف قسم الباقات" hint="سطر تمهيدي قبل كروت الباقات."><input name="packagesDescription" defaultValue={defaults.commonTexts?.packagesDescription ?? ""} className={inputClass} placeholder="اختر الباقة المناسبة ليومك" /></Field>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {packages.map((item, index) => <PackageCard key={text(item.id, String(index))} item={item} index={index} onChange={(next) => setPackages((items) => items.map((entry, i) => i === index ? next : entry))} onDelete={() => setPackages((items) => items.filter((_, i) => i !== index))} />)}
          </div>
          <button type="button" onClick={() => setPackages((items) => [...items, { id: `package-${Date.now()}`, name: `باقة ${items.length + 1}`, subtitle: "", priceAmount: 0, currency: "EGP", features: ["ميزة جديدة"], imageUrl: "", isHighlighted: false, sortOrder: items.length }])} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300/30 bg-amber-300/[0.045] px-4 text-sm font-black text-[#f3cf73]"><PackagePlus className="size-4" /> إضافة باقة جديدة</button>
        </EditorSection>

        <EditorSection step="4" title="الخدمات الإضافية" description="الخدمات التي يمكن للعميل إضافتها بجانب الباقة الأساسية.">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="عنوان الخدمات الإضافية" hint="العنوان فوق قائمة الإضافات."><input name="extrasTitle" defaultValue={defaults.commonTexts?.extrasTitle ?? ""} className={inputClass} /></Field><Field label="وصف الخدمات الإضافية" hint="شرح قصير لما يمكن إضافته على الباقة."><input name="extrasDescription" defaultValue={defaults.commonTexts?.extrasDescription ?? ""} className={inputClass} /></Field></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{extras.map((item, index) => <ExtraCard key={text(item.id, String(index))} item={item} onChange={(next) => setExtras((items) => items.map((entry, i) => i === index ? next : entry))} onDelete={() => setExtras((items) => items.filter((_, i) => i !== index))} />)}</div>
          <button type="button" onClick={() => setExtras((items) => [...items, { id: `extra-${Date.now()}`, name: "خدمة إضافية", description: "", priceAmount: 0, currency: "EGP", iconKey: "camera", sortOrder: items.length }])} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 text-sm font-black text-white/65"><Plus className="size-4" /> إضافة خدمة</button>
        </EditorSection>

        <EditorSection step="5" title="التواصل" description="آخر قسم في القالب، حيث يطلب الزائر التواصل أو الحجز.">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="عنوان قسم التواصل" hint="العنوان الذي يشجع الزائر على بدء التواصل."><input name="contactTitle" defaultValue={defaults.commonTexts?.contactTitle ?? ""} className={inputClass} placeholder="جاهز لحجز جلستك؟" /></Field><Field label="نص زر التواصل" hint="الكلمة المكتوبة على زر الحجز أو التواصل."><input name="contactCallToAction" defaultValue={defaults.commonTexts?.contactCallToAction ?? ""} className={inputClass} placeholder="تواصل الآن" /></Field></div>
        </EditorSection>

        <EditorSection step="6" title="SEO" description="هذه البيانات تظهر لمحركات البحث ولا تظهر كقسم داخل الصفحة.">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="عنوان نتيجة البحث" hint="العنوان الذي يظهر في Google وعند مشاركة رابط القالب."><input name="seoTitle" defaultValue={defaults.seo?.title ?? ""} className={inputClass} /></Field><Field label="وصف نتيجة البحث" hint="الوصف المختصر أسفل العنوان في نتائج البحث."><input name="seoDescription" defaultValue={defaults.seo?.description ?? ""} className={inputClass} /></Field><Field label="الرابط الأساسي Canonical" hint="اتركه فارغًا ليستخدم النظام رابط الصفحة تلقائيًا."><input name="seoCanonicalUrl" defaultValue={defaults.seo?.canonicalUrl ?? ""} className={inputClass} dir="ltr" /></Field><label className="grid gap-1.5"><span className="text-xs font-black text-white/62">الظهور في محركات البحث</span><span className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-black text-white/65"><input type="checkbox" name="seoRobotsIndex" defaultChecked={defaults.seo?.robotsIndex ?? true} /> السماح لـGoogle بأرشفة صفحات القوالب</span></label></div>
        </EditorSection>

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-[#15130f]/95 p-3 shadow-2xl backdrop-blur-xl"><p className="flex items-center gap-2 text-xs font-bold text-white/50"><Search className="size-4" /> الحفظ يحدّث كل القوالب الحالية والجديدة من نفس المصدر.</p><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-5 text-sm font-black text-[#17120a]"><Save className="size-4" /> حفظ كل تعديلات القالب الافتراضي</button></div>
      </form>
    </section>
  );
}

function EditorSection({ step, title, description, children }: { step: string; title: string; description: string; children: ReactNode }) { return <section className="grid gap-4 rounded-3xl border border-white/8 bg-black/15 p-4"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-300 text-xs font-black text-[#17120a]">{step}</span><div><h3 className="text-base font-black text-[#fff7e8]">{title}</h3><p className="mt-1 text-xs font-bold leading-6 text-white/42">{description}</p></div></div>{children}</section>; }
function Field({ label, hint, children, wide = false }: { label: string; hint: string; children: ReactNode; wide?: boolean }) { return <label className={wide ? "grid gap-1.5 sm:col-span-2" : "grid gap-1.5"}><span className="text-xs font-black text-white/62">{label}</span><span className="text-[0.68rem] font-bold leading-5 text-white/34">{hint}</span>{children}</label>; }

function ImageReplacement({ label, hint, currentUrl, inputName, onPreview }: { label: string; hint: string; currentUrl: string; inputName: string; onPreview: (url: string) => void }) { return <div className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.025] p-3"><div><strong className="text-sm font-black text-white/75">{label}</strong><p className="mt-1 text-[0.68rem] font-bold leading-5 text-white/35">{hint}</p></div><div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-black/25">{currentUrl ? <img src={currentUrl} alt={label} className="size-full object-cover" /> : <div className="grid size-full place-items-center"><ImagePlus className="size-7 text-white/20" /></div>}</div><label className="cursor-pointer rounded-2xl border border-dashed border-amber-300/25 bg-amber-300/[0.035] p-3 text-center text-xs font-black text-[#f3cf73]"><ImagePlus className="me-1 inline size-4" /> استبدال الصورة من الجهاز<input type="file" name={inputName} accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onPreview(URL.createObjectURL(file)); }} /></label></div>; }

function GalleryCard({ item, index, onChange, onDelete }: { item: Item; index: number; onChange: (item: Item) => void; onDelete: () => void }) { const url = text(item.url); return <article className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.025] p-3"><div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black/25">{url ? <img src={url} alt="" className="size-full object-cover" /> : <Images className="m-auto size-7 text-white/20" />}<button type="button" onClick={onDelete} className="absolute end-2 top-2 grid size-8 place-items-center rounded-xl bg-black/70 text-red-200"><Trash2 className="size-3.5" /></button></div><label className="cursor-pointer rounded-xl border border-dashed border-white/15 px-3 py-2 text-center text-[0.68rem] font-black text-white/60">استبدال الصورة<input type="file" name={`galleryImage_${index}`} accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onChange({ ...item, url: URL.createObjectURL(file) }); }} /></label><input value={text(item.alt)} onChange={(event) => onChange({ ...item, alt: event.target.value })} className={inputClass} placeholder="وصف الصورة لسهولة الوصول" /><input value={text(item.caption)} onChange={(event) => onChange({ ...item, caption: event.target.value })} className={inputClass} placeholder="تعليق اختياري يظهر مع الصورة" /></article>; }

function PackageCard({ item, index, onChange, onDelete }: { item: Item; index: number; onChange: (item: Item) => void; onDelete: () => void }) { const features = Array.isArray(item.features) ? item.features.map(String).join("\n") : ""; const image = text(item.imageUrl); return <article className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-sm font-black text-[#f3cf73]"><PackagePlus className="size-4" /> {text(item.name, `باقة ${index + 1}`)}</span><button type="button" onClick={onDelete} className="grid size-8 place-items-center rounded-xl bg-red-500/10 text-red-200"><Trash2 className="size-3.5" /></button></div><div className="grid gap-3 sm:grid-cols-[140px_1fr]"><div className="grid gap-2"><div className="aspect-square overflow-hidden rounded-2xl bg-black/25">{image ? <img src={image} alt="" className="size-full object-cover" /> : <Camera className="m-auto size-6 text-white/20" />}</div><label className="cursor-pointer rounded-xl border border-dashed border-white/15 px-2 py-2 text-center text-[0.65rem] font-black text-white/60">استبدال الصورة<input type="file" name={`packageImage_${index}`} accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onChange({ ...item, imageUrl: URL.createObjectURL(file) }); }} /></label></div><div className="grid gap-2"><input value={text(item.name)} onChange={(e) => onChange({ ...item, name: e.target.value })} className={inputClass} placeholder="اسم الباقة" /><input value={text(item.subtitle)} onChange={(e) => onChange({ ...item, subtitle: e.target.value })} className={inputClass} placeholder="وصف قصير للباقة" /><div className="grid grid-cols-2 gap-2"><input type="number" value={num(item.priceAmount)} onChange={(e) => onChange({ ...item, priceAmount: Number(e.target.value) })} className={inputClass} placeholder="السعر" /><input value={text(item.currency, "EGP")} onChange={(e) => onChange({ ...item, currency: e.target.value.toUpperCase() })} className={inputClass} placeholder="العملة" /></div></div></div><textarea value={features} onChange={(e) => onChange({ ...item, features: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })} className={textareaClass} placeholder="اكتب كل ميزة في سطر مستقل" /><label className="flex items-center gap-2 text-xs font-black text-white/60"><input type="checkbox" checked={item.isHighlighted === true} onChange={(e) => onChange({ ...item, isHighlighted: e.target.checked })} /> اجعل هذه الباقة مميزة</label></article>; }

function ExtraCard({ item, onChange, onDelete }: { item: Item; onChange: (item: Item) => void; onDelete: () => void }) { return <article className="grid gap-2 rounded-3xl border border-white/10 bg-white/[0.025] p-3"><div className="flex justify-between"><Plus className="size-4 text-[#f3cf73]" /><button type="button" onClick={onDelete} className="text-red-200"><Trash2 className="size-4" /></button></div><input value={text(item.name)} onChange={(e) => onChange({ ...item, name: e.target.value })} className={inputClass} placeholder="اسم الخدمة" /><textarea value={text(item.description)} onChange={(e) => onChange({ ...item, description: e.target.value })} className={textareaClass} placeholder="ما الذي يحصل عليه العميل؟" /><div className="grid grid-cols-2 gap-2"><input type="number" value={num(item.priceAmount)} onChange={(e) => onChange({ ...item, priceAmount: Number(e.target.value) })} className={inputClass} placeholder="السعر" /><input value={text(item.currency, "EGP")} onChange={(e) => onChange({ ...item, currency: e.target.value.toUpperCase() })} className={inputClass} /></div></article>; }
