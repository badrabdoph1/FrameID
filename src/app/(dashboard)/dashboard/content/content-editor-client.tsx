"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { CheckCircle2, Eye, EyeOff, ImagePlus, Loader2, Save, SlidersHorizontal } from "lucide-react";

import {
  updateSectionAction,
  uploadHeroImageAction,
  type AutosaveState,
} from "@/app/(dashboard)/dashboard/content/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EditorSection } from "@/modules/content/site-content-service";

const sectionLabels: Record<EditorSection["type"], string> = {
  hero: "Hero / الواجهة",
  gallery: "معرض الأعمال",
  packages: "الباقات",
  extras: "الإضافات",
  contact: "التواصل",
};

export function ContentEditorClient({
  sections,
  coverUrl,
}: {
  sections: EditorSection[];
  coverUrl: string | null;
}) {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-3 pb-4">
      <header className="rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.1),transparent_42%),rgba(255,255,255,0.035)] p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]">
            <SlidersHorizontal className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">متحكم القالب الموحّد</p>
            <h1 className="mt-1 text-xl font-black text-[#fff7e8] sm:text-2xl">محتوى وترتيب موقعك</h1>
            <p className="mt-1 text-sm font-bold leading-7 text-white/55">كل قسم مستقل: غيّر ظهوره وترتيبه وإعداداته، وسيطبّق أي قالب نفس البيانات بطريقته.</p>
          </div>
        </div>
      </header>

      {sections.map((section) => (
        <SectionEditor key={section.type} section={section} coverUrl={coverUrl} />
      ))}
    </main>
  );
}

function SectionEditor({ section, coverUrl }: { section: EditorSection; coverUrl: string | null }) {
  const [state, setState] = useState<AutosaveState | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => setState(await updateSectionAction(data)));
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
      <input type="hidden" name="type" value={section.type} />
      <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#f3cf73]">{section.type}</p>
          <h2 className="mt-1 text-base font-black text-[#fff7e8]">{sectionLabels[section.type]}</h2>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/70">
          <input className="peer sr-only" type="checkbox" name="isVisible" defaultChecked={section.isVisible} />
          <span className="peer-checked:hidden"><EyeOff className="size-4" aria-hidden /></span>
          <span className="hidden peer-checked:inline"><Eye className="size-4" aria-hidden /></span>
          <span>إظهار القسم</span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <Field label="عنوان القسم"><Input name="title" defaultValue={section.title} /></Field>
        <Field label="الترتيب"><Input name="sortOrder" type="number" min={0} defaultValue={section.sortOrder} inputMode="numeric" /></Field>
      </div>

      {section.type === "hero" ? <HeroFields data={section.data} coverUrl={coverUrl} /> : null}
      {section.type !== "hero" ? <CommonFields section={section} /> : null}
      {section.type === "contact" ? (
        <Field label="نص دعوة التواصل"><Input name="callToAction" defaultValue={readString(section.data.callToAction, "احجز جلستك الآن")} /></Field>
      ) : null}

      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
        <p aria-live="polite" className="inline-flex items-center gap-2 text-xs font-black text-white/45">
          {pending ? <Loader2 className="size-4 animate-spin text-[#f3cf73]" aria-hidden /> : state?.ok ? <CheckCircle2 className="size-4 text-emerald-300" aria-hidden /> : <Save className="size-4" aria-hidden />}
          {pending ? "جاري الحفظ..." : state?.message ?? "التغييرات تُحفظ لهذا القسم فقط"}
        </p>
        <Button className="min-h-11 w-full sm:w-auto" type="submit" disabled={pending}>حفظ القسم</Button>
      </div>
    </form>
  );
}

