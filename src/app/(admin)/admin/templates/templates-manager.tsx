"use client";

import { useState, type ReactNode } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Check,
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

const inputClass = "min-h-10 w-full rounded-xl border border-white/10 bg-black/18 px-3 text-sm font-bold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-2 focus:ring-amber-300/10";
const textareaClass = "w-full rounded-xl border border-white/10 bg-black/18 px-3 py-2 text-xs font-bold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-2 focus:ring-amber-300/10";

type TemplateStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED" | "COMING_SOON" | "HIDDEN";

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "منشور";
  if (status === "ARCHIVED") return "مؤرشف";
  if (status === "COMING_SOON") return "قريباً";
  if (status === "HIDDEN") return "مخفي";
  return "مسودة";
}

function statusTone(status: string) {
  if (status === "PUBLISHED") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  if (status === "ARCHIVED") return "bg-white/5 text-white/40 border-white/10";
  if (status === "COMING_SOON") return "bg-violet-500/15 text-violet-300 border-violet-500/20";
  if (status === "HIDDEN") return "bg-orange-500/15 text-orange-300 border-orange-500/20";
  return "bg-amber-500/15 text-amber-200 border-amber-500/20";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFrom(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function pickFromPreview(previewData: Record<string, unknown> | undefined, key: string, fallback = ""): string {
  if (!previewData) return fallback;
  const val = previewData[key];
  return typeof val === "string" ? val : fallback;
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

  const move = async (id: string, direction: "up" | "down") => {
    const currentIndex = items.findIndex((t) => t.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const next = [...items];
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    setItems(next);

    const formData = new FormData();
    formData.append("id", id);
    formData.append("direction", direction);
    await moveTemplateAction(formData);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">لوحة تحكم القوالب</h2>
          <p className="mt-0.5 text-xs font-bold text-white/40">إدارة كاملة: الترتيب، التعديل، الأرشفة، الإخفاء، والحالة</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowCreate(!showCreate); setEditingId(null); }}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#f3cf73] px-3 text-xs font-black text-[#17120a]"
        >
          <Plus className="size-3.5" /> قالب جديد
        </button>
      </div>

      {showCreate && <CreateForm themes={themes} onClose={() => setShowCreate(false)} />}

      {items.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] py-10 text-center">
          <LayoutTemplate className="size-8 text-white/15" />
          <p className="mt-2 text-sm font-black text-white/50">لا توجد قوالب</p>
        </div>
      ) : (
        <div className="grid gap-1.5">
          {items.map((template, index) => (
            <TemplateRow
              key={template.id}
              template={template}
              index={index}
              total={items.length}
              onMove={move}
              onEdit={() => { setEditingId(template.id); setShowCreate(false); }}
              isEditing={editingId === template.id}
            />
          ))}
        </div>
      )}

      {editing && (
        <TemplateEditor
          template={editing}
          themes={themes}
          unifiedDefaults={unifiedDefaults}
          onClose={() => setEditingId(null)}
        />
      )}
    </section>
  );
}

