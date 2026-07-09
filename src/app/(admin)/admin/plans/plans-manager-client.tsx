"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Archive, BadgeCheck, Check, Flame, Plus, Save, Sparkles, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";

import { archivePlanAction, savePlanAction, togglePlanAction } from "@/app/(admin)/admin/plans/actions";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  priceAmount: number;
  currency: string;
  billingInterval: string;
  features: unknown;
  isActive: boolean;
  _count: { subscriptions: number; paymentRequests: number };
};

type PlansManagerClientProps = {
  plans: PlanRow[];
  metrics: {
    totalPlans: number;
    activePlans: number;
    subscriptionCount: number;
    paymentCount: number;
  };
  banner: { tone: "success" | "danger"; text: string } | null;
};

type VisualFeatures = {
  description: string;
  badgeLabel: string;
  isPopular: boolean;
  storageLabel: string;
  photoLimitLabel: string;
  ctaLabel: string;
  highlightText: string;
  featureLines: string[];
};

const defaultFeatures: VisualFeatures = {
  description: "باقة مناسبة لإدارة موقع تصوير احترافي بسهولة.",
  badgeLabel: "",
  isPopular: false,
  storageLabel: "",
  photoLimitLabel: "",
  ctaLabel: "اختيار الباقة",
  highlightText: "",
  featureLines: ["موقع تصوير جاهز", "لوحة تحكم سهلة", "معرض صور احترافي"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFrom(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function boolFrom(value: unknown): boolean {
  return value === true || value === "true" || value === "on";
}

function normalizeFeatureLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => stringFrom(item).trim()).filter(Boolean);
  }

  if (!isRecord(value)) return [];

  const directLines = value.featureLines ?? value.features ?? value.lines ?? value.items;
  if (Array.isArray(directLines)) {
    return directLines.map((item) => stringFrom(item).trim()).filter(Boolean);
  }

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
  if (Array.isArray(value)) {
    return { ...defaultFeatures, featureLines: normalizeFeatureLines(value) };
  }

  if (!isRecord(value)) return defaultFeatures;

  const featureLines = normalizeFeatureLines(value);

  return {
    description: stringFrom(value.description ?? value.summary) || defaultFeatures.description,
    badgeLabel: stringFrom(value.badgeLabel ?? value.badge ?? value.ribbon),
    isPopular: boolFrom(value.isPopular ?? value.popular ?? value.recommended),
    storageLabel: stringFrom(value.storageLabel ?? (value.storage ? `${value.storage} مساحة تخزين` : "")),
    photoLimitLabel: stringFrom(value.photoLimitLabel ?? (value.galleryImages ? `${value.galleryImages} صورة` : "")),
    ctaLabel: stringFrom(value.ctaLabel) || defaultFeatures.ctaLabel,
    highlightText: stringFrom(value.highlightText),
    featureLines: featureLines.length > 0 ? featureLines : defaultFeatures.featureLines,
  };
}

