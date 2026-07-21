"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  ImageIcon,
  LayoutTemplate,
  Package,
  Pencil,
  Phone,
  Plus,
  Save,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";

import { saveTemplateAction } from "@/app/(admin)/admin/templates/actions";
import {
  createTemplateAction,
  duplicateTemplateAction,
} from "@/app/(admin)/admin/templates/management-actions";
import { moveTemplateAction } from "@/app/(admin)/admin/templates/reorder-templates-actions";
import { quickUpdateTemplateAction } from "@/app/(admin)/admin/templates/quick-update-template-actions";
import { cn } from "@/lib/utils/cn";

export type TemplateItem = {
  id: string;
  name: string;
  code: string;
  status: string;
  showroomOrder: number;
  previewImage?: string;
  description?: string;
  previewData?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  theme: { id: string; name: string; code: string };
};

export type ThemeOption = { id: string; name: string; code: string };

const inputClass = "min-h-9 w-full rounded-lg border border-white/10 bg-black/18 px-2.5 text-xs font-bold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-2 focus:ring-amber-300/10";
const textareaClass = "w-full rounded-lg border border-white/10 bg-black/18 px-2.5 py-2 text-xs font-bold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-2 focus:ring-amber-300/10 font-mono";

function statusLabel(s: string) {
  if (s === "PUBLISHED") return "منشور";
  if (s === "ARCHIVED") return "مؤرشف";
  if (s === "COMING_SOON") return "قريباً";
  if (s === "HIDDEN") return "مخفي";
  return "مسودة";
}

function statusTone(s: string) {
  if (s === "PUBLISHED") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  if (s === "ARCHIVED") return "bg-white/5 text-white/40 border-white/10";
  if (s === "COMING_SOON") return "bg-violet-500/15 text-violet-300 border-violet-500/20";
  if (s === "HIDDEN") return "bg-orange-500/15 text-orange-300 border-orange-500/20";
  return "bg-amber-500/15 text-amber-200 border-amber-500/20";
}

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, fb = "") {
  return typeof v === "string" ? v : fb;
}

function pv(previewData: Record<string, unknown> | undefined, key: string, fb = ""): string {
  if (!previewData) return fb;
  const v = previewData[key];
  return typeof v === "string" ? v : fb;
}

function getArr(previewData: Record<string, unknown> | undefined, key: string, defaults: Record<string, unknown>): unknown[] {
  if (previewData && Array.isArray(previewData[key])) return previewData[key] as unknown[];
  if (Array.isArray(defaults[key])) return defaults[key] as unknown[];
  return [];
}

