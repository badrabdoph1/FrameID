"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  Copy,
  Eye,
  ImageIcon,
  LayoutTemplate,
  PackagePlus,
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
  theme: {
    id: string;
    name: string;
    code: string;
    category: string;
    status: string;
  };
};

export type AdminTemplateThemeOption = {
  id: string;
  name: string;
  code: string;
  status: string;
};

type TemplateManagerProps = {
  templates: AdminTemplateItem[];
  themes: AdminTemplateThemeOption[];
  message?: { tone: "success" | "danger"; text: string } | null;
};

type JsonRecord = Record<string, unknown>;

type PackageDraft = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceAmount: number;
  currency: string;
  imageUrl: string;
  features: string[];
  isHighlighted: boolean;
  enabled: boolean;
};

type ExtraDraft = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  iconKey: string;
  enabled: boolean;
};

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-4 focus:ring-amber-300/10";
const textareaClass = `${inputClass} py-3`;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFrom(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function numberFrom(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number.parseInt(stringFrom(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolFrom(value: unknown, fallback = false) {
  if (value === true || value === "true" || value === "on") return true;
  if (value === false || value === "false" || value === "off") return false;
  return fallback;
}

function pickText(value: unknown, keys: string[], fallback = "") {
  if (!isRecord(value)) return fallback;
  for (const key of keys) {
    const item = value[key];
    if (typeof item === "string" && item.trim()) return item.trim();
  }
  return fallback;
}

function pickImage(value: unknown) {
  if (!isRecord(value)) return "";
  const direct = value.previewImage ?? value.image ?? value.cover ?? value.thumbnail;
  return typeof direct === "string" ? direct : "";
}

function heroFrom(value: unknown): JsonRecord {
  return isRecord(value) && isRecord(value.hero) ? value.hero : {};
}

function readPackages(value: unknown): PackageDraft[] {
  if (!isRecord(value) || !Array.isArray(value.packages)) return [];
  return value.packages.filter(isRecord).map((item, index) => ({
    id: stringFrom(item.id, `package-${index + 1}`),
    name: stringFrom(item.name, `باقة ${index + 1}`),
    subtitle: stringFrom(item.subtitle),
    price: stringFrom(item.price),
    priceAmount: numberFrom(item.priceAmount),
    currency: stringFrom(item.currency, "EGP"),
    imageUrl: stringFrom(item.imageUrl),
    features: Array.isArray(item.features) ? item.features.map((feature) => stringFrom(feature)).filter(Boolean) : [],
    isHighlighted: boolFrom(item.isHighlighted),
    enabled: boolFrom(item.enabled, item.isActive !== false),
  }));
}

function readExtras(value: unknown): ExtraDraft[] {
  if (!isRecord(value) || !Array.isArray(value.extras)) return [];
  return value.extras.filter(isRecord).map((item, index) => ({
    id: stringFrom(item.id, `extra-${index + 1}`),
    name: stringFrom(item.name, `إضافة ${index + 1}`),
    description: stringFrom(item.description),
    price: stringFrom(item.price),
    priceAmount: numberFrom(item.priceAmount),
    currency: stringFrom(item.currency, "EGP"),
    iconKey: stringFrom(item.iconKey, "camera"),
    enabled: boolFrom(item.enabled, item.isActive !== false),
  }));
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "منشور";
  if (status === "ARCHIVED") return "مؤرشف";
  return "مسودة";
}

export function TemplateManager({ templates, themes, message }: TemplateManagerProps) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const selected = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? templates[0] ?? null,
    [selectedId, templates],
  );

  return (
    <div className="grid gap-4">
      {message ? (
        <div className={message.tone === "danger" ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300" : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"}>
          {message.text}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-[#f3cf73]">إدارة بسيطة بدون أكواد تقنية</p>
            <h2 className="mt-1 text-lg font-black text-[#fff7e8]">القوالب الجاهزة</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/42">أنشئ قالبًا أو اختر قالبًا موجودًا ثم عدّل النصوص والصور والباقات من الأقسام الواضحة بالأسفل.</p>
          </div>
          <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a]">
            <Plus className="size-4" /> قالب جديد
          </button>
        </div>
      </section>

      {templates.length === 0 ? (
        <section className="grid place-items-center rounded-3xl border border-dashed border-white/12 bg-white/[0.025] px-6 py-16 text-center">
          <LayoutTemplate className="size-12 text-white/20" />
          <h2 className="mt-3 text-lg font-black text-white/75">لا توجد قوالب بعد</h2>
          <p className="mt-1 text-sm font-bold text-white/40">اضغط «قالب جديد» وابدأ بأول قالب.</p>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="grid content-start gap-2 rounded-3xl border border-white/10 bg-white/[0.035] p-3 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
            {templates.map((template) => {
              const active = selected?.id === template.id;
              const image = pickImage(template.previewData);
              return (
                <button key={template.id} type="button" aria-label={`تعديل ${template.name}`} onClick={() => { setSelectedId(template.id); setShowCreate(false); }} className={cn("grid grid-cols-[64px_1fr] items-center gap-3 rounded-2xl border p-2.5 text-start transition", active && !showCreate ? "border-amber-300/35 bg-amber-300/10" : "border-white/8 bg-black/15 hover:border-white/16 hover:bg-white/[0.04]") }>
                  <span className="relative grid aspect-square overflow-hidden rounded-xl bg-black/30">
                    {image ? <img src={image} alt="" className="size-full object-cover" /> : <ImageIcon className="m-auto size-5 text-white/25" />}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-black text-[#fff7e8]">{template.name}</strong>
                    <small className="mt-1 block truncate font-mono text-[0.68rem] font-bold text-white/35">{template.code}</small>
                    <small className={template.status === "PUBLISHED" ? "mt-1 block text-[0.68rem] font-black text-emerald-300" : "mt-1 block text-[0.68rem] font-black text-white/42"}>{statusLabel(template.status)}</small>
                  </span>
                </button>
              );
            })}
          </aside>

          {showCreate ? (
            <form action={createTemplateAction} className="grid content-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.055] p-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><p className="text-xs font-black text-[#f3cf73]">قالب جديد</p><h2 className="mt-1 text-lg font-black text-[#fff7e8]">بيانات القالب الأساسية</h2></div>
              <Field label="اسم القالب"><input name="name" required className={inputClass} placeholder="مثال: ستوديو كلاسيك" /></Field>
              <Field label="كود القالب"><input name="code" className={inputClass} dir="ltr" placeholder="classic-studio" /></Field>
              <Field label="الثيم الأساسي"><select name="themeId" required className={inputClass} defaultValue=""><option value="" disabled>اختر الثيم</option>{themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name} — {theme.code}</option>)}</select></Field>
              <div className="flex items-end"><button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a]"><Plus className="size-4" /> إنشاء كمسودة</button></div>
            </form>
          ) : selected ? (
            <div className="grid min-w-0 gap-4">
              <TemplateEditor key={selected.id} template={selected} />
              <TemplateImageCenter template={selected} />
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

function TemplateEditor({ template }: { template: AdminTemplateItem }) {
  const previewTitle = pickText(template.previewData, ["title", "headline", "name"], template.name);
  const previewDescription = pickText(template.previewData, ["description", "subtitle", "tagline"], template.theme.category);
  const previewImage = pickImage(template.previewData);
  const hero = heroFrom(template.previewData);
  const packages = readPackages(template.previewData);
  const extras = readExtras(template.previewData);

  return (
    <article className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/10">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/12 px-2.5 py-1 text-[0.68rem] font-black text-[#f3cf73]"><Sparkles className="size-3" /> {template.theme.name}</span>
            <span className={template.status === "PUBLISHED" ? "rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : "rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-black text-white/45"}>{statusLabel(template.status)}</span>
          </div>
          <h2 className="mt-2 truncate text-xl font-black text-[#fff7e8]">{template.name}</h2>
          <p className="mt-1 font-mono text-xs font-bold text-white/35">{template.code}</p>
        </div>
        <a href={`/templates/${template.code}/preview`} target="_blank" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/70 no-underline hover:bg-white/[0.08]"><Eye className="size-4" /> معاينة مباشرة</a>
      </header>

      <form action={saveTemplateAction} className="mt-4 grid gap-4">
        <input type="hidden" name="id" value={template.id} />

        <EditorSection icon={Settings2} title="المعلومات الأساسية" description="اسم القالب وكوده وحالته وترتيبه في صفحة القوالب.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسم القالب"><input name="name" defaultValue={template.name} className={inputClass} /></Field>
            <Field label="كود القالب"><input name="code" defaultValue={template.code} className={inputClass} dir="ltr" /></Field>
            <Field label="حالة القالب"><select name="status" defaultValue={template.status} className={inputClass}><option value="PUBLISHED">منشور</option><option value="DRAFT">مسودة</option><option value="ARCHIVED">مؤرشف</option></select></Field>
            <Field label="ترتيب الظهور"><input name="showroomOrder" type="number" defaultValue={template.showroomOrder} className={inputClass} /></Field>
          </div>
        </EditorSection>

        <EditorSection icon={ImageIcon} title="كارت القالب" description="النص والصورة اللذان يظهران للمستخدم قبل فتح المعاينة.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="عنوان الكارت"><input name="previewTitle" defaultValue={previewTitle} className={inputClass} /></Field>
            <Field label="وصف الكارت"><input name="previewDescription" defaultValue={previewDescription} className={inputClass} /></Field>
            <Field label="صورة غلاف الكارت"><input name="previewImage" defaultValue={previewImage} className={inputClass} placeholder="سيتم تحويلها إلى رفع من الجهاز في المرحلة التالية" /></Field>
            <Field label="نص زر الحجز"><input name="callToAction" defaultValue={pickText(template.previewData, ["callToAction"], "احجز الآن")} className={inputClass} /></Field>
          </div>
        </EditorSection>

        <EditorSection icon={Sparkles} title="القسم الرئيسي Hero" description="أول عنوان ووصف وصورة يراها زائر الموقع.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="العنوان الرئيسي"><input name="heroHeadline" defaultValue={stringFrom(hero.headline)} className={inputClass} /></Field>
            <Field label="الوصف الرئيسي"><input name="heroSubheadline" defaultValue={stringFrom(hero.subheadline)} className={inputClass} /></Field>
            <Field label="صورة Hero"><input name="heroImageUrl" defaultValue={stringFrom(hero.imageUrl)} className={inputClass} placeholder="سيتم تحويلها إلى رفع من الجهاز في المرحلة التالية" /></Field>
          </div>
        </EditorSection>

        <EditorSection icon={PackagePlus} title="الباقات التجريبية" description="تظهر في معاينة القالب ويمكن إخفاء أي باقة بدون حذفها.">
          <input type="hidden" name="packageCount" value={packages.length} />
          <div className="grid gap-3">
            {packages.map((item, index) => <PackageFields key={`${item.id}-${index}`} item={item} index={index} />)}
            <NewPackageFields />
          </div>
        </EditorSection>

        <EditorSection icon={Plus} title="الخدمات الإضافية" description="إضافات اختيارية تظهر في معاينة القالب.">
          <input type="hidden" name="extraCount" value={extras.length} />
          <div className="grid gap-3">
            {extras.map((item, index) => <ExtraFields key={`${item.id}-${index}`} item={item} index={index} />)}
            <NewExtraFields />
          </div>
        </EditorSection>

        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5"><Save className="size-4" /> حفظ كل تعديلات القالب</button>
      </form>

      <section className="mt-4 grid gap-2 border-t border-white/8 pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <form action={toggleTemplateAction}><input type="hidden" name="id" value={template.id} /><button className="inline-flex min-h-10 w-full items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/8 px-3 text-xs font-black text-[#f3cf73]">{template.status === "PUBLISHED" ? "إيقاف النشر" : "نشر القالب"}</button></form>
        <form action={duplicateTemplateAction}><input type="hidden" name="id" value={template.id} /><button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/65"><Copy className="size-3.5" /> إنشاء نسخة</button></form>
        <form action={restoreTemplateDefaultsAction} onSubmit={(event) => { if (!window.confirm("استعادة الإعدادات الافتراضية ستستبدل بيانات المعاينة الحالية. هل أنت متأكد؟")) event.preventDefault(); }}><input type="hidden" name="id" value={template.id} /><button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/65"><RotateCcw className="size-3.5" /> استعادة الافتراضي</button></form>
        <form action={archiveTemplateAction} onSubmit={(event) => { if (!window.confirm("سيتم أرشفة القالب وإخفاؤه من الإدارة العامة. هل أنت متأكد؟")) event.preventDefault(); }}><input type="hidden" name="id" value={template.id} /><button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-red-300/15 bg-red-500/8 px-3 text-xs font-black text-red-200"><Archive className="size-3.5" /> أرشفة</button></form>
      </section>
    </article>
  );
}

function EditorSection({ icon: Icon, title, description, children }: { icon: typeof Settings2; title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 rounded-3xl border border-white/10 bg-black/16 p-4">
      <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-[#f3cf73]"><Icon className="size-4" /></span><span><h3 className="text-sm font-black text-[#fff7e8]">{title}</h3><p className="mt-1 text-xs font-bold leading-6 text-white/42">{description}</p></span></div>
      {children}
    </section>
  );
}

function PackageFields({ item, index }: { item: PackageDraft; index: number }) {
  return <fieldset className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3"><legend className="px-2 text-xs font-black text-[#f3cf73]">باقة {index + 1}</legend><input type="hidden" name={`package_${index}_id`} value={item.id} /><label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name={`package_${index}_enabled`} defaultChecked={item.enabled} /> تشغيل الباقة</label><div className="grid gap-3 sm:grid-cols-2"><Field label="اسم الباقة"><input name={`package_${index}_name`} defaultValue={item.name} className={inputClass} /></Field><Field label="الوصف"><input name={`package_${index}_subtitle`} defaultValue={item.subtitle} className={inputClass} /></Field><Field label="السعر النصي"><input name={`package_${index}_price`} defaultValue={item.price} className={inputClass} /></Field><Field label="السعر الرقمي"><input name={`package_${index}_priceAmount`} type="number" defaultValue={item.priceAmount} className={inputClass} /></Field><Field label="العملة"><input name={`package_${index}_currency`} defaultValue={item.currency} className={inputClass} /></Field><Field label="صورة الباقة"><input name={`package_${index}_imageUrl`} defaultValue={item.imageUrl} className={inputClass} /></Field><label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name={`package_${index}_isHighlighted`} defaultChecked={item.isHighlighted} /> باقة مميزة</label></div><Field label="المميزات — كل سطر ميزة"><textarea name={`package_${index}_features`} rows={4} defaultValue={item.features.join("\n")} className={`${textareaClass} min-h-28`} /></Field></fieldset>;
}

function NewPackageFields() {
  return <fieldset className="grid gap-3 rounded-2xl border border-dashed border-amber-300/25 bg-amber-300/[0.035] p-3"><legend className="px-2 text-xs font-black text-[#f3cf73]">إضافة باقة جديدة</legend><div className="grid gap-3 sm:grid-cols-2"><Field label="اسم الباقة"><input name="newPackageName" className={inputClass} placeholder="اتركه فارغًا لو مش عايز تضيف" /></Field><Field label="الوصف"><input name="newPackageSubtitle" className={inputClass} /></Field><Field label="السعر النصي"><input name="newPackagePrice" className={inputClass} /></Field><Field label="السعر الرقمي"><input name="newPackagePriceAmount" type="number" className={inputClass} /></Field><Field label="العملة"><input name="newPackageCurrency" defaultValue="EGP" className={inputClass} /></Field><Field label="صورة الباقة"><input name="newPackageImageUrl" className={inputClass} /></Field><label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name="newPackageEnabled" defaultChecked /> تشغيل الباقة</label><label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name="newPackageIsHighlighted" /> باقة مميزة</label></div><Field label="المميزات"><textarea name="newPackageFeatures" rows={3} className={`${textareaClass} min-h-24`} /></Field></fieldset>;
}

function ExtraFields({ item, index }: { item: ExtraDraft; index: number }) {
  return <fieldset className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3"><legend className="px-2 text-xs font-black text-white/45">إضافة {index + 1}</legend><input type="hidden" name={`extra_${index}_id`} value={item.id} /><label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name={`extra_${index}_enabled`} defaultChecked={item.enabled} /> تشغيل الإضافة</label><div className="grid gap-3 sm:grid-cols-2"><Field label="الاسم"><input name={`extra_${index}_name`} defaultValue={item.name} className={inputClass} /></Field><Field label="الوصف"><input name={`extra_${index}_description`} defaultValue={item.description} className={inputClass} /></Field><Field label="السعر النصي"><input name={`extra_${index}_price`} defaultValue={item.price} className={inputClass} /></Field><Field label="السعر الرقمي"><input name={`extra_${index}_priceAmount`} type="number" defaultValue={item.priceAmount} className={inputClass} /></Field><Field label="العملة"><input name={`extra_${index}_currency`} defaultValue={item.currency} className={inputClass} /></Field><Field label="الأيقونة"><input name={`extra_${index}_iconKey`} defaultValue={item.iconKey} className={inputClass} /></Field></div></fieldset>;
}

function NewExtraFields() {
  return <fieldset className="grid gap-3 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-3"><legend className="px-2 text-xs font-black text-white/45">إضافة خدمة جديدة</legend><div className="grid gap-3 sm:grid-cols-2"><Field label="الاسم"><input name="newExtraName" className={inputClass} /></Field><Field label="الوصف"><input name="newExtraDescription" className={inputClass} /></Field><Field label="السعر النصي"><input name="newExtraPrice" className={inputClass} /></Field><Field label="السعر الرقمي"><input name="newExtraPriceAmount" type="number" className={inputClass} /></Field><Field label="العملة"><input name="newExtraCurrency" defaultValue="EGP" className={inputClass} /></Field><Field label="الأيقونة"><input name="newExtraIconKey" defaultValue="camera" className={inputClass} /></Field></div></fieldset>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black text-white/42">{label}</span>{children}</label>;
}
