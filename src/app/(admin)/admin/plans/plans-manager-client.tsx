"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Archive, BadgeCheck, Check, ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { archivePlanAction, reorderPlanAction, savePlanAction, togglePlanAction } from "@/app/(admin)/admin/plans/actions";
import {
  AdminActionMenu,
  AdminBanner,
  AdminEmptyState,
  AdminMetricCard,
  AdminMetricsGrid,
  AdminStatusBadge,
  adminActionItemClass,
} from "@/components/admin/admin-workspace-primitives";

const inputClass = "min-h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-3 text-sm font-extrabold text-[#fff7e8] outline-none placeholder:text-white/25 focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/10";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  priceAmount: number;
  currency: string;
  billingInterval: string;
  features: unknown;
  isActive: boolean;
  sortOrder: number;
  _count: { subscriptions: number; paymentRequests: number };
};

type Props = {
  plans: PlanRow[];
  metrics: { totalPlans: number; activePlans: number; subscriptionCount: number; paymentCount: number };
  banner: { tone: "success" | "danger"; text: string } | null;
};

type VisualFeatures = {
  description: string;
  badgeLabel: string;
  isPopular: boolean;
  isComingSoon: boolean;
  storageLabel: string;
  photoLimitLabel: string;
  ctaLabel: string;
  highlightText: string;
  featureLines: string[];
};