export function TemplatesManager({
  templates,
  themes,
  unifiedDefaults,
}: {
  templates: TemplateItem[];
  themes: ThemeOption[];
  unifiedDefaults: Record<string, unknown>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [items, setItems] = useState<TemplateItem[]>(
    [...templates].sort((a, b) => a.showroomOrder - b.showroomOrder),
  );

  const editing = editingId ? items.find((t) => t.id === editingId) ?? null : null;

  const move = async (id: string, dir: "up" | "down") => {
    const idx = items.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const tgt = dir === "up" ? idx - 1 : idx + 1;
    if (tgt < 0 || tgt >= items.length) return;
    const next = [...items];
    [next[idx], next[tgt]] = [next[tgt], next[idx]];
    setItems(next);
    const fd = new FormData();
    fd.append("id", id);
    fd.append("direction", dir);
    await moveTemplateAction(fd);
  };

  const quickUpdate = async (id: string, name: string, desc: string) => {
    const fd = new FormData();
    fd.append("id", id);
    fd.append("name", name);
    fd.append("description", desc);
    await quickUpdateTemplateAction(fd);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-[#fff7e8]">القوالب</h2>
          <p className="text-[0.65rem] font-bold text-white/35">{items.length} قالب — اضغط على أي قالب للتعديل</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowCreate(!showCreate); setEditingId(null); }}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#f3cf73] px-2.5 text-[0.7rem] font-black text-[#17120a]"
        >
          <Plus className="size-3" /> قالب جديد
        </button>
      </div>

      {showCreate && <CreateForm themes={themes} onClose={() => setShowCreate(false)} />}

      {items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] py-8 text-center">
          <LayoutTemplate className="size-6 text-white/12" />
          <p className="mt-1.5 text-xs font-black text-white/40">لا توجد قوالب</p>
        </div>
      ) : (
        <div className="grid gap-1">
          {items.map((t, i) => {
            const isEdit = editingId === t.id;
            return (
              <div key={t.id}>
                <TemplateRow
                  template={t}
                  index={i}
                  total={items.length}
                  onMove={move}
                  onQuickUpdate={quickUpdate}
                  isEditing={isEdit}
                  onClick={() => setEditingId(isEdit ? null : t.id)}
                  onEditToggle={() => setEditingId(isEdit ? null : t.id)}
                />
                {isEdit && (
                  <TemplateEditor
                    template={editing ?? t}
                    themes={themes}
                    unifiedDefaults={unifiedDefaults}
                    onClose={() => setEditingId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TemplateRow({
  template,
  index,
  total,
  onMove,
  onQuickUpdate,
  isEditing,
  onClick,
  onEditToggle,
}: {
  template: TemplateItem;
  index: number;
  total: number;
  onMove: (id: string, dir: "up" | "down") => void;
  onQuickUpdate: (id: string, name: string, desc: string) => void;
  isEditing: boolean;
  onClick: () => void;
  onEditToggle: () => void;
}) {
  const [inl, setInl] = useState(false);
  const [nm, setNm] = useState(template.name);
  const [ds, setDs] = useState(template.description ?? "");

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition cursor-pointer",
        isEditing
          ? "border-amber-300/30 bg-amber-300/[0.06]"
          : "border-white/6 bg-transparent hover:border-white/10 hover:bg-white/[0.02]",
      )}
      onClick={inl ? undefined : onClick}
    >
      <span className="grid size-5 place-items-center rounded-md bg-white/[0.04] text-[0.6rem] font-black text-white/35 shrink-0">
        {index + 1}
      </span>
      <span className="relative grid size-7 overflow-hidden rounded-md bg-black/15 shrink-0">
        {template.previewImage ? (
          <img src={template.previewImage} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="m-auto size-3 text-white/15" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        {inl ? (
          <div className="grid gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              value={nm}
              onChange={(e) => setNm(e.target.value)}
              className="h-7 w-full rounded-md border border-amber-300/30 bg-black/25 px-2 text-xs font-bold text-[#fff7e8] outline-none focus:border-amber-300/50"
              placeholder="اسم القالب"
            />
            <input
              value={ds}
              onChange={(e) => setDs(e.target.value)}
              className="h-7 w-full rounded-md border border-white/10 bg-black/15 px-2 text-[0.65rem] font-bold text-white/60 outline-none focus:border-amber-300/40"
              placeholder="وصف القالب (يظهر في صفحة القوالب العامة)"
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onQuickUpdate(template.id, nm, ds); setInl(false); }}
                className="inline-flex h-6 items-center gap-1 rounded-md bg-emerald-500/15 px-2 text-[0.6rem] font-bold text-emerald-300"
              >
                <Save className="size-2.5" /> حفظ
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setInl(false); setNm(template.name); setDs(template.description ?? ""); }}
                className="inline-flex h-6 items-center gap-1 rounded-md border border-white/10 px-2 text-[0.6rem] font-bold text-white/45"
              >
                <X className="size-2.5" /> إلغاء
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <strong className="truncate text-[0.75rem] font-black text-[#fff7e8]">{template.name}</strong>
              <span className={cn("rounded border px-1 py-px text-[0.55rem] font-bold shrink-0", statusTone(template.status))}>
                {statusLabel(template.status)}
              </span>
            </div>
            {template.description && (
              <small className="mt-px block truncate text-[0.6rem] font-bold text-white/30">{template.description}</small>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <IconBtn onClick={() => onMove(template.id, "up")} disabled={index === 0} title="تقديم"><ArrowUp className="size-3" /></IconBtn>
        <IconBtn onClick={() => onMove(template.id, "down")} disabled={index === total - 1} title="تأخير"><ArrowDown className="size-3" /></IconBtn>
        <IconBtn onClick={() => { if (inl) { onQuickUpdate(template.id, nm, ds); } setInl(!inl); }} title="تعديل الاسم والوصف"><Pencil className="size-3" /></IconBtn>
        <a href={`/templates/${template.code}/preview`} target="_blank" className="inline-flex size-6 items-center justify-center rounded-md border border-white/6 text-white/35 hover:bg-white/[0.05] hover:text-white" title="معاينة"><Eye className="size-3" /></a>
        <IconBtn onClick={onEditToggle} title="تعديل تفاصيل القالب" active={isEditing}><Settings2 className="size-3" /></IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ onClick, disabled, title, active, children }: { onClick: () => void; disabled?: boolean; title: string; active?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md border transition",
        active
          ? "border-amber-300/30 bg-amber-300/10 text-[#f3cf73]"
          : "border-white/6 text-white/35 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
        disabled ? "cursor-not-allowed opacity-20 hover:border-white/6 hover:bg-transparent hover:text-white/35" : "",
      )}
    >
      {children}
    </button>
  );
}

function TemplateEditor({
  template,
  themes,
  unifiedDefaults,
  onClose,
}: {
  template: TemplateItem;
  themes: ThemeOption[];
  unifiedDefaults: Record<string, unknown>;
  onClose: () => void;
}) {
  const settings = isRec(template.settings) ? template.settings : {};
  const previewData = isRec(template.previewData) ? template.previewData : {};
  const [activeTab, setActiveTab] = useState<"basic" | "content" | "packages" | "extras" | "gallery" | "contact">("basic");

  const packages = getArr(previewData, "packages", unifiedDefaults);
  const extras = getArr(previewData, "extras", unifiedDefaults);
  const gallery = getArr(previewData, "gallery", unifiedDefaults);

  return (
    <div className="mt-1 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-3" onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-[#f3cf73]">تعديل: {template.name}</h3>
          <p className="text-[0.6rem] font-bold text-white/35">جميع تفاصيل القالب</p>
        </div>
        <button type="button" onClick={onClose} className="inline-flex size-6 items-center justify-center rounded-md border border-white/10 text-white/40 hover:bg-white/[0.06] hover:text-white"><X className="size-3" /></button>
      </div>

      <form action={saveTemplateAction} className="grid gap-3">
        <input type="hidden" name="id" value={template.id} />

        <div className="flex flex-wrap gap-1 border-b border-white/8 pb-2">
          <ETab active={activeTab === "basic"} onClick={() => setActiveTab("basic")} icon={Settings2} label="أساسي" />
          <ETab active={activeTab === "content"} onClick={() => setActiveTab("content")} icon={Sparkles} label="المحتوى" />
          <ETab active={activeTab === "packages"} onClick={() => setActiveTab("packages")} icon={Package} label="الباقات" />
          <ETab active={activeTab === "extras"} onClick={() => setActiveTab("extras")} icon={Sparkles} label="الإضافات" />
          <ETab active={activeTab === "gallery"} onClick={() => setActiveTab("gallery")} icon={ImageIcon} label="المعرض" />
          <ETab active={activeTab === "contact"} onClick={() => setActiveTab("contact")} icon={Phone} label="التواصل" />
        </div>

        {activeTab === "basic" && (
          <div className="grid gap-2 sm:grid-cols-3">
            <F label="اسم القالب"><input name="name" defaultValue={template.name} className={inputClass} /></F>
            <F label="رمز القالب"><input name="code" defaultValue={template.code} className={inputClass} dir="ltr" /></F>
            <F label="الإصدار"><input name="version" defaultValue={str(settings.version, "1.0.0")} className={inputClass} dir="ltr" /></F>
            <F label="الثيم">
              <select name="themeId" defaultValue={template.theme.id} className={inputClass}>
                {themes.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.code}</option>)}
              </select>
            </F>
            <F label="حالة النشر">
              <select name="status" defaultValue={template.status} className={inputClass}>
                <option value="PUBLISHED">منشور</option>
                <option value="DRAFT">مسودة</option>
                <option value="COMING_SOON">قريباً</option>
                <option value="HIDDEN">مخفي</option>
                <option value="ARCHIVED">مؤرشف</option>
              </select>
            </F>
            <F label="ترتيب الظهور"><input name="showroomOrder" type="number" defaultValue={template.showroomOrder} className={inputClass} /></F>
            <F label="صورة المعاينة"><input name="previewImage" defaultValue={template.previewImage ?? ""} className={inputClass} placeholder="https://..." dir="ltr" /></F>
            <F label="صورة Hero"><input name="heroImageUrl" defaultValue={pv(previewData, "heroImageUrl", str(unifiedDefaults.heroImageUrl))} className={inputClass} placeholder="https://..." dir="ltr" /></F>
          </div>
        )}

        {activeTab === "content" && (
          <div className="grid gap-2 sm:grid-cols-2">
            <F label="الوصف (يظهر في صفحة القوالب)" wide>
              <textarea name="description" defaultValue={pv(previewData, "description", str(unifiedDefaults.description))} rows={2} className={textareaClass} />
            </F>
            <F label="اسم الاستوديو"><input name="studioName" defaultValue={pv(previewData, "studioName", str(unifiedDefaults.studioName))} className={inputClass} /></F>
            <F label="اسم المصور"><input name="photographerName" defaultValue={pv(previewData, "photographerName", str(unifiedDefaults.photographerName))} className={inputClass} /></F>
            <F label="مكان العمل"><input name="workLocation" defaultValue={pv(previewData, "workLocation", str(unifiedDefaults.workLocation))} className={inputClass} /></F>
            <F label="Hero - Eyebrow"><input name="heroEyebrow" defaultValue={pv(previewData, "heroEyebrow", str(unifiedDefaults.heroEyebrow))} className={inputClass} dir="ltr" /></F>
            <F label="Hero - CTA"><input name="heroCtaLabel" defaultValue={pv(previewData, "heroCtaLabel", str(unifiedDefaults.heroCtaLabel))} className={inputClass} /></F>
            <F label="عنوان الباقات"><input name="packagesTitle" defaultValue={pv(previewData, "packagesTitle", str(unifiedDefaults.packagesTitle))} className={inputClass} /></F>
            <F label="وصف الباقات"><input name="packagesDescription" defaultValue={pv(previewData, "packagesDescription", str(unifiedDefaults.packagesDescription))} className={inputClass} /></F>
            <F label="عنوان الإضافات"><input name="extrasTitle" defaultValue={pv(previewData, "extrasTitle", str(unifiedDefaults.extrasTitle))} className={inputClass} /></F>
            <F label="وصف الإضافات"><input name="extrasDescription" defaultValue={pv(previewData, "extrasDescription", str(unifiedDefaults.extrasDescription))} className={inputClass} /></F>
            <F label="عنوان المعرض"><input name="galleryTitle" defaultValue={pv(previewData, "galleryTitle", str(unifiedDefaults.galleryTitle))} className={inputClass} /></F>
            <F label="وصف المعرض"><input name="galleryDescription" defaultValue={pv(previewData, "galleryDescription", str(unifiedDefaults.galleryDescription))} className={inputClass} /></F>
          </div>
        )}

        {activeTab === "packages" && (
          <div className="grid gap-2">
            <p className="text-[0.6rem] font-bold text-white/40">الباقات (JSON - يمكن تعديلها كقائمة كائنات)</p>
            <input type="hidden" name="packages" value={JSON.stringify(packages)} />
            <textarea
              name="packagesJson"
              defaultValue={JSON.stringify(packages, null, 2)}
              rows={10}
              className={`${textareaClass} min-h-32`}
              dir="ltr"
              onChange={(e) => {
                const h = e.currentTarget.form?.querySelector('input[name="packages"]') as HTMLInputElement | null;
                if (h) h.value = e.target.value;
              }}
            />
          </div>
        )}

        {activeTab === "extras" && (
          <div className="grid gap-2">
            <p className="text-[0.6rem] font-bold text-white/40">الإضافات (JSON)</p>
            <input type="hidden" name="extras" value={JSON.stringify(extras)} />
            <textarea
              name="extrasJson"
              defaultValue={JSON.stringify(extras, null, 2)}
              rows={8}
              className={`${textareaClass} min-h-28`}
              dir="ltr"
              onChange={(e) => {
                const h = e.currentTarget.form?.querySelector('input[name="extras"]') as HTMLInputElement | null;
                if (h) h.value = e.target.value;
              }}
            />
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="grid gap-2">
            <p className="text-[0.6rem] font-bold text-white/40">المعرض (JSON)</p>
            <input type="hidden" name="gallery" value={JSON.stringify(gallery)} />
            <textarea
              name="galleryJson"
              defaultValue={JSON.stringify(gallery, null, 2)}
              rows={8}
              className={`${textareaClass} min-h-28`}
              dir="ltr"
              onChange={(e) => {
                const h = e.currentTarget.form?.querySelector('input[name="gallery"]') as HTMLInputElement | null;
                if (h) h.value = e.target.value;
              }}
            />
          </div>
        )}

        {activeTab === "contact" && (
          <div className="grid gap-2 sm:grid-cols-3">
            <F label="الهاتف"><input name="contactPhone" defaultValue={pv(previewData, "contactPhone", str(unifiedDefaults.contactPhone))} className={inputClass} dir="ltr" /></F>
            <F label="واتساب"><input name="contactWhatsapp" defaultValue={pv(previewData, "contactWhatsapp", str(unifiedDefaults.contactWhatsapp))} className={inputClass} dir="ltr" /></F>
            <F label="البريد"><input name="contactEmail" type="email" defaultValue={pv(previewData, "contactEmail", str(unifiedDefaults.contactEmail))} className={inputClass} dir="ltr" /></F>
            <F label="إنستغرام"><input name="contactInstagram" defaultValue={pv(previewData, "contactInstagram", str(unifiedDefaults.contactInstagram))} className={inputClass} dir="ltr" /></F>
            <F label="فيسبوك"><input name="contactFacebook" defaultValue={pv(previewData, "contactFacebook", str(unifiedDefaults.contactFacebook))} className={inputClass} dir="ltr" /></F>
            <F label="تيك توك"><input name="contactTiktok" defaultValue={pv(previewData, "contactTiktok", str(unifiedDefaults.contactTiktok))} className={inputClass} dir="ltr" /></F>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 border-t border-white/8 pt-2">
          <button className="inline-flex h-7 items-center gap-1 rounded-lg bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-2.5 text-[0.65rem] font-black text-[#17120a]"><Save className="size-3" /> حفظ</button>
          <form action={duplicateTemplateAction}>
            <input type="hidden" name="id" value={template.id} />
            <button type="submit" className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[0.65rem] font-bold text-white/55 hover:bg-white/[0.08] hover:text-white"><Copy className="size-3" /> إنشاء نسخة</button>
          </form>
        </div>
      </form>
    </div>
  );
}

function ETab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Settings2; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[0.6rem] font-bold transition",
        active
          ? "bg-amber-300/15 text-[#f3cf73] border border-amber-300/30"
          : "border border-white/8 bg-white/[0.03] text-white/45 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <Icon className="size-3" /> {label}
    </button>
  );
}

function CreateForm({ themes, onClose }: { themes: ThemeOption[]; onClose: () => void }) {
  return (
    <form action={createTemplateAction} className="mb-3 grid gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="text-[0.7rem] font-black text-[#f3cf73]">قالب جديد</p>
        <p className="text-[0.6rem] font-bold text-white/35">المحتوى موروث من المصدر المشترك تلقائيًا</p>
      </div>
      <F label="اسم القالب"><input name="name" required className={inputClass} placeholder="مثال: ستوديو كلاسيك" /></F>
      <F label="كود القالب"><input name="code" className={inputClass} dir="ltr" placeholder="classic-studio" /></F>
      <F label="الثيم">
        <select name="themeId" required className={inputClass} defaultValue=""><option value="" disabled>اختر الثيم</option>{themes.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.code}</option>)}</select>
      </F>
      <div className="flex items-end gap-1.5">
        <button className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-[#f3cf73] px-2.5 text-[0.7rem] font-black text-[#17120a]"><Plus className="size-3" /> إنشاء</button>
        <button type="button" onClick={onClose} className="inline-flex h-8 items-center rounded-lg border border-white/10 px-2.5 text-[0.7rem] font-bold text-white/50">إلغاء</button>
      </div>
    </form>
  );
}

function F({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={cn("grid gap-0.5", wide && "sm:col-span-2")}><span className="text-[0.6rem] font-bold text-white/45">{label}</span>{children}</label>;
}
