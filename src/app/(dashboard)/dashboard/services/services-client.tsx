"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuilderNotice } from "@/components/dashboard/builder-primitives";
import type { PackageData } from "@/components/dashboard/package-editor";
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

type ExtraData = {
  id: string;
  name: string;
  priceAmount: number;
  currency: string;
  iconKey: string | null;
  isActive: boolean;
  sortOrder: number;
};

type ServicesClientProps = {
  packages: (PackageData & { sortOrder: number })[];
  extras: ExtraData[];
  created?: string;
  error?: string;
};

function money(amount: number, currency: string): string {
  return `${amount.toLocaleString("ar-EG")} ${currency || "EGP"}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function featuresToText(features: string[]): string {
  return features.join("\n");
}

function featuresToJson(formData: FormData): void {
  const raw = String(formData.get("featuresText") ?? "");
  const features = raw.split("\n").map((item) => item.trim()).filter(Boolean);
  formData.set("features", JSON.stringify(features));
}

export function ServicesClient({ packages, extras, created, error }: ServicesClientProps) {
  const [query, setQuery] = useState("");
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [confirmDeletePackageId, setConfirmDeletePackageId] = useState<string | null>(null);
  const [confirmDeleteExtraId, setConfirmDeleteExtraId] = useState<string | null>(null);

  const q = normalize(query);
  const filteredPackages = useMemo(() => {
    if (!q) return packages;
    return packages.filter((pkg) => normalize(`${pkg.name} ${pkg.subtitle ?? ""} ${pkg.features.join(" ")}`).includes(q));
  }, [packages, q]);
  const filteredExtras = useMemo(() => {
    if (!q) return extras;
    return extras.filter((extra) => normalize(`${extra.name} ${extra.iconKey ?? ""}`).includes(q));
  }, [extras, q]);

  const activePackages = packages.filter((pkg) => pkg.isActive).length;
  const activeExtras = extras.filter((extra) => extra.isActive).length;
  const highlighted = packages.filter((pkg) => pkg.isHighlighted).length;
  const notice = error
    ? { tone: "error" as const, title: "مقدرناش نحفظ التعديل", description: decodeURIComponent(error) }
    : created
      ? { tone: "success" as const, title: created === "package" ? "تم إنشاء الباقة" : "تم إنشاء الخدمة الإضافية", description: "راجع الترتيب والتفعيل قبل ما تشارك الموقع." }
      : null;

  function submitPackageUpdate(formData: FormData) {
    featuresToJson(formData);
    updatePackageAction(formData);
    setEditingPackageId(null);
  }

  function duplicatePackage(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    duplicatePackageAction(fd);
  }

  function deletePackage(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    deletePackageAction(fd);
    setConfirmDeletePackageId(null);
  }

  function reorderPackage(id: string, direction: "up" | "down") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("direction", direction);
    reorderPackageAction(fd);
  }

  function submitExtraUpdate(formData: FormData) {
    updateExtraAction(formData);
    setEditingExtraId(null);
  }

  function duplicateExtra(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    duplicateExtraAction(fd);
  }

  function deleteExtra(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    deleteExtraAction(fd);
    setConfirmDeleteExtraId(null);
  }

  function reorderExtra(id: string, direction: "up" | "down") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("direction", direction);
    reorderExtraAction(fd);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4">
      <section className="rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.14),transparent_36%),rgba(255,255,255,0.035)] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">الباقات والأسعار</p>
            <h1 className="mt-1 text-2xl font-black text-[#fff7e8] sm:text-3xl">خلي أسعارك واضحة بدل الرسائل المتكررة</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">
              اعمل باقات سهلة المقارنة، وضيف خدمات اختيارية زي الفيديو، الألبوم المطبوع، أو جلسة إضافية.
            </p>
          </div>
          <div className="grid gap-2 sm:flex">
            <Button variant="luxury" className="min-h-11 rounded-2xl font-black" onClick={() => setShowPackageForm(true)}>
              <Plus className="size-4" aria-hidden />
              باقة جديدة
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-2xl border-white/10 bg-white/[0.04] font-black text-white" onClick={() => setShowExtraForm(true)}>
              <Sparkles className="size-4" aria-hidden />
              خدمة إضافية
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatCard label="باقات مفعلة" value={activePackages} />
          <StatCard label="خدمات إضافية" value={activeExtras} />
          <StatCard label="مميزة" value={highlighted} />
        </div>
      </section>

      {notice ? <BuilderNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      <section className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث في الباقات أو الخدمات..."
            className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 pr-10 pl-3 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-amber-300/40"
          />
        </label>

        {showPackageForm ? <NewPackagePanel onCancel={() => setShowPackageForm(false)} /> : null}
        {showExtraForm ? <NewExtraPanel onCancel={() => setShowExtraForm(false)} /> : null}
      </section>

      <section className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
        <SectionTitle icon={Package} title="الباقات الأساسية" description="دي العروض الرئيسية اللي العميل يختار منها." />
        {packages.length === 0 ? (
          <EmptyState title="ابدأ بأول باقة" description="مثلاً: باقة خطوبة، باقة زفاف، باقة منتجات. خلي الاسم والسعر واضحين." action="إنشاء باقة" onClick={() => setShowPackageForm(true)} />
        ) : filteredPackages.length === 0 ? (
          <NoResults />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredPackages.map((pkg, index) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                editing={editingPackageId === pkg.id}
                confirmingDelete={confirmDeletePackageId === pkg.id}
                isFirst={index === 0}
                isLast={index === filteredPackages.length - 1}
                onEdit={() => setEditingPackageId(pkg.id)}
                onCancelEdit={() => setEditingPackageId(null)}
                onSubmitUpdate={submitPackageUpdate}
                onDuplicate={() => duplicatePackage(pkg.id)}
                onDelete={() => setConfirmDeletePackageId(pkg.id)}
                onCancelDelete={() => setConfirmDeletePackageId(null)}
                onConfirmDelete={() => deletePackage(pkg.id)}
                onReorder={(direction) => reorderPackage(pkg.id, direction)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
        <SectionTitle icon={BriefcaseBusiness} title="الخدمات الإضافية" description="خدمات اختيارية يضيفها العميل فوق الباقة الأساسية." />
        {extras.length === 0 ? (
          <EmptyState title="ضيف أول خدمة إضافية" description="زي ألبوم مطبوع، فيديو قصير، ساعة تصوير إضافية، أو طباعة صور." action="إضافة خدمة" onClick={() => setShowExtraForm(true)} />
        ) : filteredExtras.length === 0 ? (
          <NoResults />
        ) : (
          <div className="grid gap-2">
            {filteredExtras.map((extra, index) => (
              <ExtraRow
                key={extra.id}
                extra={extra}
                editing={editingExtraId === extra.id}
                confirmingDelete={confirmDeleteExtraId === extra.id}
                isFirst={index === 0}
                isLast={index === filteredExtras.length - 1}
                onEdit={() => setEditingExtraId(extra.id)}
                onCancelEdit={() => setEditingExtraId(null)}
                onSubmitUpdate={submitExtraUpdate}
                onDuplicate={() => duplicateExtra(extra.id)}
                onDelete={() => setConfirmDeleteExtraId(extra.id)}
                onCancelDelete={() => setConfirmDeleteExtraId(null)}
                onConfirmDelete={() => deleteExtra(extra.id)}
                onReorder={(direction) => reorderExtra(extra.id, direction)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function NewPackagePanel({ onCancel }: { onCancel: () => void }) {
  return (
    <form action={addPackageAction} className="grid gap-3 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3 lg:grid-cols-2">
      <Field label="اسم الباقة"><Input name="name" placeholder="مثلاً: باقة الزفاف الأساسية" required /></Field>
      <Field label="السعر"><Input name="priceAmount" type="number" min={1} placeholder="15000" required /></Field>
      <Field label="وصف قصير"><Input name="subtitle" placeholder="مناسبة لتغطية يوم الزفاف" /></Field>
      <label className="grid gap-1.5 lg:row-span-2">
        <span className="text-xs font-black text-white/55">مميزات الباقة — كل ميزة في سطر</span>
        <textarea name="features" rows={5} placeholder="تصوير 6 ساعات&#10;تسليم 300 صورة معدلة&#10;ألبوم Online" className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-white/28 focus:border-amber-300/40" />
      </label>
      <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65">
        <input type="checkbox" name="isHighlighted" className="size-4 accent-[#f3cf73]" />
        خليها الباقة المميزة
      </label>
      <div className="grid grid-cols-2 gap-2 lg:col-span-2">
        <Button type="submit" variant="luxury" className="rounded-2xl font-black">حفظ الباقة</Button>
        <Button type="button" variant="ghost" className="rounded-2xl" onClick={onCancel}>إلغاء</Button>
      </div>
    </form>
  );
}

function NewExtraPanel({ onCancel }: { onCancel: () => void }) {
  return (
    <form action={addExtraAction} className="grid gap-3 rounded-2xl border border-white/10 bg-black/18 p-3 sm:grid-cols-[1fr_0.5fr_0.5fr_auto] sm:items-end">
      <Field label="اسم الخدمة"><Input name="name" placeholder="مثلاً: فيديو Reel" required /></Field>
      <Field label="السعر"><Input name="priceAmount" type="number" min={1} placeholder="2500" required /></Field>
      <Field label="رمز اختياري"><Input name="iconKey" placeholder="video" /></Field>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button type="submit" variant="luxury" className="rounded-2xl font-black">إضافة</Button>
        <Button type="button" variant="ghost" className="rounded-2xl" onClick={onCancel}>إلغاء</Button>
      </div>
    </form>
  );
}

function PackageCard({
  pkg,
  editing,
  confirmingDelete,
  isFirst,
  isLast,
  onEdit,
  onCancelEdit,
  onSubmitUpdate,
  onDuplicate,
  onDelete,
  onCancelDelete,
  onConfirmDelete,
  onReorder,
}: {
  pkg: PackageData & { sortOrder: number };
  editing: boolean;
  confirmingDelete: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSubmitUpdate: (formData: FormData) => void;
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
    return (
      <form action={onSubmitUpdate} className="grid gap-3 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3">
        <input type="hidden" name="id" value={pkg.id} />
        <input type="hidden" name="features" value="[]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="اسم الباقة"><Input name="name" defaultValue={pkg.name} required /></Field>
          <Field label="السعر"><Input name="priceAmount" type="number" min={0} defaultValue={pkg.priceAmount} /></Field>
          <Field label="العملة"><Input name="currency" defaultValue={pkg.currency} /></Field>
          <Field label="وصف قصير"><Input name="subtitle" defaultValue={pkg.subtitle ?? ""} /></Field>
        </div>
        <label className="grid gap-1.5">
          <span className="text-xs font-black text-white/55">المميزات — كل ميزة في سطر</span>
          <textarea name="featuresText" rows={5} defaultValue={featuresToText(pkg.features)} className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-white outline-none focus:border-amber-300/40" />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65"><input type="checkbox" name="isHighlighted" defaultChecked={pkg.isHighlighted} className="size-4 accent-[#f3cf73]" /> مميزة</label>
          <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65"><input type="checkbox" name="isActive" defaultChecked={pkg.isActive} className="size-4 accent-[#f3cf73]" /> ظاهرة للعميل</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" variant="luxury" className="rounded-2xl font-black">حفظ</Button>
          <Button type="button" variant="ghost" className="rounded-2xl" onClick={onCancelEdit}>إلغاء</Button>
        </div>
      </form>
    );
  }

  return (
    <article className={pkg.isActive ? "grid gap-3 rounded-2xl border border-white/10 bg-black/16 p-4" : "grid gap-3 rounded-2xl border border-white/8 bg-black/10 p-4 opacity-60"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#fff7e8]">{pkg.name}</h3>
            {pkg.isHighlighted ? <span className="rounded-full bg-amber-300/12 px-2.5 py-1 text-[0.68rem] font-black text-[#f3cf73]">مميزة</span> : null}
            <span className={pkg.isActive ? "rounded-full bg-emerald-300/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : "rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-black text-white/45"}>{pkg.isActive ? "ظاهرة" : "مخفية"}</span>
          </div>
          {pkg.subtitle ? <p className="mt-1 text-sm font-bold leading-6 text-white/48">{pkg.subtitle}</p> : null}
        </div>
        <p className="shrink-0 rounded-2xl bg-amber-300/10 px-3 py-2 text-sm font-black text-[#f3cf73]">{money(pkg.priceAmount, pkg.currency)}</p>
      </div>

      {pkg.features.length > 0 ? (
        <ul className="grid gap-1.5 text-sm font-bold text-white/58">
          {pkg.features.slice(0, 5).map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" />{feature}</li>)}
        </ul>
      ) : <p className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm font-bold text-white/38">مفيش مميزات مكتوبة. ضيف نقاط واضحة تساعد العميل يختار.</p>}

      <ActionBar>
        <MiniButton onClick={onEdit} label="تعديل" icon={Eye} />
        <MiniButton onClick={onDuplicate} label="نسخ" icon={Copy} />
        <MiniButton onClick={() => onReorder("up")} label="فوق" icon={ArrowUp} disabled={isFirst} />
        <MiniButton onClick={() => onReorder("down")} label="تحت" icon={ArrowDown} disabled={isLast} />
        <MiniButton onClick={onDelete} label="حذف" icon={Trash2} danger />
      </ActionBar>
    </article>
  );
}

function ExtraRow({
  extra,
  editing,
  confirmingDelete,
  isFirst,
  isLast,
  onEdit,
  onCancelEdit,
  onSubmitUpdate,
  onDuplicate,
  onDelete,
  onCancelDelete,
  onConfirmDelete,
  onReorder,
}: {
  extra: ExtraData;
  editing: boolean;
  confirmingDelete: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSubmitUpdate: (formData: FormData) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onReorder: (direction: "up" | "down") => void;
}) {
  if (confirmingDelete) return <ConfirmDelete title={`تحذف خدمة “${extra.name}”؟`} onConfirm={onConfirmDelete} onCancel={onCancelDelete} />;

  if (editing) {
    return (
      <form action={onSubmitUpdate} className="grid gap-2 rounded-2xl border border-amber-300/18 bg-amber-300/8 p-3 sm:grid-cols-[1fr_0.5fr_0.5fr_0.5fr_auto] sm:items-end">
        <input type="hidden" name="id" value={extra.id} />
        <Field label="الاسم"><Input name="name" defaultValue={extra.name} required /></Field>
        <Field label="السعر"><Input name="priceAmount" type="number" min={0} defaultValue={extra.priceAmount} /></Field>
        <Field label="العملة"><Input name="currency" defaultValue={extra.currency} /></Field>
        <Field label="الرمز"><Input name="iconKey" defaultValue={extra.iconKey ?? ""} /></Field>
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65"><input type="checkbox" name="isActive" defaultChecked={extra.isActive} className="size-4 accent-[#f3cf73]" /> ظاهرة</label>
        <div className="grid grid-cols-2 gap-2 sm:col-span-full">
          <Button type="submit" variant="luxury" className="rounded-2xl font-black">حفظ</Button>
          <Button type="button" variant="ghost" className="rounded-2xl" onClick={onCancelEdit}>إلغاء</Button>
        </div>
      </form>
    );
  }

  return (
    <article className={extra.isActive ? "grid gap-3 rounded-2xl border border-white/10 bg-black/16 p-3 sm:grid-cols-[1fr_auto] sm:items-center" : "grid gap-3 rounded-2xl border border-white/8 bg-black/10 p-3 opacity-60 sm:grid-cols-[1fr_auto] sm:items-center"}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><BriefcaseBusiness className="size-4" /></span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[#fff7e8]">{extra.name}</h3>
          <p className="text-xs font-bold text-white/42">{money(extra.priceAmount, extra.currency)} {extra.iconKey ? `· ${extra.iconKey}` : ""}</p>
        </div>
      </div>
      <ActionBar compact>
        <MiniButton onClick={onEdit} label="تعديل" icon={extra.isActive ? Eye : EyeOff} />
        <MiniButton onClick={onDuplicate} label="نسخ" icon={Copy} />
        <MiniButton onClick={() => onReorder("up")} label="فوق" icon={ArrowUp} disabled={isFirst} />
        <MiniButton onClick={() => onReorder("down")} label="تحت" icon={ArrowDown} disabled={isLast} />
        <MiniButton onClick={onDelete} label="حذف" icon={Trash2} danger />
      </ActionBar>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black text-white/55">{label}</span>{children}</label>;
}

function SectionTitle({ icon: Icon, title, description }: { icon: typeof Package; title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Icon className="size-5" /></span><div><h2 className="text-base font-black text-[#fff7e8]">{title}</h2><p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p></div></div>;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/8 bg-black/18 p-3"><p className="text-xl font-black text-[#fff7e8]">{value}</p><p className="text-[0.72rem] font-black text-white/38">{label}</p></div>;
}

function EmptyState({ title, description, action, onClick }: { title: string; description: string; action: string; onClick: () => void }) {
  return <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-white/14 bg-black/15 p-8 text-center"><Package className="size-10 text-white/28" /><div><h3 className="text-base font-black text-[#fff7e8]">{title}</h3><p className="mt-1 max-w-sm text-sm font-bold leading-7 text-white/45">{description}</p></div><Button variant="luxury" className="rounded-2xl font-black" onClick={onClick}><Plus className="size-4" />{action}</Button></div>;
}

function NoResults() {
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-8 text-center text-sm font-bold text-white/45">مفيش نتائج بالبحث ده. جرّب كلمة تانية.</div>;
}

function ConfirmDelete({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return <div className="grid gap-3 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-center"><p className="text-sm font-black text-[#fff7e8]">{title}</p><p className="text-xs font-bold text-white/45">التغيير هيختفي من الموقع بعد الحفظ.</p><div className="grid grid-cols-2 gap-2"><Button variant="luxury" onClick={onConfirm}>حذف</Button><Button variant="ghost" onClick={onCancel}>إلغاء</Button></div></div>;
}

function ActionBar({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return <div className={compact ? "grid grid-cols-5 gap-1 sm:flex" : "grid grid-cols-5 gap-1"}>{children}</div>;
}

function MiniButton({ label, icon: Icon, onClick, disabled, danger }: { label: string; icon: typeof Eye; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={danger ? "inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-red-500/10 px-2 text-xs font-black text-red-200 transition hover:bg-red-500/20 disabled:opacity-25" : "inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-white/[0.055] px-2 text-xs font-black text-white/65 transition hover:bg-amber-300/15 hover:text-[#f3cf73] disabled:opacity-25"}><Icon className="size-3.5" /> <span className="hidden sm:inline">{label}</span></button>;
}
