"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Copy,
  Edit3,
  EyeOff,
  Package,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuilderNotice } from "@/components/dashboard/builder-primitives";
import {
  addExtraAction,
  addPackageAction,
  deleteExtraAction,
  deletePackageAction,
  duplicateExtraAction,
  duplicatePackageAction,
  reorderExtraAction,
  reorderPackageAction,
  updateExtraAction,
  updatePackageAction,
} from "@/app/(dashboard)/dashboard/services/actions";

type PackageData = {
  id: string;
  name: string;
  subtitle?: string;
  priceAmount: number;
  currency: string;
  features: string[];
  isHighlighted: boolean;
  isActive: boolean;
  sortOrder: number;
};

type ExtraData = {
  id: string;
  name: string;
  description: string | null;
  priceAmount: number;
  currency: string;
  iconKey: string | null;
  isHighlighted: boolean;
  isActive: boolean;
  sortOrder: number;
};

type ServicesClientProps = {
  packages: PackageData[];
  extras: ExtraData[];
  created?: string;
  error?: string;
};

function money(amount: number, currency: string): string {
  return `${amount.toLocaleString("ar-EG")} ${currency || "EGP"}`;
}

export function ServicesClient({ packages, extras, created, error }: ServicesClientProps) {
  const [showPackageForm, setShowPackageForm] = useState(packages.length === 0);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [confirmDeletePackageId, setConfirmDeletePackageId] = useState<string | null>(null);
  const [confirmDeleteExtraId, setConfirmDeleteExtraId] = useState<string | null>(null);

  const completePercent = Math.round((((packages.length > 0 ? 1 : 0) + (extras.length > 0 ? 1 : 0)) / 2) * 100);
  const notice = error
    ? { tone: "error" as const, title: "مقدرناش نحفظ التعديل", description: decodeURIComponent(error) }
    : created
      ? { tone: "success" as const, title: created === "package" ? "تم حفظ الباقة" : "تم حفظ الخدمة الإضافية", description: "كمل باقي البيانات بالترتيب." }
      : null;

  function runPackageAction(action: (formData: FormData) => void, id: string, close?: () => void) {
    const fd = new FormData();
    fd.set("id", id);
    action(fd);
    close?.();
  }

  function reorderPackage(id: string, direction: "up" | "down") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("direction", direction);
    reorderPackageAction(fd);
  }

  function reorderExtra(id: string, direction: "up" | "down") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("direction", direction);
    reorderExtraAction(fd);
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-3 pb-4">
      <section className="rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.1),transparent_38%),rgba(255,255,255,0.035)] p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Package className="size-5" /></span>
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">المرحلة ١</p>
            <h1 className="mt-1 text-xl font-black text-[#fff7e8] sm:text-2xl">الباقات والأسعار</h1>
            <p className="mt-1 text-sm font-bold leading-7 text-white/55">كل كلمة يراها العميل في الباقة أو الإضافة يمكن تعديلها من هنا: العنوان، الوصف، السعر، العملة، الحالة، والمميزات.</p>
          </div>
        </div>
      </section>

      {notice ? <BuilderNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      <section className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle icon={Package} title="الباقات" description="العروض الأساسية التي يختار منها العميل." />
          <Button variant="luxury" className="min-h-10 rounded-2xl font-black" onClick={() => setShowPackageForm((value) => !value)}>
            {showPackageForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {showPackageForm ? "إغلاق" : "إضافة باقة"}
          </Button>
        </div>

        {showPackageForm ? <PackageForm mode="create" onCancel={() => setShowPackageForm(false)} /> : null}

        {packages.length === 0 ? (
          <EmptyState title="ابدأ بأول باقة" description="مثلاً: باقة زفاف، باقة خطوبة، باقة منتجات. اكتب السعر والمميزات بنفسك." action="إنشاء باقة" onClick={() => setShowPackageForm(true)} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {packages.map((pkg, index) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                editing={editingPackageId === pkg.id}
                confirmingDelete={confirmDeletePackageId === pkg.id}
                isFirst={index === 0}
                isLast={index === packages.length - 1}
                onEdit={() => setEditingPackageId(pkg.id)}
                onCancelEdit={() => setEditingPackageId(null)}
                onDuplicate={() => runPackageAction(duplicatePackageAction, pkg.id)}
                onDelete={() => setConfirmDeletePackageId(pkg.id)}
                onCancelDelete={() => setConfirmDeletePackageId(null)}
                onConfirmDelete={() => runPackageAction(deletePackageAction, pkg.id, () => setConfirmDeletePackageId(null))}
                onReorder={(direction) => reorderPackage(pkg.id, direction)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle icon={Sparkles} title="الإضافات" description="خدمات اختيارية فوق الباقة الأساسية." />
          <Button variant="secondary" className="min-h-10 rounded-2xl border-white/10 bg-white/[0.04] font-black text-white" onClick={() => setShowExtraForm((value) => !value)}>
            {showExtraForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {showExtraForm ? "إغلاق" : "إضافة خدمة"}
          </Button>
        </div>

        {showExtraForm ? <ExtraForm mode="create" onCancel={() => setShowExtraForm(false)} /> : null}

        {extras.length === 0 ? (
          <EmptyState title="ضيف خدمة اختيارية" description="زي فيديو Reel، ألبوم مطبوع، أو ساعة تصوير زيادة." action="إضافة خدمة" onClick={() => setShowExtraForm(true)} />
        ) : (
          <div className="grid gap-2">
            {extras.map((extra, index) => (
              <ExtraRow
                key={extra.id}
                extra={extra}
                editing={editingExtraId === extra.id}
                confirmingDelete={confirmDeleteExtraId === extra.id}
                isFirst={index === 0}
                isLast={index === extras.length - 1}
                onEdit={() => setEditingExtraId(extra.id)}
                onCancelEdit={() => setEditingExtraId(null)}
                onDuplicate={() => runPackageAction(duplicateExtraAction, extra.id)}
                onDelete={() => setConfirmDeleteExtraId(extra.id)}
                onCancelDelete={() => setConfirmDeleteExtraId(null)}
                onConfirmDelete={() => runPackageAction(deleteExtraAction, extra.id, () => setConfirmDeleteExtraId(null))}
                onReorder={(direction) => reorderExtra(extra.id, direction)}
              />
            ))}
          </div>
        )}
      </section>

      <NextFooter percent={completePercent} nextHref="/dashboard/site-info" nextLabel="كمل بيانات التواصل" />
    </main>
  );
}

function PackageCard({ pkg, editing, confirmingDelete, isFirst, isLast, onEdit, onCancelEdit, onDuplicate, onDelete, onCancelDelete, onConfirmDelete, onReorder }: {
  pkg: PackageData;
  editing: boolean;
  confirmingDelete: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onReorder: (direction: "up" | "down") => void;
}) {
  if (confirmingDelete) {
    return <ConfirmDelete title={`تحذف باقة “${pkg.name}”؟`} onConfirm={onConfirmDelete} onCancel={onCancelDelete} />;
  }

  if (editing) {
    return <PackageForm mode="edit" pkg={pkg} onCancel={onCancelEdit} />;
  }

  return (
    <article className={pkg.isActive ? "grid gap-3 rounded-2xl border border-white/10 bg-black/16 p-4" : "grid gap-3 rounded-2xl border border-white/8 bg-black/10 p-4 opacity-60"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#fff7e8]">{pkg.name}</h3>
            {pkg.isHighlighted ? <span className="rounded-full bg-amber-300/12 px-2.5 py-1 text-[0.68rem] font-black text-[#f3cf73]">الأكثر طلباً</span> : null}
            <span className={pkg.isActive ? "rounded-full bg-emerald-300/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : "rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-black text-white/45"}>{pkg.isActive ? "ظاهرة" : "مخفية"}</span>
          </div>
          {pkg.subtitle ? <p className="mt-1 text-sm font-bold leading-6 text-white/48">{pkg.subtitle}</p> : null}
        </div>
        <p className="shrink-0 rounded-2xl bg-amber-300/10 px-3 py-2 text-sm font-black text-[#f3cf73]">{money(pkg.priceAmount, pkg.currency)}</p>
      </div>

      {pkg.features.length > 0 ? (
        <ul className="grid gap-1.5 text-sm font-bold text-white/58">
          {pkg.features.map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />{feature}</li>)}
        </ul>
      ) : <p className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm font-bold text-white/38">مفيش مميزات مكتوبة. اضغط تعديل وضيف كل ميزة في خانة مستقلة.</p>}

      <div className="grid gap-2">
        <button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-400/45 bg-amber-400/12 px-4 text-sm font-black text-[#f3cf73] transition hover:bg-amber-400/20">
          <Edit3 className="size-4" /> تعديل الباقة وكل النصوص
        </button>
        <ActionBar>
          <MiniButton onClick={onDuplicate} label="نسخ" icon={Copy} />
          <MiniButton onClick={() => onReorder("up")} label="فوق" icon={ArrowUp} disabled={isFirst} />
          <MiniButton onClick={() => onReorder("down")} label="تحت" icon={ArrowDown} disabled={isLast} />
          <MiniButton onClick={onDelete} label="حذف" icon={Trash2} danger />
        </ActionBar>
      </div>
    </article>
  );
}

function PackageForm({ mode, pkg, onCancel }: { mode: "create" | "edit"; pkg?: PackageData; onCancel: () => void }) {
  const [features, setFeatures] = useState<string[]>(pkg?.features.length ? pkg.features : [""]);
  const action = mode === "create" ? addPackageAction : updatePackageAction;

  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3">
      {pkg ? <input type="hidden" name="id" value={pkg.id} /> : null}
      <div className="rounded-2xl border border-white/10 bg-black/15 p-3 text-sm font-bold leading-6 text-white/58">
        {mode === "edit" ? "وضع تعديل الباقة: عدّل أي حرف ثم اضغط حفظ." : "إنشاء باقة جديدة تظهر في صفحة العميل."}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="عنوان الباقة"><Input name="name" defaultValue={pkg?.name ?? ""} placeholder="مثلاً: باقة الزفاف الأساسية" required /></Field>
        <Field label="السعر"><Input name="priceAmount" type="number" min={1} defaultValue={pkg?.priceAmount ?? ""} placeholder="15000" required /></Field>
        <Field label="العملة"><Input name="currency" defaultValue={pkg?.currency ?? "EGP"} /></Field>
        <Field label="وصف قصير"><Input name="subtitle" defaultValue={pkg?.subtitle ?? ""} placeholder="مناسبة لتغطية يوم الزفاف" /></Field>
      </div>

      <FeatureRows features={features} setFeatures={setFeatures} />

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65"><input type="checkbox" name="isHighlighted" defaultChecked={pkg?.isHighlighted ?? false} className="size-4 accent-[#f3cf73]" /> شارة الأكثر طلباً</label>
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65"><input type="checkbox" name="isActive" defaultChecked={pkg?.isActive ?? true} className="size-4 accent-[#f3cf73]" /> ظاهرة للعميل</label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" variant="luxury" className="rounded-2xl font-black"><Save className="size-4" /> حفظ</Button>
        <Button type="button" variant="ghost" className="rounded-2xl" onClick={onCancel}>إلغاء</Button>
      </div>
    </form>
  );
}

function FeatureRows({ features, setFeatures }: { features: string[]; setFeatures: (features: string[]) => void }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-white/55">مميزات الباقة — كل ميزة في خانة لوحدها</p>
        <button type="button" onClick={() => setFeatures([...features, ""])} className="inline-flex min-h-8 items-center gap-1 rounded-xl bg-white/[0.06] px-2 text-xs font-black text-white/70">
          <Plus className="size-3.5" /> إضافة خانة
        </button>
      </div>
      {features.map((feature, index) => (
        <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
          <Input name="feature" value={feature} onChange={(event) => setFeatures(features.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`الميزة ${index + 1}`} />
          <button type="button" onClick={() => setFeatures(features.filter((_, itemIndex) => itemIndex !== index).length ? features.filter((_, itemIndex) => itemIndex !== index) : [""])} className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-black/18 text-red-200">
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ExtraRow({ extra, editing, confirmingDelete, isFirst, isLast, onEdit, onCancelEdit, onDuplicate, onDelete, onCancelDelete, onConfirmDelete, onReorder }: {
  extra: ExtraData;
  editing: boolean;
  confirmingDelete: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onReorder: (direction: "up" | "down") => void;
}) {
  if (confirmingDelete) return <ConfirmDelete title={`تحذف خدمة “${extra.name}”؟`} onConfirm={onConfirmDelete} onCancel={onCancelDelete} />;
  if (editing) return <ExtraForm mode="edit" extra={extra} onCancel={onCancelEdit} />;

  return (
    <article className={extra.isActive ? "grid gap-3 rounded-2xl border border-white/10 bg-black/16 p-3" : "grid gap-3 rounded-2xl border border-white/8 bg-black/10 p-3 opacity-60"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-[#fff7e8]">{extra.name}</h3>
            {extra.isHighlighted ? <span className="rounded-full bg-amber-300/12 px-2.5 py-1 text-[0.68rem] font-black text-[#f3cf73]">مميزة</span> : null}
            <span className={extra.isActive ? "rounded-full bg-emerald-300/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : "rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-black text-white/45"}>{extra.isActive ? "ظاهرة" : "مخفية"}</span>
          </div>
          {extra.description ? <p className="mt-1 text-xs font-bold leading-5 text-white/45">{extra.description}</p> : null}
          <p className="mt-1 text-xs font-bold text-white/42">{money(extra.priceAmount, extra.currency)} {extra.iconKey ? `· ${extra.iconKey}` : ""}</p>
        </div>
      </div>
      <div className="grid gap-2">
        <button type="button" onClick={onEdit} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 text-sm font-black text-white/78 transition hover:bg-amber-300/12 hover:text-[#f3cf73]">
          <Edit3 className="size-4" /> تعديل الإضافة
        </button>
        <ActionBar compact>
          <MiniButton onClick={onDuplicate} label="نسخ" icon={Copy} />
          <MiniButton onClick={() => onReorder("up")} label="فوق" icon={ArrowUp} disabled={isFirst} />
          <MiniButton onClick={() => onReorder("down")} label="تحت" icon={ArrowDown} disabled={isLast} />
          <MiniButton onClick={onDelete} label="حذف" icon={Trash2} danger />
        </ActionBar>
      </div>
    </article>
  );
}

function ExtraForm({ mode, extra, onCancel }: { mode: "create" | "edit"; extra?: ExtraData; onCancel: () => void }) {
  const action = mode === "create" ? addExtraAction : updateExtraAction;
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-white/10 bg-black/18 p-3">
      {extra ? <input type="hidden" name="id" value={extra.id} /> : null}
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm font-bold leading-6 text-white/58">
        {mode === "edit" ? "وضع تعديل الإضافة: الاسم والوصف والسعر والظهور قابلين للتعديل." : "إضافة خدمة جديدة تظهر كاختيار إضافي للعميل."}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم الإضافة"><Input name="name" defaultValue={extra?.name ?? ""} placeholder="مثلاً: فيديو Reel" required /></Field>
        <Field label="السعر"><Input name="priceAmount" type="number" min={1} defaultValue={extra?.priceAmount ?? ""} placeholder="2500" required /></Field>
        <Field label="العملة"><Input name="currency" defaultValue={extra?.currency ?? "EGP"} /></Field>
        <Field label="رمز اختياري"><Input name="iconKey" defaultValue={extra?.iconKey ?? ""} placeholder="video" /></Field>
      </div>
      <Field label="وصف قصير"><Input name="description" defaultValue={extra?.description ?? ""} placeholder="خدمة اختيارية تضيف قيمة للباقة" /></Field>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65"><input type="checkbox" name="isHighlighted" defaultChecked={extra?.isHighlighted ?? false} className="size-4 accent-[#f3cf73]" /> مميزة</label>
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65"><input type="checkbox" name="isActive" defaultChecked={extra?.isActive ?? true} className="size-4 accent-[#f3cf73]" /> ظاهرة للعميل</label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="submit" variant="luxury" className="rounded-2xl font-black"><Save className="size-4" /> حفظ</Button>
        <Button type="button" variant="ghost" className="rounded-2xl" onClick={onCancel}>إلغاء</Button>
      </div>
    </form>
  );
}

function NextFooter({ percent, nextHref, nextLabel }: { percent: number; nextHref: string; nextLabel: string }) {
  return (
    <section className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div>
        <p className="text-xs font-black text-white/38">اكتمال مرحلة الباقات</p>
        <p className="mt-1 text-lg font-black text-[#fff7e8]">{percent}%</p>
      </div>
      <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/70 no-underline">الرئيسية</Link>
      <Link href={nextHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline">
        {nextLabel}
        <ArrowLeft className="size-4" />
      </Link>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black text-white/55">{label}</span>{children}</label>;
}

function SectionTitle({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Icon className="size-4" /></span><div className="min-w-0"><h2 className="truncate text-base font-black text-[#fff7e8]">{title}</h2><p className="mt-1 text-xs font-bold leading-5 text-white/45">{description}</p></div></div>;
}

function EmptyState({ title, description, action, onClick }: { title: string; description: string; action: string; onClick: () => void }) {
  return <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-white/14 bg-black/15 p-6 text-center"><Package className="size-10 text-white/28" /><div><h3 className="text-base font-black text-[#fff7e8]">{title}</h3><p className="mt-1 max-w-sm text-sm font-bold leading-7 text-white/45">{description}</p></div><Button variant="luxury" className="rounded-2xl font-black" onClick={onClick}><Plus className="size-4" />{action}</Button></div>;
}

function ConfirmDelete({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return <div className="grid gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-center"><p className="text-sm font-black text-[#fff7e8]">{title}</p><p className="text-xs font-bold text-white/45">التغيير هيختفي من الموقع.</p><div className="grid grid-cols-2 gap-2"><Button variant="luxury" onClick={onConfirm}>حذف</Button><Button variant="ghost" onClick={onCancel}>إلغاء</Button></div></div>;
}

function ActionBar({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return <div className={compact ? "grid grid-cols-4 gap-1 sm:flex" : "grid grid-cols-4 gap-1"}>{children}</div>;
}

function MiniButton({ label, icon: Icon, onClick, disabled, danger }: { label: string; icon: LucideIcon; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={danger ? "inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-red-500/10 px-2 text-xs font-black text-red-200 transition hover:bg-red-500/20 disabled:opacity-25" : "inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-white/[0.055] px-2 text-xs font-black text-white/65 transition hover:bg-amber-300/15 hover:text-[#f3cf73] disabled:opacity-25"}><Icon className="size-3.5" /> <span className="hidden sm:inline">{label}</span></button>;
}
