"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  Copy,
  Eye,
  ImageIcon,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
} from "lucide-react";

import { saveTemplateAction, toggleTemplateAction } from "@/app/(admin)/admin/templates/actions";
import {
  archiveTemplateAction,
  createTemplateAction,
  duplicateTemplateAction,
  restoreTemplateDefaultsAction,
} from "@/app/(admin)/admin/templates/management-actions";
import { TemplateImageCenter } from "@/app/(admin)/admin/templates/template-image-center";
import { cn } from "@/lib/utils/cn";

export type AdminTemplateItem = {
  id: string;
  name: string;
  code: string;
  status: string;
  showroomOrder: number;
  previewData: unknown;
  settings: unknown;
  theme: { id: string; name: string; code: string; category: string; status: string };
};

export type AdminTemplateThemeOption = { id: string; name: string; code: string; status: string };
type TemplateManagerProps = { templates: AdminTemplateItem[]; themes: AdminTemplateThemeOption[]; message?: { tone: "success" | "danger"; text: string } | null };
type JsonRecord = Record<string, unknown>;

const inputClass = "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-4 focus:ring-amber-300/10";
const textareaClass = `${inputClass} py-3`;

function isRecord(value: unknown): value is JsonRecord { return typeof value === "object" && value !== null && !Array.isArray(value); }
function stringFrom(value: unknown, fallback = "") { return typeof value === "string" ? value : value == null ? fallback : String(value); }
function pickText(value: unknown, keys: string[], fallback = "") { if (!isRecord(value)) return fallback; for (const key of keys) { const item = value[key]; if (typeof item === "string" && item.trim()) return item.trim(); } return fallback; }
function pickImage(value: unknown) { if (!isRecord(value)) return ""; const direct = value.previewImage ?? value.image ?? value.cover ?? value.thumbnail; return typeof direct === "string" ? direct : ""; }
function starterOverrideFrom(value: unknown): JsonRecord { return isRecord(value) && isRecord(value.starterContentOverride) ? value.starterContentOverride : {}; }
function statusLabel(status: string) { if (status === "PUBLISHED") return "منشور"; if (status === "ARCHIVED") return "مؤرشف"; return "مسودة"; }
function settingsFrom(value: unknown): JsonRecord { return isRecord(value) ? value : {}; }