function TemplateRow({
  template,
  index,
  total,
  onMove,
  onEdit,
  isEditing,
}: {
  template: TemplateItem;
  index: number;
  total: number;
  onMove: (id: string, direction: "up" | "down") => void;
  onEdit: () => void;
  isEditing: boolean;
}) {
  const [inlineEditing, setInlineEditing] = useState(false);
  const [nameValue, setNameValue] = useState(template.name);
  const [descValue, setDescValue] = useState(template.description ?? "");

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("id", template.id);
    formData.append("name", nameValue);
    formData.append("description", descValue);
    await quickUpdateTemplateAction(formData);
    setInlineEditing(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    const formData = new FormData();
    formData.append("id", template.id);
    formData.append("status", newStatus);
    await saveTemplateAction(formData);
  };

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 transition",
        isEditing
          ? "border-amber-300/30 bg-amber-300/[0.06]"
          : "border-white/8 bg-black/10 hover:border-white/12 hover:bg-black/15",
      )}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-white/[0.04] text-[0.68rem] font-black text-white/40">
            {index + 1}
          </span>
          <span className="relative grid size-10 overflow-hidden rounded-lg bg-black/20">
            {template.previewImage ? (
              <img src={template.previewImage} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="m-auto size-4 text-white/20" />
            )}
          </span>
        </div>

        <div className="min-w-0">
          {inlineEditing ? (
            <div className="grid gap-1.5">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="h-8 w-full rounded-lg border border-amber-300/30 bg-black/25 px-2 text-sm font-black text-[#fff7e8] outline-none focus:border-amber-300/50"
                placeholder="اسم القالب"
              />
              <input
                type="text"
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                className="h-8 w-full rounded-lg border border-white/10 bg-black/20 px-2 text-xs font-bold text-white/70 outline-none focus:border-amber-300/40"
                placeholder="وصف القالب (يظهر في صفحة القوالب)"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="truncate text-sm font-black text-[#fff7e8]">{template.name}</strong>
                <span className={cn("rounded-md border px-1.5 py-0.5 text-[0.62rem] font-black", statusTone(template.status))}>
                  {statusLabel(template.status)}
                </span>
              </div>
              {template.description && (
                <small className="mt-0.5 block truncate text-[0.65rem] font-bold text-white/35">{template.description}</small>
              )}
              <small className="mt-0.5 block truncate font-mono text-[0.6rem] font-bold text-white/25">{template.code}</small>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {inlineEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
                title="حفظ"
              >
                <Check className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => { setInlineEditing(false); setNameValue(template.name); setDescValue(template.description ?? ""); }}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08]"
                title="إلغاء"
              >
                <X className="size-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onMove(template.id, "up")}
                disabled={index === 0}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-white/50 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                title="تقديم"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onMove(template.id, "down")}
                disabled={index === total - 1}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-white/50 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                title="تأخير"
              >
                <ArrowDown className="size-3.5" />
              </button>

              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex size-7 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                  title="تغيير الحالة"
                >
                  {template.status === "PUBLISHED" ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <div className="absolute right-0 top-full z-10 mt-1 hidden min-w-[140px] rounded-xl border border-white/10 bg-black/90 p-1 shadow-xl group-hover:block">
                  <StatusOption onClick={() => handleStatusChange("PUBLISHED")} label="نشر" icon={Eye} active={template.status === "PUBLISHED"} />
                  <StatusOption onClick={() => handleStatusChange("DRAFT")} label="مسودة" icon={Pencil} active={template.status === "DRAFT"} />
                  <StatusOption onClick={() => handleStatusChange("COMING_SOON")} label="قريباً" icon={Sparkles} active={template.status === "COMING_SOON"} />
                  <StatusOption onClick={() => handleStatusChange("HIDDEN")} label="مخفي" icon={EyeOff} active={template.status === "HIDDEN"} />
                  <StatusOption onClick={() => handleStatusChange("ARCHIVED")} label="أرشفة" icon={Archive} active={template.status === "ARCHIVED"} danger />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInlineEditing(true)}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                title="تعديل الاسم والوصف"
              >
                <Pencil className="size-3.5" />
              </button>
              <a
                href={`/templates/${template.code}/preview`}
                target="_blank"
                className="inline-flex size-7 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                title="معاينة"
              >
                <Eye className="size-3.5" />
              </a>
              <button
                type="button"
                onClick={onEdit}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-lg border transition",
                  isEditing
                    ? "border-amber-300/30 bg-amber-300/10 text-[#f3cf73]"
                    : "border-white/8 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white",
                )}
                title="تعديل التفاصيل الكاملة"
              >
                <Settings2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusOption({ onClick, label, icon: Icon, active, danger }: { onClick: () => void; label: string; icon: typeof Eye; active: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-black transition",
        active
          ? danger
            ? "bg-red-500/15 text-red-300"
            : "bg-amber-300/10 text-[#f3cf73]"
          : danger
            ? "text-white/50 hover:bg-red-500/10 hover:text-red-300"
            : "text-white/60 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <Icon className="size-3.5" /> {label}
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
  const settings = isRecord(template.settings) ? template.settings : {};
  const previewData = isRecord(template.previewData) ? template.previewData : {};
  const [activeTab, setActiveTab] = useState<"basic" | "content" | "packages" | "extras" | "gallery" | "contact">("basic");

  const getPackages = (): unknown[] => {
    const pkgs = previewData.packages;
    if (Array.isArray(pkgs)) return pkgs;
    const defaults = unifiedDefaults.packages;
    if (Array.isArray(defaults)) return defaults;
    return [];
  };

  const getExtras = (): unknown[] => {
    const extras = previewData.extras;
    if (Array.isArray(extras)) return extras;
    const defaults = unifiedDefaults.extras;
    if (Array.isArray(defaults)) return defaults;
    return [];
  };

  const getGallery = (): unknown[] => {
    const gallery = previewData.gallery;
    if (Array.isArray(gallery)) return gallery;
    const defaults = unifiedDefaults.gallery;
    if (Array.isArray(defaults)) return defaults;
    return [];
  };

  return (
    <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#f3cf73]">تعديل: {template.name}</h3>
          <p className="mt-0.5 text-xs font-bold text-white/40">جميع تفاصيل القالب</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <form action={saveTemplateAction} className="grid gap-4">
        <input type="hidden" name="id" value={template.id} />

        <div className="flex flex-wrap gap-2 border-b border-white/8 pb-3">
          <TabBtn active={activeTab === "basic"} onClick={() => setActiveTab("basic")} icon={Settings2} label="أساسي" />
          <TabBtn active={activeTab === "content"} onClick={() => setActiveTab("content")} icon={Sparkles} label="المحتوى" />
          <TabBtn active={activeTab === "packages"} onClick={() => setActiveTab("packages")} icon={Package} label="الباقات" />
          <TabBtn active={activeTab === "extras"} onClick={() => setActiveTab("extras")} icon={Sparkles} label="الإضافات" />
          <TabBtn active={activeTab === "gallery"} onClick={() => setActiveTab("gallery")} icon={ImageIcon} label="المعرض" />
          <TabBtn active={activeTab === "contact"} onClick={() => setActiveTab("contact")} icon={Phone} label="التواصل" />
        </div>

        {activeTab === "basic" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسم القالب"><input name="name" defaultValue={template.name} className={inputClass} /></Field>
            <Field label="رمز القالب"><input name="code" defaultValue={template.code} className={inputClass} dir="ltr" /></Field>
            <Field label="الإصدار"><input name="version" defaultValue={stringFrom(settings.version, "1.0.0")} className={inputClass} dir="ltr" /></Field>
            <Field label="الثيم">
              <select name="themeId" defaultValue={template.theme.id} className={inputClass}>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>{theme.name} — {theme.code}</option>
                ))}
              </select>
            </Field>
            <Field label="حالة النشر">
              <select name="status" defaultValue={template.status} className={inputClass}>
                <option value="PUBLISHED">منشور</option>
                <option value="DRAFT">مسودة</option>
                <option value="COMING_SOON">قريباً</option>
                <option value="HIDDEN">مخفي</option>
                <option value="ARCHIVED">مؤرشف</option>
              </select>
            </Field>
            <Field label="ترتيب الظهور"><input name="showroomOrder" type="number" defaultValue={template.showroomOrder} className={inputClass} /></Field>
            <Field label="صورة المعاينة" wide><input name="previewImage" defaultValue={template.previewImage ?? ""} className={inputClass} placeholder="https://..." dir="ltr" /></Field>
            <Field label="صورة الغلاف" wide><input name="coverImage" defaultValue={pickFromPreview(previewData, "coverImage")} className={inputClass} placeholder="https://..." dir="ltr" /></Field>
          </div>
        )}

        {activeTab === "content" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الوصف" wide>
              <textarea name="description" defaultValue={pickFromPreview(previewData, "description", stringFrom(unifiedDefaults.description))} rows={3} className={`${textareaClass} min-h-20`} />
            </Field>
            <Field label="اسم الاستوديو"><input name="studioName" defaultValue={pickFromPreview(previewData, "studioName", stringFrom(unifiedDefaults.studioName))} className={inputClass} /></Field>
            <Field label="اسم المصور"><input name="photographerName" defaultValue={pickFromPreview(previewData, "photographerName", stringFrom(unifiedDefaults.photographerName))} className={inputClass} /></Field>
            <Field label="مكان العمل"><input name="workLocation" defaultValue={pickFromPreview(previewData, "workLocation", stringFrom(unifiedDefaults.workLocation))} className={inputClass} /></Field>
            <Field label="Hero - Eyebrow"><input name="heroEyebrow" defaultValue={pickFromPreview(previewData, "heroEyebrow", stringFrom(unifiedDefaults.heroEyebrow))} className={inputClass} dir="ltr" /></Field>
            <Field label="Hero - CTA"><input name="heroCtaLabel" defaultValue={pickFromPreview(previewData, "heroCtaLabel", stringFrom(unifiedDefaults.heroCtaLabel))} className={inputClass} /></Field>
            <Field label="صورة Hero" wide><input name="heroImageUrl" defaultValue={pickFromPreview(previewData, "heroImageUrl", stringFrom(unifiedDefaults.heroImageUrl))} className={inputClass} placeholder="https://..." dir="ltr" /></Field>
            <Field label="عنوان الباقات"><input name="packagesTitle" defaultValue={pickFromPreview(previewData, "packagesTitle", stringFrom(unifiedDefaults.packagesTitle))} className={inputClass} /></Field>
            <Field label="وصف الباقات"><input name="packagesDescription" defaultValue={pickFromPreview(previewData, "packagesDescription", stringFrom(unifiedDefaults.packagesDescription))} className={inputClass} /></Field>
            <Field label="عنوان الإضافات"><input name="extrasTitle" defaultValue={pickFromPreview(previewData, "extrasTitle", stringFrom(unifiedDefaults.extrasTitle))} className={inputClass} /></Field>
            <Field label="وصف الإضافات"><input name="extrasDescription" defaultValue={pickFromPreview(previewData, "extrasDescription", stringFrom(unifiedDefaults.extrasDescription))} className={inputClass} /></Field>
            <Field label="عنوان المعرض"><input name="galleryTitle" defaultValue={pickFromPreview(previewData, "galleryTitle", stringFrom(unifiedDefaults.galleryTitle))} className={inputClass} /></Field>
            <Field label="وصف المعرض"><input name="galleryDescription" defaultValue={pickFromPreview(previewData, "galleryDescription", stringFrom(unifiedDefaults.galleryDescription))} className={inputClass} /></Field>
          </div>
        )}

        {activeTab === "packages" && (
          <div className="grid gap-3">
            <p className="text-xs font-black text-white/50">الباقات (JSON)</p>
            <input type="hidden" name="packages" defaultValue={JSON.stringify(getPackages(), null, 2)} />
            <textarea
              name="packagesJson"
              defaultValue={JSON.stringify(getPackages(), null, 2)}
              rows={12}
              className={`${textareaClass} min-h-40 font-mono`}
              dir="ltr"
              onChange={(e) => {
                const hidden = e.target.form?.querySelector('input[name="packages"]') as HTMLInputElement | null;
                if (hidden) hidden.value = e.target.value;
              }}
            />
          </div>
        )}

        {activeTab === "extras" && (
          <div className="grid gap-3">
            <p className="text-xs font-black text-white/50">الإضافات (JSON)</p>
            <input type="hidden" name="extras" defaultValue={JSON.stringify(getExtras(), null, 2)} />
            <textarea
              name="extrasJson"
              defaultValue={JSON.stringify(getExtras(), null, 2)}
              rows={10}
              className={`${textareaClass} min-h-32 font-mono`}
              dir="ltr"
              onChange={(e) => {
                const hidden = e.target.form?.querySelector('input[name="extras"]') as HTMLInputElement | null;
                if (hidden) hidden.value = e.target.value;
              }}
            />
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="grid gap-3">
            <p className="text-xs font-black text-white/50">المعرض (JSON)</p>
            <input type="hidden" name="gallery" defaultValue={JSON.stringify(getGallery(), null, 2)} />
            <textarea
              name="galleryJson"
              defaultValue={JSON.stringify(getGallery(), null, 2)}
              rows={10}
              className={`${textareaClass} min-h-32 font-mono`}
              dir="ltr"
              onChange={(e) => {
                const hidden = e.target.form?.querySelector('input[name="gallery"]') as HTMLInputElement | null;
                if (hidden) hidden.value = e.target.value;
              }}
            />
          </div>
        )}

        {activeTab === "contact" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الهاتف"><input name="contactPhone" defaultValue={pickFromPreview(previewData, "contactPhone", stringFrom(unifiedDefaults.contactPhone))} className={inputClass} dir="ltr" /></Field>
            <Field label="واتساب"><input name="contactWhatsapp" defaultValue={pickFromPreview(previewData, "contactWhatsapp", stringFrom(unifiedDefaults.contactWhatsapp))} className={inputClass} dir="ltr" /></Field>
            <Field label="البريد الإلكتروني"><input name="contactEmail" type="email" defaultValue={pickFromPreview(previewData, "contactEmail", stringFrom(unifiedDefaults.contactEmail))} className={inputClass} dir="ltr" /></Field>
            <Field label="إنستغرام"><input name="contactInstagram" defaultValue={pickFromPreview(previewData, "contactInstagram", stringFrom(unifiedDefaults.contactInstagram))} className={inputClass} dir="ltr" /></Field>
            <Field label="فيسبوك"><input name="contactFacebook" defaultValue={pickFromPreview(previewData, "contactFacebook", stringFrom(unifiedDefaults.contactFacebook))} className={inputClass} dir="ltr" /></Field>
            <Field label="تيك توك"><input name="contactTiktok" defaultValue={pickFromPreview(previewData, "contactTiktok", stringFrom(unifiedDefaults.contactTiktok))} className={inputClass} dir="ltr" /></Field>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-white/8 pt-3">
          <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-3 text-xs font-black text-[#17120a]">
            <Save className="size-3.5" /> حفظ
          </button>
          <FormButton action={duplicateTemplateAction} icon={Copy} label="نسخة" />
          <FormButton action={createTemplateAction} icon={Plus} label="جديد" />
        </div>
      </form>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Settings2; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition",
        active
          ? "bg-amber-300/15 text-[#f3cf73] border border-amber-300/30"
          : "border border-white/8 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function FormButton({ action, icon: Icon, label }: { action: (formData: FormData) => Promise<void>; icon: typeof Plus; label: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value="" />
      <button
        type="submit"
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/60 transition hover:bg-white/[0.08] hover:text-white"
      >
        <Icon className="size-3.5" /> {label}
      </button>
    </form>
  );
}

function CreateForm({ themes, onClose }: { themes: ThemeOption[]; onClose: () => void }) {
  return (
    <form action={createTemplateAction} className="mb-4 grid gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="text-xs font-black text-[#f3cf73]">قالب جديد</p>
        <p className="mt-0.5 text-xs font-bold text-white/40">المحتوى سيتم توريثه من المصدر المشترك تلقائيًا</p>
      </div>
      <Field label="اسم القالب">
        <input name="name" required className={inputClass} placeholder="مثال: ستوديو كلاسيك" />
      </Field>
      <Field label="كود القالب">
        <input name="code" className={inputClass} dir="ltr" placeholder="classic-studio" />
      </Field>
      <Field label="الثيم الأساسي">
        <select name="themeId" required className={inputClass} defaultValue="">
          <option value="" disabled>اختر الثيم</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name} — {theme.code}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex items-end gap-2">
        <button className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#f3cf73] px-3 text-xs font-black text-[#17120a]">
          <Plus className="size-3.5" /> إنشاء كمسودة
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/60"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={cn("grid gap-1", wide && "sm:col-span-2")}>
      <span className="text-[0.68rem] font-black text-white/50">{label}</span>
      {children}
    </label>
  );
}