const defaults: VisualFeatures = {
  description: "باقة مناسبة لإدارة موقع تصوير احترافي بسهولة.",
  badgeLabel: "",
  isPopular: false,
  isComingSoon: false,
  storageLabel: "",
  photoLimitLabel: "",
  ctaLabel: "اختيار الباقة",
  highlightText: "",
  featureLines: ["موقع تصوير جاهز", "لوحة تحكم سهلة", "معرض صور احترافي"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFrom(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function boolFrom(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function normalizeFeatureLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => stringFrom(item).trim()).filter(Boolean);
  if (!isRecord(value)) return [];
  const direct = value.featureLines ?? value.features ?? value.lines ?? value.items;
  if (Array.isArray(direct)) return direct.map((item) => stringFrom(item).trim()).filter(Boolean);
  const generated: string[] = [];
  if (value.themes != null) generated.push(`${stringFrom(value.themes)} قوالب متاحة`);
  if (value.storage != null) generated.push(`${stringFrom(value.storage)} مساحة تخزين`);
  if (value.galleryImages != null) generated.push(`${stringFrom(value.galleryImages)} صورة في المعرض`);
  if (value.dashboard === true) generated.push("لوحة تحكم للعميل");
  if (value.publicSite === true) generated.push("موقع عام قابل للنشر");
  if (value.customDomain === true) generated.push("ربط دومين خاص");
  if (value.manualActivation === true) generated.push("تفعيل يدوي بعد مراجعة الدفع");
  return generated;
}

function normalizeFeatures(value: unknown): VisualFeatures {
  if (Array.isArray(value)) return { ...defaults, featureLines: normalizeFeatureLines(value) };
  if (!isRecord(value)) return defaults;
  const featureLines = normalizeFeatureLines(value);
  return {
    description: stringFrom(value.description ?? value.summary) || defaults.description,
    badgeLabel: stringFrom(value.badgeLabel ?? value.badge ?? value.ribbon),
    isPopular: boolFrom(value.isPopular ?? value.popular ?? value.recommended),
    isComingSoon: value.isComingSoon === true || value.isComingSoon === "true",
    storageLabel: stringFrom(value.storageLabel ?? (value.storage ? `${value.storage} مساحة تخزين` : "")),
    photoLimitLabel: stringFrom(value.photoLimitLabel ?? (value.galleryImages ? `${value.galleryImages} صورة` : "")),
    ctaLabel: stringFrom(value.ctaLabel) || defaults.ctaLabel,
    highlightText: stringFrom(value.highlightText),
    featureLines: featureLines.length > 0 ? featureLines : defaults.featureLines,
  };
}

function intervalLabel(value: string) {
  if (value === "yearly") return "سنوي";
  if (value === "lifetime") return "مدى الحياة";
  if (value === "unspecified" || value === "unknown") return "";
  return "شهري";
}

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString("ar-EG")} ${currency}`;
}

export function PlansManagerClient({ plans, metrics, banner }: Props) {
  const [editor, setEditor] = useState<"create" | string | null>(plans.length === 0 ? "create" : null);
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.sortOrder - b.sortOrder || a.priceAmount - b.priceAmount),
    [plans],
  );
  const selectedPlan = editor && editor !== "create" ? plans.find((plan) => plan.id === editor) ?? null : null;

  return (
    <div className="grid gap-5">
      {banner ? <AdminBanner tone={banner.tone}>{banner.text}</AdminBanner> : null}

      <AdminMetricsGrid>
        <AdminMetricCard label="كل الباقات" value={metrics.totalPlans} />
        <AdminMetricCard label="الباقات الظاهرة" value={metrics.activePlans} tone="gold" />
        <AdminMetricCard label="الاشتراكات" value={metrics.subscriptionCount} />
        <AdminMetricCard label="طلبات الدفع" value={metrics.paymentCount} />
      </AdminMetricsGrid>

      <section className="border-y border-white/10 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-[#fff7e8]">قائمة الباقات</h2>
            <p className="mt-1 text-sm font-bold text-white/45">كل باقة تظهر مرة واحدة، والتعديل لا يفتح إلا عند الطلب.</p>
          </div>
          <button
            type="button"
            onClick={() => setEditor(editor === "create" ? null : "create")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] transition hover:bg-[#f8da8a]"
          >
            {editor === "create" ? <X className="size-4" /> : <Plus className="size-4" />}
            {editor === "create" ? "إغلاق" : "إضافة باقة جديدة"}
          </button>
        </div>
      </section>

      <div className={editor ? "grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]" : "grid gap-4"}>
        <section aria-label="قائمة الباقات" className="grid gap-3">
          {sortedPlans.length === 0 ? (
            <AdminEmptyState
              title="لا توجد باقات بعد"
              description="أدخل بيانات أول باقة من النموذج المفتوح."
              icon={BadgeCheck}
            />
          ) : (
            sortedPlans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                order={index + 1}
                isFirst={index === 0}
                isLast={index === sortedPlans.length - 1}
                selected={editor === plan.id}
                onEdit={() => setEditor(plan.id)}
              />
            ))
          )}
        </section>

        {editor ? (
          <section
            role="region"
            aria-label={editor === "create" ? "إنشاء باقة جديدة" : `تعديل ${selectedPlan?.name ?? "الباقة"}`}
            className="overflow-hidden rounded-2xl border border-amber-300/20 bg-white/[0.035] xl:sticky xl:top-5"
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/8 px-4 py-3">
              <div>
                <p className="text-[0.68rem] font-black text-[#f3cf73]">{editor === "create" ? "باقة جديدة" : "تعديل الباقة"}</p>
                <h2 className="mt-1 text-base font-black text-[#fff7e8]">
                  {editor === "create" ? "إنشاء باقة جديدة" : selectedPlan?.name}
                </h2>
              </div>
              <button type="button" onClick={() => setEditor(null)} aria-label="إغلاق المحرر" className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white">
                <X className="size-4" />
              </button>
            </header>
            <div className="p-4">
              <PlanEditor key={editor} plan={selectedPlan ?? undefined} submitLabel={editor === "create" ? "إنشاء الباقة" : "حفظ التعديلات"} />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function PlanCard({ plan, order, isFirst, isLast, selected, onEdit }: { plan: PlanRow; order: number; isFirst: boolean; isLast: boolean; selected: boolean; onEdit: () => void }) {
  const visual = normalizeFeatures(plan.features);
  const badge = visual.isPopular ? visual.badgeLabel || "الأكثر طلبًا" : visual.badgeLabel;
  const isComingSoon = visual.isComingSoon;

  return (
    <article className={`rounded-2xl border p-4 ${isComingSoon ? "border-white/6 bg-white/[0.015] opacity-70" : selected ? "border-amber-300/35 bg-amber-300/[0.07]" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black text-[#fff7e8]">{plan.name}</h2>
            {badge ? <AdminStatusBadge label={badge} tone="gold" /> : null}
            {isComingSoon ? <AdminStatusBadge label="قريبًا" tone="neutral" /> : null}
            <AdminStatusBadge label={plan.isActive ? "ظاهرة" : "مخفي"} tone={plan.isActive ? "success" : "neutral"} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-white/50">{visual.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-white/40">
            {isComingSoon ? (
              <strong className="text-base font-black text-white/40">قريبًا</strong>
            ) : (
              <strong className="text-base font-black text-[#f3cf73]">{formatMoney(plan.priceAmount, plan.currency)}{intervalLabel(plan.billingInterval) ? ` / ${intervalLabel(plan.billingInterval)}` : ""}</strong>
            )}
            <span>الترتيب: {order}</span>
            <span>{plan._count.subscriptions.toLocaleString("ar-EG")} مشترك</span>
            <span>{plan._count.paymentRequests.toLocaleString("ar-EG")} طلب دفع</span>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {visual.featureLines.slice(0, 3).map((feature, index) => (
              <li key={`${feature}-${index}`} className="inline-flex items-center gap-1 rounded-lg bg-black/15 px-2 py-1 text-[0.68rem] font-bold text-white/55">
                <Check className="size-3 text-emerald-300" />{feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <form action={reorderPlanAction}>
              <input type="hidden" name="id" value={plan.id} />
              <input type="hidden" name="direction" value="up" />
              <button disabled={isFirst} aria-label={`نقل ${plan.name} لأعلى`} className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:pointer-events-none">
                <ChevronUp className="size-4" />
              </button>
            </form>
            <form action={reorderPlanAction}>
              <input type="hidden" name="id" value={plan.id} />
              <input type="hidden" name="direction" value="down" />
              <button disabled={isLast} aria-label={`نقل ${plan.name} لأسفل`} className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white disabled:opacity-25 disabled:pointer-events-none">
                <ChevronDown className="size-4" />
              </button>
            </form>
          </div>
          <button type="button" aria-label={`تعديل ${plan.name}`} onClick={onEdit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] hover:bg-[#f8da8a]">
            <Pencil className="size-4" /> تعديل
          </button>
          <AdminActionMenu>
            <form action={togglePlanAction}>
              <input type="hidden" name="id" value={plan.id} />
              <button className={`${adminActionItemClass} text-white/70`}>
                {plan.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {plan.isActive ? "إخفاء الباقة" : "إظهار الباقة"}
              </button>
            </form>
            <form action={archivePlanAction} onSubmit={(event) => { if (!window.confirm("سيتم إخفاء الباقة وأرشفتها. هل تريد المتابعة؟")) event.preventDefault(); }}>
              <input type="hidden" name="id" value={plan.id} />
              <button aria-label={`أرشفة ${plan.name}`} className={`${adminActionItemClass} text-red-300`}>
                <Archive className="size-4" /> أرشفة الباقة
              </button>
            </form>
          </AdminActionMenu>
        </div>
      </div>
    </article>
  );
}

function PlanEditor({ plan, submitLabel }: { plan?: PlanRow; submitLabel: string }) {
  const visual = normalizeFeatures(plan?.features);
  const [lines, setLines] = useState<string[]>(visual.featureLines.length > 0 ? visual.featureLines : [""]);
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);

  return (
    <form action={savePlanAction} className="grid gap-3">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}
      {plan ? <input type="hidden" name="code" value={plan.code} /> : null}
      <input type="hidden" name="isActive" value={String(isActive)} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="اسم الباقة"><input name="name" required defaultValue={plan?.name ?? ""} className={inputClass} /></Field>
        <Field label="السعر"><input name="priceAmount" required type="number" min="0" step="1" defaultValue={plan?.priceAmount ?? 0} className={inputClass} /></Field>
        <Field label="ترتيب الظهور"><input name="sortOrder" type="number" min="0" step="1" defaultValue={plan?.sortOrder ?? 0} className={inputClass} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="العملة"><select name="currency" defaultValue={plan?.currency ?? "EGP"} className={inputClass}><option value="EGP">EGP</option><option value="USD">USD</option><option value="EUR">EUR</option></select></Field>
        <Field label="مدة الدفع"><select name="billingInterval" defaultValue={plan?.billingInterval ?? "monthly"} className={inputClass}><option value="monthly">شهري</option><option value="yearly">سنوي</option><option value="lifetime">مدى الحياة</option><option value="unspecified">غير محدد</option></select></Field>
        <Field label="نص الزر"><input name="ctaLabel" defaultValue={visual.ctaLabel} className={inputClass} /></Field>
      </div>
      <Field label="وصف مختصر"><textarea name="description" rows={3} defaultValue={visual.description} className={`${inputClass} py-3`} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="التخزين"><input name="storageLabel" defaultValue={visual.storageLabel} className={inputClass} /></Field>
        <Field label="عدد الصور"><input name="photoLimitLabel" defaultValue={visual.photoLimitLabel} className={inputClass} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="الشارة"><input name="badgeLabel" defaultValue={visual.badgeLabel} className={inputClass} /></Field>
        <Field label="ملاحظة مميزة"><input name="highlightText" defaultValue={visual.highlightText} className={inputClass} /></Field>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-[#fff7e8]">سطور المميزات</h3>
          <button type="button" onClick={() => setLines((items) => [...items, ""])} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-black text-[#f3cf73]"><Plus className="size-3.5" /> إضافة سطر</button>
        </div>
        <div className="mt-3 grid gap-2">
          {lines.map((line, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
              <input name="featureLines" value={line} onChange={(event) => setLines((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className={inputClass} />
              <button type="button" onClick={() => setLines((items) => items.length <= 1 ? [""] : items.filter((_, itemIndex) => itemIndex !== index))} className="grid size-11 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-3 text-sm font-bold text-white/68">
          <input name="isPopular" type="checkbox" defaultChecked={visual.isPopular} /> إضافة شعار الأكثر طلبًا
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] px-3 text-sm font-bold text-amber-200/80">
          <input name="isComingSoon" type="checkbox" defaultChecked={visual.isComingSoon} /> الباقة قريبًا (غير قابلة للشراء)
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-3 text-sm font-bold text-white/68">
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> الباقة ظاهرة للمستخدمين
        </label>
      </div>

      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] hover:bg-[#f8da8a]">
        <Save className="size-4" /> {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black text-white/42">{label}</span>{children}</label>;
}