export function TemplateManager({ templates, themes, message }: TemplateManagerProps) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const selected = useMemo(() => templates.find((template) => template.id === selectedId) ?? templates[0] ?? null, [selectedId, templates]);

  return (
    <div className="grid gap-4">
      {message ? <div className={message.tone === "danger" ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300" : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"}>{message.text}</div> : null}

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-[#f3cf73]">2. قائمة القوالب</p>
            <h2 className="mt-1 text-lg font-black text-[#fff7e8]">إدارة القالب نفسه</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/42">هذه المنطقة لا تعدل المحتوى المشترك. كل قالب يرث Starter Content Defaults ويحتفظ فقط بإعداداته والـOverrides الحقيقية.</p>
          </div>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a]"><Plus className="size-4" /> قالب جديد</button>
        </div>
      </section>

      {showCreate ? (
        <form action={createTemplateAction} className="grid gap-3 rounded-3xl border border-amber-300/20 bg-amber-300/[0.055] p-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><p className="text-xs font-black text-[#f3cf73]">قالب جديد</p><h2 className="mt-1 text-lg font-black text-[#fff7e8]">بيانات القالب فقط</h2><p className="mt-1 text-xs font-bold text-white/42">المحتوى والمعرض والباقات وSEO ستُورث تلقائيًا من Template Content Source.</p></div>
          <Field label="اسم القالب"><input name="name" required className={inputClass} /></Field>
          <Field label="Template Code"><input name="code" className={inputClass} dir="ltr" /></Field>
          <Field label="Theme"><select name="themeId" required className={inputClass} defaultValue=""><option value="" disabled>اختر الثيم</option>{themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name} — {theme.code}</option>)}</select></Field>
          <div className="flex items-end"><button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a]"><Plus className="size-4" /> إنشاء كمسودة</button></div>
        </form>
      ) : null}

      {templates.length === 0 ? (
        <section className="grid place-items-center rounded-3xl border border-dashed border-white/12 bg-white/[0.025] px-6 py-16 text-center"><LayoutTemplate className="size-12 text-white/20" /><h2 className="mt-3 text-lg font-black text-white/75">لا توجد قوالب بعد</h2></section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="grid content-start gap-2 rounded-3xl border border-white/10 bg-white/[0.035] p-3 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
            {templates.map((template) => {
              const active = selected?.id === template.id;
              const image = pickImage(template.previewData);
              const hasOverride = Object.keys(starterOverrideFrom(template.previewData)).length > 0;
              return <button key={template.id} type="button" onClick={() => { setSelectedId(template.id); setShowCreate(false); }} className={cn("grid grid-cols-[64px_1fr] items-center gap-3 rounded-2xl border p-2.5 text-start transition", active ? "border-amber-300/35 bg-amber-300/10" : "border-white/8 bg-black/15 hover:border-white/16 hover:bg-white/[0.04]")}><span className="relative grid aspect-square overflow-hidden rounded-xl bg-black/30">{image ? <img src={image} alt="" className="size-full object-cover" /> : <ImageIcon className="m-auto size-5 text-white/25" />}</span><span className="min-w-0"><strong className="block truncate text-sm font-black text-[#fff7e8]">{template.name}</strong><small className="mt-1 block truncate font-mono text-[0.68rem] font-bold text-white/35">{template.code}</small><span className="mt-1 flex flex-wrap gap-1"><small className={template.status === "PUBLISHED" ? "text-[0.68rem] font-black text-emerald-300" : "text-[0.68rem] font-black text-white/42"}>{statusLabel(template.status)}</small>{hasOverride ? <small className="rounded-full bg-violet-400/10 px-1.5 text-[0.62rem] font-black text-violet-300">Override</small> : null}</span></span></button>;
            })}
          </aside>
          {selected ? <div className="grid min-w-0 gap-4"><TemplateEditor key={selected.id} template={selected} themes={themes} /><TemplateImageCenter template={selected} /></div> : null}
        </section>
      )}
    </div>
  );
}

