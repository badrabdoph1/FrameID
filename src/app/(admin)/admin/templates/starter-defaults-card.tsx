import { Database, ImageIcon, Save, Search, Sparkles } from "lucide-react";

import { saveStarterDefaultsAction } from "@/app/(admin)/admin/templates/starter-defaults-actions";
import type { TemplateStarterSharedDefaults } from "@/modules/themes/template-starter-defaults";

const inputClass = "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-4 focus:ring-amber-300/10";
const textareaClass = `${inputClass} min-h-28 py-3 font-mono text-xs leading-6`;

export function StarterDefaultsCard({ defaults }: { defaults: TemplateStarterSharedDefaults }) {
  return (
    <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.055] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/12 text-[#f3cf73]"><Sparkles className="size-5" /></span>
          <div>
            <p className="text-xs font-black text-[#f3cf73]">Template Content Source</p>
            <h2 className="mt-1 text-lg font-black text-[#fff7e8]">Starter Content Defaults</h2>
            <p className="mt-1 max-w-3xl text-xs font-bold leading-6 text-white/45">المصدر الوحيد لكل المحتوى المشترك. أي قالب حالي أو جديد يرث هذه البيانات تلقائيًا، ولا يخزن نسخة منها داخله.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1.5 text-[0.7rem] font-black text-emerald-300"><Database className="size-3.5" /> Single Source of Truth</span>
      </div>

      <form action={saveStarterDefaultsAction} className="mt-5 grid gap-4">
        <Section title="الهوية والمحتوى الأساسي" description="البيانات التي تظهر في كل القوالب ما لم يوجد Override صريح.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسم المصور الافتراضي"><input name="photographerName" required defaultValue={defaults.photographerName} className={inputClass} /></Field>
            <Field label="اسم الاستوديو أو المجال"><input name="studioName" required defaultValue={defaults.studioName} className={inputClass} /></Field>
            <Field label="الوصف المشترك" wide><textarea name="description" required rows={3} defaultValue={defaults.description} className={`${inputClass} min-h-24 py-3`} /></Field>
            <Field label="صورة Hero المشتركة" wide><div className="grid grid-cols-[auto_1fr] items-center gap-2"><span className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/35"><ImageIcon className="size-4" /></span><input name="heroImageUrl" defaultValue={defaults.heroImageUrl ?? ""} className={inputClass} placeholder="https://..." /></div></Field>
          </div>
        </Section>

        <Section title="النصوص المشتركة للأقسام" description="العناوين والوصف والـCTA التي تتكرر في جميع القوالب.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="عنوان المعرض"><input name="galleryTitle" defaultValue={defaults.commonTexts?.galleryTitle ?? ""} className={inputClass} /></Field>
            <Field label="وصف المعرض"><input name="galleryDescription" defaultValue={defaults.commonTexts?.galleryDescription ?? ""} className={inputClass} /></Field>
            <Field label="عنوان الباقات"><input name="packagesTitle" defaultValue={defaults.commonTexts?.packagesTitle ?? ""} className={inputClass} /></Field>
            <Field label="وصف الباقات"><input name="packagesDescription" defaultValue={defaults.commonTexts?.packagesDescription ?? ""} className={inputClass} /></Field>
            <Field label="عنوان الخدمات الإضافية"><input name="extrasTitle" defaultValue={defaults.commonTexts?.extrasTitle ?? ""} className={inputClass} /></Field>
            <Field label="وصف الخدمات الإضافية"><input name="extrasDescription" defaultValue={defaults.commonTexts?.extrasDescription ?? ""} className={inputClass} /></Field>
            <Field label="عنوان التواصل"><input name="contactTitle" defaultValue={defaults.commonTexts?.contactTitle ?? ""} className={inputClass} /></Field>
            <Field label="نص زر التواصل"><input name="contactCallToAction" defaultValue={defaults.commonTexts?.contactCallToAction ?? ""} className={inputClass} /></Field>
          </div>
        </Section>

        <Section title="المعرض والباقات والخدمات" description="يتم حفظ هذه القوائم مرة واحدة فقط. استخدم JSON منظمًا للحفاظ على نفس العقد المستخدم حاليًا بدون إنشاء Source جديد.">
          <div className="grid gap-3 xl:grid-cols-3">
            <Field label="صور المعرض JSON"><textarea name="galleryImagesJson" defaultValue={formatJson(defaults.galleryImages)} className={textareaClass} /></Field>
            <Field label="الباقات الافتراضية JSON"><textarea name="packagesJson" defaultValue={formatJson(defaults.packages)} className={textareaClass} /></Field>
            <Field label="الخدمات الإضافية JSON"><textarea name="extrasJson" defaultValue={formatJson(defaults.extras)} className={textareaClass} /></Field>
          </div>
        </Section>

        <Section title="SEO المشترك" description="بيانات SEO التي ترثها جميع القوالب ما لم يتم تخصيصها خارج نطاق القالب.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="SEO Title"><input name="seoTitle" defaultValue={defaults.seo?.title ?? ""} className={inputClass} /></Field>
            <Field label="SEO Description"><input name="seoDescription" defaultValue={defaults.seo?.description ?? ""} className={inputClass} /></Field>
            <Field label="Canonical URL"><input name="seoCanonicalUrl" defaultValue={defaults.seo?.canonicalUrl ?? ""} className={inputClass} dir="ltr" /></Field>
            <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-black text-white/65"><input type="checkbox" name="seoRobotsIndex" defaultChecked={defaults.seo?.robotsIndex ?? true} /> السماح بالأرشفة</label>
          </div>
        </Section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
          <p className="flex items-center gap-2 text-xs font-bold text-white/42"><Search className="size-4" /> عند الحفظ سيتم تنظيف أي نسخ مكررة قديمة من القوالب الحالية تلقائيًا.</p>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-5 text-sm font-black text-[#17120a] shadow-lg"><Save className="size-4" /> حفظ المصدر المشترك</button>
        </div>
      </form>
    </section>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="grid gap-3 rounded-3xl border border-white/8 bg-black/15 p-4"><div><h3 className="text-sm font-black text-[#fff7e8]">{title}</h3><p className="mt-1 text-xs font-bold leading-6 text-white/40">{description}</p></div>{children}</section>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? "grid gap-1.5 sm:col-span-2" : "grid gap-1.5"}><span className="text-xs font-black text-white/55">{label}</span>{children}</label>;
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}