function CommonFields({ section }: { section: EditorSection }) {
  const settings = readRecord(section.data.settings);
  const layouts = section.type === "gallery"
    ? [["snap", "سحب أفقي"], ["grid", "شبكة"]]
    : section.type === "packages"
      ? [["snap", "سحب أفقي"], ["stack", "قائمة"]]
      : section.type === "extras"
        ? [["compact", "مدمج"], ["cards", "بطاقات"]]
        : [["grid", "شبكة أزرار"], ["stack", "قائمة أزرار"]];
  return (
    <>
      <Field label="وصف القسم"><Textarea name="description" rows={3} defaultValue={readString(section.data.description, "")} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="النص التمهيدي"><Input name="eyebrow" defaultValue={readString(settings.eyebrow, "")} /></Field>
        <Field label="طريقة العرض">
          <select name="layout" defaultValue={readString(settings.layout, layouts[0][0])} className={selectClassName}>
            {layouts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
      </div>
      {section.type === "gallery" ? <Field label="عدد الصور"><Input name="limit" type="number" min={3} max={9} defaultValue={readNumber(settings.limit, 6)} /></Field> : null}
    </>
  );
}

function HeroFields({ data, coverUrl }: { data: Record<string, unknown>; coverUrl: string | null }) {
  const settings = readRecord(data.settings);
  const cta = readRecord(data.cta);
  const initialImageUrl = readString(data.imageUrl, "");
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [preview, setPreview] = useState(coverUrl ?? initialImageUrl);
  const [uploading, startUpload] = useTransition();

  async function upload(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.set("image", file);
    startUpload(async () => {
      const result = await uploadHeroImageAction(formData);
      if (result.ok && result.assetId) {
        const assetUrl = `/api/media/${result.assetId}`;
        setImageUrl(assetUrl);
        setPreview(assetUrl);
      }
    });
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="العنوان الرئيسي"><Input name="headline" defaultValue={readString(data.headline, "")} /></Field>
        <Field label="النص التمهيدي"><Input name="eyebrow" defaultValue={readString(settings.eyebrow, "")} /></Field>
      </div>
      <Field label="الوصف"><Textarea name="subheadline" rows={3} defaultValue={readString(data.subheadline, "")} /></Field>
      <input type="hidden" name="description" value={readString(data.description, "")} />
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        {preview ? <div className="relative aspect-[16/9]"><Image src={preview} alt="معاينة صورة الـ Hero" fill unoptimized className="object-cover" /></div> : <div className="grid aspect-[16/9] place-items-center text-sm font-bold text-white/35">لا توجد صورة Hero</div>}
        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 border-t border-white/10 px-4 text-sm font-black text-[#f3cf73]">
          {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {uploading ? "جاري رفع الصورة..." : "اختيار صورة Hero"}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => upload(event.target.files?.[0])} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField label="قوة الـ Overlay" name="overlay" value={readString(data.overlay, "medium")} options={[["none", "بدون"], ["soft", "خفيف"], ["medium", "متوسط"], ["strong", "قوي"]]} />
        <SelectField label="موضع الصورة" name="position" value={readString(data.position, "center")} options={[["center", "المنتصف"], ["top", "أعلى"], ["bottom", "أسفل"], ["left", "يسار"], ["right", "يمين"]]} />
        <SelectField label="ارتفاع الـ Hero" name="height" value={readString(data.height, "screen")} options={[["compact", "مدمج"], ["screen", "بطول الشاشة"], ["tall", "طويل"]]} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="نص زر الـ CTA"><Input name="ctaLabel" defaultValue={readString(cta.label, "شاهد الباقات")} /></Field>
        <SelectField label="وجهة زر الـ CTA" name="ctaTarget" value={readString(cta.target, "packages")} options={[["packages", "الباقات"], ["gallery", "المعرض"], ["contact", "التواصل"], ["whatsapp", "واتساب"]]} />
      </div>
    </>
  );
}

function SelectField({ label, name, value, options }: { label: string; name: string; value: string; options: string[][] }) {
  return <Field label={label}><select aria-label={label} name={name} defaultValue={value} className={selectClassName}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></Field>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black text-white/55">{label}</span>{children}</label>;
}

const selectClassName = "min-h-11 w-full rounded-xl border border-white/10 bg-[#171717] px-3 text-sm font-bold text-white outline-none focus:border-[#f3cf73]";

function readString(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value : fallback; }
function readNumber(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function readRecord(value: unknown): Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