function TemplateEditor({ template, themes }: { template: AdminTemplateItem; themes: AdminTemplateThemeOption[] }) {
  const previewTitle = pickText(template.previewData, ["title", "headline", "name"], template.name);
  const previewDescription = pickText(template.previewData, ["description", "subtitle", "tagline"], template.theme.category);
  const previewImage = pickImage(template.previewData);
  const starterOverride = starterOverrideFrom(template.previewData);
  const settings = settingsFrom(template.settings);

  return (
    <article className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 pb-4">
        <div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-amber-300/12 px-2.5 py-1 text-[0.68rem] font-black text-[#f3cf73]"><Sparkles className="size-3" /> {template.theme.name}</span><span className="rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-black text-white/45">{statusLabel(template.status)}</span></div><h2 className="mt-2 text-xl font-black text-[#fff7e8]">{template.name}</h2><p className="mt-1 font-mono text-xs font-bold text-white/35">{template.code}</p></div>
        <a href={`/templates/${template.code}/preview`} target="_blank" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/70 no-underline"><Eye className="size-4" /> معاينة</a>
      </header>

      <form action={saveTemplateAction} className="mt-4 grid gap-4">
        <input type="hidden" name="id" value={template.id} />
        <EditorSection icon={Settings2} title="إعدادات القالب" description="هوية القالب التقنية وحالته وترتيبه فقط."><div className="grid gap-3 sm:grid-cols-2"><Field label="اسم القالب"><input name="name" defaultValue={template.name} className={inputClass} /></Field><Field label="Template Code"><input name="code" defaultValue={template.code} className={inputClass} dir="ltr" /></Field><Field label="Version"><input name="version" defaultValue={stringFrom(settings.version, "1.0.0")} className={inputClass} dir="ltr" /></Field><Field label="Theme"><select name="themeId" defaultValue={template.theme.id} className={inputClass}>{themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name} — {theme.code}</option>)}</select></Field><Field label="حالة النشر"><select name="status" defaultValue={template.status} className={inputClass}><option value="PUBLISHED">منشور</option><option value="DRAFT">مسودة</option><option value="ARCHIVED">مؤرشف</option></select></Field><Field label="ترتيب الظهور"><input name="showroomOrder" type="number" defaultValue={template.showroomOrder} className={inputClass} /></Field></div></EditorSection>

        <EditorSection icon={ImageIcon} title="بطاقة ومعاينة القالب" description="هذه بيانات عرض القالب في الكتالوج وليست محتوى الموقع الموروث."><div className="grid gap-3 sm:grid-cols-2"><Field label="عنوان البطاقة"><input name="previewTitle" defaultValue={previewTitle} className={inputClass} /></Field><Field label="وصف البطاقة"><input name="previewDescription" defaultValue={previewDescription} className={inputClass} /></Field><Field label="صورة المعاينة"><input name="previewImage" defaultValue={previewImage} className={inputClass} /></Field><Field label="نص زر المعاينة"><input name="callToAction" defaultValue={pickText(template.previewData, ["callToAction"], "معاينة القالب")} className={inputClass} /></Field></div></EditorSection>

        <EditorSection icon={Sparkles} title="Override اختياري" description="اترك كل الحقول فارغة للوراثة الكاملة. لا يوجد هنا معرض أو باقات أو SEO لأنها تُدار من المصدر المشترك فقط."><div className="grid gap-3 sm:grid-cols-2"><Field label="اسم مصور مختلف"><input name="starterOverridePhotographerName" defaultValue={stringFrom(starterOverride.photographerName)} className={inputClass} /></Field><Field label="اسم استوديو مختلف"><input name="starterOverrideStudioName" defaultValue={stringFrom(starterOverride.studioName)} className={inputClass} /></Field><Field label="وصف مختلف"><textarea name="starterOverrideDescription" rows={3} defaultValue={stringFrom(starterOverride.description)} className={`${textareaClass} min-h-24`} /></Field><Field label="Hero مختلفة"><input name="starterOverrideHeroImageUrl" defaultValue={stringFrom(starterOverride.heroImageUrl)} className={inputClass} /></Field></div></EditorSection>

        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a]"><Save className="size-4" /> حفظ إعدادات القالب</button>
      </form>

      <section className="mt-4 grid gap-2 border-t border-white/8 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <form action={toggleTemplateAction}><input type="hidden" name="id" value={template.id} /><ActionButton>{template.status === "PUBLISHED" ? "إيقاف النشر" : "نشر القالب"}</ActionButton></form>
        <form action={duplicateTemplateAction}><input type="hidden" name="id" value={template.id} /><ActionButton><Copy className="size-3.5" /> Duplicate</ActionButton></form>
        <form action={restoreTemplateDefaultsAction} onSubmit={(event) => { if (!window.confirm("سيتم حذف Overrides وإعادة إعدادات القالب، مع استمرار وراثة المحتوى المشترك. هل أنت متأكد؟")) event.preventDefault(); }}><input type="hidden" name="id" value={template.id} /><ActionButton><RotateCcw className="size-3.5" /> مسح Overrides</ActionButton></form>
        <form action={archiveTemplateAction} onSubmit={(event) => { if (!window.confirm("أرشفة القالب؟")) event.preventDefault(); }}><input type="hidden" name="id" value={template.id} /><button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-red-300/15 bg-red-500/8 px-3 text-xs font-black text-red-200"><Archive className="size-3.5" /> Archive</button></form>
      </section>
    </article>
  );
}

function EditorSection({ icon: Icon, title, description, children }: { icon: typeof Settings2; title: string; description: string; children: ReactNode }) { return <section className="grid gap-3 rounded-3xl border border-white/10 bg-black/16 p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-[#f3cf73]"><Icon className="size-4" /></span><span><h3 className="text-sm font-black text-[#fff7e8]">{title}</h3><p className="mt-1 text-xs font-bold leading-6 text-white/42">{description}</p></span></div>{children}</section>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1.5"><span className="text-xs font-black text-white/55">{label}</span>{children}</label>; }
function ActionButton({ children }: { children: ReactNode }) { return <button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/65">{children}</button>; }