function intervalLabel(value: string) {
  if (value === "yearly") return "سنوي";
  if (value === "lifetime") return "مدى الحياة";
  return "شهري";
}

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString("ar-EG")} ${currency}`;
}

export function PlansManagerClient({ plans, metrics, banner }: PlansManagerClientProps) {
  const [showCreate, setShowCreate] = useState(plans.length === 0);
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.priceAmount - b.priceAmount), [plans]);

  return (
    <div className="grid gap-5">
      <PlanFormStyles />
      {banner ? (
        <div className={banner.tone === "danger" ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300" : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"}>
          {banner.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="كل الباقات" value={metrics.totalPlans} />
        <Metric label="باقات ظاهرة" value={metrics.activePlans} accent />
        <Metric label="اشتراكات" value={metrics.subscriptionCount} />
        <Metric label="طلبات دفع" value={metrics.paymentCount} />
      </section>

      <section className="rounded-3xl border border-amber-500/18 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.14),transparent_34%),rgba(255,255,255,0.04)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[0.68rem] font-black text-[#f3cf73]">
              <Sparkles className="size-3.5" /> إدارة مرئية بدون أكواد
            </span>
            <h2 className="mt-3 text-xl font-black text-[#fff7e8]">الباقات كما تظهر للعميل</h2>
            <p className="mt-1 max-w-2xl text-sm font-bold leading-7 text-white/52">
              عدّل الاسم، السعر، الوصف، الشارة، وسطور المميزات من خانات عادية. لا يوجد JSON أو أكواد داخل واجهة الإدارة.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-500/45 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5"
          >
            {showCreate ? <X className="size-4" /> : <Plus className="size-4" />}
            {showCreate ? "إغلاق إنشاء باقة" : "إضافة باقة جديدة"}
          </button>
        </div>

        {showCreate ? (
          <div className="mt-5 rounded-3xl border border-white/10 bg-black/18 p-4">
            <PlanEditor submitLabel="إنشاء الباقة" />
          </div>
        ) : null}
      </section>

      {sortedPlans.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-16 text-center">
          <BadgeCheck className="mb-3 size-10 text-white/20" />
          <h2 className="text-lg font-black text-white/75">لا توجد باقات بعد</h2>
          <p className="mt-1 max-w-xl text-sm font-bold leading-7 text-white/42">ابدأ بإضافة أول باقة، وستظهر هنا بنفس شكلها الذي يراه العميل.</p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {sortedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className={accent ? "text-2xl font-black text-amber-200" : "text-2xl font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </div>
  );
}

function PlanCard({ plan }: { plan: PlanRow }) {
  const visual = normalizeFeatures(plan.features);
  const badge = visual.isPopular ? visual.badgeLabel || "الأكثر طلبًا" : visual.badgeLabel;

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/10">
      <div className="grid gap-4 p-4 lg:grid-cols-[0.95fr_1.05fr] lg:p-5">
        <div className="rounded-3xl border border-amber-500/20 bg-[radial-gradient(circle_at_top,rgba(243,207,115,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {badge ? <span className="inline-flex items-center gap-1 rounded-full bg-[#f3cf73] px-3 py-1 text-[0.7rem] font-black text-[#17120a]"><Flame className="size-3" />{badge}</span> : null}
                <span className={plan.isActive ? "rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : "rounded-full bg-white/8 px-2.5 py-1 text-[0.68rem] font-black text-white/38"}>{plan.isActive ? "ظاهرة" : "مخفية"}</span>
              </div>
              <h2 className="mt-4 text-2xl font-black text-[#fff7e8]">{plan.name}</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-white/55">{visual.description}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-3xl font-black text-[#f3cf73]">{formatMoney(plan.priceAmount, plan.currency)}</p>
            <p className="mt-1 text-xs font-black text-white/40">/{intervalLabel(plan.billingInterval)}</p>
          </div>

          {(visual.storageLabel || visual.photoLimitLabel || visual.highlightText) ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {visual.storageLabel ? <MiniSpec label="التخزين" value={visual.storageLabel} /> : null}
              {visual.photoLimitLabel ? <MiniSpec label="الصور" value={visual.photoLimitLabel} /> : null}
              {visual.highlightText ? <MiniSpec label="ملاحظة" value={visual.highlightText} wide /> : null}
            </div>
          ) : null}

          <ul className="mt-5 grid gap-2">
            {visual.featureLines.map((feature, index) => (
              <li key={`${feature}-${index}`} className="flex items-start gap-2 text-sm font-bold leading-6 text-white/72">
                <Check className="mt-1 size-4 shrink-0 text-emerald-300" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button type="button" className="mt-5 h-11 w-full rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-sm font-black text-[#17120a]">
            {visual.ctaLabel || "اختيار الباقة"}
          </button>
        </div>

        <div className="grid content-start gap-3">
          <div className="grid grid-cols-2 gap-2">
            <form action={togglePlanAction}>
              <input type="hidden" name="id" value={plan.id} />
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 text-sm font-black text-amber-200 transition hover:bg-amber-500/20">
                {plan.isActive ? <ToggleLeft className="size-4" /> : <ToggleRight className="size-4" />}
                {plan.isActive ? "إخفاء من الموقع" : "إظهار في الموقع"}
              </button>
            </form>
            <form action={archivePlanAction}>
              <input type="hidden" name="id" value={plan.id} />
              <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 text-sm font-black text-red-300 transition hover:bg-red-500/20">
                <Archive className="size-4" /> أرشفة
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-white/8 bg-black/16 p-3 text-xs font-bold leading-6 text-white/42">
            مستخدمة في {plan._count.subscriptions.toLocaleString("ar-EG")} اشتراك · {plan._count.paymentRequests.toLocaleString("ar-EG")} طلب دفع
          </div>

          <details className="rounded-3xl border border-white/10 bg-black/16 p-3" open={false}>
            <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-2 py-2 text-sm font-black text-[#fff7e8]">
              تعديل الباقة من خانات بسيطة
              <Save className="size-4 text-[#f3cf73]" />
            </summary>
            <div className="mt-3 border-t border-white/8 pt-3">
              <PlanEditor plan={plan} submitLabel="حفظ التعديلات" />
            </div>
          </details>
        </div>
      </div>
    </article>
  );
}

function MiniSpec({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "rounded-2xl border border-white/10 bg-black/16 p-3 sm:col-span-2" : "rounded-2xl border border-white/10 bg-black/16 p-3"}>
      <p className="text-[0.65rem] font-black text-white/35">{label}</p>
      <p className="mt-1 text-sm font-black text-white/75">{value}</p>
    </div>
  );
}

function PlanEditor({ plan, submitLabel }: { plan?: PlanRow; submitLabel: string }) {
  const visual = normalizeFeatures(plan?.features);
  const [lines, setLines] = useState<string[]>(visual.featureLines.length > 0 ? visual.featureLines : [""]);

  const addLine = () => setLines((items) => [...items, ""]);
  const removeLine = (index: number) => setLines((items) => items.length <= 1 ? [""] : items.filter((_, itemIndex) => itemIndex !== index));
  const updateLine = (index: number, value: string) => setLines((items) => items.map((item, itemIndex) => itemIndex === index ? value : item));

  return (
    <form action={savePlanAction} className="grid gap-3">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}
      {plan ? <input type="hidden" name="code" value={plan.code} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم الباقة">
          <input name="name" required defaultValue={plan?.name ?? ""} placeholder="مثال: الباقة الاحترافية" className="admin-plan-input" />
        </Field>
        <Field label="السعر">
          <input name="priceAmount" required type="number" min="0" defaultValue={plan?.priceAmount ?? 0} placeholder="999" className="admin-plan-input" />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="العملة">
          <select name="currency" defaultValue={plan?.currency ?? "EGP"} className="admin-plan-input">
            <option value="EGP">EGP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </Field>
        <Field label="مدة الدفع">
          <select name="billingInterval" defaultValue={plan?.billingInterval ?? "monthly"} className="admin-plan-input">
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
            <option value="lifetime">مدى الحياة</option>
          </select>
        </Field>
        <Field label="زر الباقة">
          <input name="ctaLabel" defaultValue={visual.ctaLabel} placeholder="اختيار الباقة" className="admin-plan-input" />
        </Field>
      </div>

      <Field label="وصف قصير يظهر تحت اسم الباقة">
        <textarea name="description" rows={2} defaultValue={visual.description} placeholder="اكتب وصفًا بسيطًا للباقة" className="admin-plan-input min-h-[76px] resize-y py-3" />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="التخزين / المساحة">
          <input name="storageLabel" defaultValue={visual.storageLabel} placeholder="مثال: 10GB تخزين" className="admin-plan-input" />
        </Field>
        <Field label="عدد الصور / المعرض">
          <input name="photoLimitLabel" defaultValue={visual.photoLimitLabel} placeholder="مثال: 500 صورة" className="admin-plan-input" />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="شارة اختيارية أعلى الكارت">
          <input name="badgeLabel" defaultValue={visual.badgeLabel} placeholder="مثال: الأكثر طلبًا" className="admin-plan-input" />
        </Field>
        <Field label="ملاحظة مميزة اختيارية">
          <input name="highlightText" defaultValue={visual.highlightText} placeholder="مثال: الأفضل للمصورين المحترفين" className="admin-plan-input" />
        </Field>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black text-[#fff7e8]">سطور المميزات</p>
          <button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-black text-[#f3cf73]">
            <Plus className="size-3.5" /> إضافة سطر
          </button>
        </div>
        <div className="mt-3 grid gap-2">
          {lines.map((line, index) => (
            <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
              <input
                name="featureLines"
                value={line}
                onChange={(event) => updateLine(index, event.target.value)}
                placeholder={`ميزة رقم ${index + 1}`}
                className="admin-plan-input"
              />
              <button type="button" onClick={() => removeLine(index)} className="grid size-11 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-3 text-sm font-bold text-white/68">
          <input name="isPopular" type="checkbox" defaultChecked={visual.isPopular} />
          إضافة شعار الأكثر طلبًا
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-3 text-sm font-bold text-white/68">
          <input name="isActive" type="checkbox" defaultChecked={plan?.isActive ?? true} />
          إظهار الباقة في الموقع
        </label>
      </div>

      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-500/45 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5">
        <Save className="size-4" />
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black text-white/42">{label}</span>
      {children}
    </label>
  );
}

function PlanFormStyles() {
  return (
    <style jsx global>{`
      .admin-plan-input {
        min-height: 44px;
        width: 100%;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.18);
        padding: 0 0.85rem;
        color: rgba(255, 248, 234, 0.9);
        font-size: 0.875rem;
        font-weight: 800;
        outline: none;
      }
      .admin-plan-input::placeholder {
        color: rgba(255, 255, 255, 0.25);
      }
      .admin-plan-input:focus {
        border-color: rgba(243, 207, 115, 0.45);
        box-shadow: 0 0 0 3px rgba(243, 207, 115, 0.08);
      }
      select.admin-plan-input option {
        background: #111318;
        color: #fff7e8;
      }
    `}</style>
  );
}
