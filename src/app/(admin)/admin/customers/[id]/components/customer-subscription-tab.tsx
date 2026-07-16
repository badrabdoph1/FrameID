"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Ban, CheckCircle2, CreditCard, Pencil, PlayCircle, RefreshCw, X } from "lucide-react";

import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import type { CustomerPlanOption } from "@/modules/admin/customers/customer-subscription-editor";
import type { CustomerSubscriptionStatus } from "@/modules/admin/customers/customer-types";
import type { CustomerDetail, CustomerSubscriptionInfo } from "./customer-types";

type Props = {
  customer: CustomerDetail;
  allSubscriptions: CustomerSubscriptionInfo[];
  plans: CustomerPlanOption[];
  onAction: (type: string, title: string, description: string, formData: FormData, danger?: boolean) => void;
};

const statusLabels: Record<CustomerSubscriptionStatus, string> = {
  ACTIVE: "نشط ومدفوع",
  TRIAL: "تجريبي",
  SUSPENDED: "موقوف مؤقتًا",
  EXPIRED: "منتهي",
  PAST_DUE: "متأخر في الدفع",
  CANCELLED: "ملغي",
};

const subTone: Record<string, "success" | "warning" | "danger" | "default"> = {
  ACTIVE: "success",
  TRIAL: "warning",
  EXPIRED: "danger",
  PAST_DUE: "danger",
  CANCELLED: "default",
  SUSPENDED: "danger",
};

const fieldClass = "min-h-11 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none transition focus:border-amber-300/45 focus:ring-2 focus:ring-amber-300/10";

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

export function CustomerSubscriptionTab({ customer, allSubscriptions, plans, onAction }: Props) {
  const current = customer.subscription;
  const [editorOpen, setEditorOpen] = useState(false);
  const [planId, setPlanId] = useState(current?.planId ?? plans[0]?.id ?? "");
  const [status, setStatus] = useState<CustomerSubscriptionStatus>(current?.status ?? "ACTIVE");
  const [durationMode, setDurationMode] = useState("30");
  const [customEndDate, setCustomEndDate] = useState("");
  const [adjustmentDays, setAdjustmentDays] = useState("30");
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("INSTAPAY");
  const [paymentAmount, setPaymentAmount] = useState(String(plans.find((plan) => plan.id === planId)?.priceAmount ?? ""));
  const [paymentReference, setPaymentReference] = useState("");
  const [note, setNote] = useState("");

  const selectedPlan = plans.find((plan) => plan.id === planId) ?? null;
  const effectiveStatus: CustomerSubscriptionStatus = recordPayment ? "ACTIVE" : status;
  const endSummary = useMemo(() => {
    if (durationMode === "forever") return "دائم — بدون انتهاء";
    if (durationMode === "custom-date") return customEndDate ? formatDate(`${customEndDate}T23:59:59.999Z`) : "اختر التاريخ";
    if (durationMode === "adjust") {
      const days = Number(adjustmentDays || 0);
      const base = current?.currentPeriodEnd ? new Date(current.currentPeriodEnd) : new Date();
      return `${days >= 0 ? "زيادة" : "خصم"} ${Math.abs(days).toLocaleString("ar-EG")} يوم ← ${formatDate(addDays(base, days))}`;
    }
    return formatDate(addDays(new Date(), Number(durationMode)));
  }, [adjustmentDays, current?.currentPeriodEnd, customEndDate, durationMode]);

  function selectPlan(nextPlanId: string) {
    setPlanId(nextPlanId);
    const plan = plans.find((item) => item.id === nextPlanId);
    if (plan) setPaymentAmount(String(plan.priceAmount));
  }

  function selectStatus(nextStatus: CustomerSubscriptionStatus) {
    setStatus(nextStatus);
    if (nextStatus !== "ACTIVE") setRecordPayment(false);
  }

  function togglePayment(checked: boolean) {
    setRecordPayment(checked);
    if (checked) setStatus("ACTIVE");
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("tenantId", customer.id);
    if (current?.id) formData.set("subscriptionId", current.id);
    formData.set("planId", planId);
    formData.set("status", effectiveStatus);
    formData.set("durationMode", durationMode);
    formData.set("customEndDate", customEndDate);
    formData.set("adjustmentDays", adjustmentDays);
    formData.set("recordPayment", String(recordPayment));
    formData.set("paymentMethod", paymentMethod);
    formData.set("paymentAmount", paymentAmount);
    formData.set("paymentReference", paymentReference);
    formData.set("note", note);

    const paymentSummary = recordPayment
      ? ` وسيتم تسجيل دفعة معتمدة بقيمة ${Number(paymentAmount || 0).toLocaleString("ar-EG")} ${selectedPlan?.currency ?? "EGP"}`
      : " بدون إنشاء حركة مالية";
    onAction(
      "edit-subscription",
      current ? "حفظ تعديل الاشتراك" : "إنشاء اشتراك للعميل",
      `الباقة: ${selectedPlan?.name ?? "غير محددة"}، الحالة: ${statusLabels[effectiveStatus]}، النهاية: ${endSummary}${paymentSummary}.`,
      formData,
    );
  }

  return (
    <div className="space-y-4">
      <section aria-label="محرر اشتراك العميل" className="rounded-xl border border-amber-300/15 bg-amber-300/[0.035] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-[#fff7e8]">التحكم في اشتراك العميل</h3>
            <p className="mt-1 text-xs font-bold text-white/40">غيّر الباقة والحالة والمدة، وسجّل الدفع عند الحاجة.</p>
          </div>
          <button
            type="button"
            onClick={() => setEditorOpen((value) => !value)}
            disabled={plans.length === 0}
            aria-expanded={editorOpen}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] transition hover:bg-[#ffe29a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {editorOpen ? <X size={16} /> : <Pencil size={16} />}
            {editorOpen ? "إغلاق التعديل" : current ? "تعديل الاشتراك" : "إنشاء اشتراك"}
          </button>
        </div>

        {plans.length === 0 ? (
          <p className="mt-3 rounded-lg border border-red-400/15 bg-red-400/5 px-3 py-2 text-xs font-bold text-red-300">لا توجد باقات نشطة. فعّل باقة من قسم الباقات أولًا.</p>
        ) : null}

        {editorOpen ? (
          <form onSubmit={submitEdit} className="mt-4 border-t border-white/8 pt-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="الباقة">
                <select value={planId} onChange={(event) => selectPlan(event.target.value)} className={fieldClass} required>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} — {plan.priceAmount.toLocaleString("ar-EG")} {plan.currency}</option>
                  ))}
                </select>
              </Field>

              <Field label="حالة الاشتراك">
                <select value={effectiveStatus} onChange={(event) => selectStatus(event.target.value as CustomerSubscriptionStatus)} className={fieldClass}>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>

              <Field label="المدة أو التعديل">
                <select value={durationMode} onChange={(event) => setDurationMode(event.target.value)} className={fieldClass}>
                  <option value="30">30 يومًا من اليوم</option>
                  <option value="90">90 يومًا من اليوم</option>
                  <option value="365">سنة من اليوم</option>
                  <option value="forever">اشتراك دائم</option>
                  <option value="custom-date">تاريخ انتهاء محدد</option>
                  <option value="adjust">زيادة أو خصم أيام</option>
                </select>
              </Field>

              {durationMode === "custom-date" ? (
                <Field label="تاريخ الانتهاء">
                  <input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className={fieldClass} required dir="ltr" />
                </Field>
              ) : null}

              {durationMode === "adjust" ? (
                <Field label="الأيام: موجب للزيادة وسالب للخصم" hint="مثال: 30 للزيادة أو -7 للخصم">
                  <input type="number" min="-3650" max="3650" value={adjustmentDays} onChange={(event) => setAdjustmentDays(event.target.value)} className={fieldClass} required dir="ltr" />
                </Field>
              ) : null}

              <Field label="ملاحظة إدارية" hint="اختياري — ستظهر في سجل العملية">
                <input value={note} onChange={(event) => setNote(event.target.value)} className={fieldClass} placeholder="سبب التعديل أو تفاصيله" />
              </Field>
            </div>

            <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-white/8 bg-black/20 px-3 py-2.5">
              <input type="checkbox" checked={recordPayment} onChange={(event) => togglePayment(event.target.checked)} className="size-4 accent-amber-300" />
              <span>
                <span className="block text-sm font-black text-white/85">تسجيل دفعة معتمدة</span>
                <span className="block text-xs font-bold text-white/35">استخدمها عندما يكون العميل قد اشترى الباقة فعلًا.</span>
              </span>
            </label>

            {recordPayment ? (
              <div className="mt-3 grid gap-3 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.035] p-3 md:grid-cols-3">
                <Field label="طريقة الدفع">
                  <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={fieldClass}>
                    <option value="INSTAPAY">InstaPay</option>
                    <option value="VODAFONE_CASH">Vodafone Cash</option>
                    <option value="STRIPE">Stripe</option>
                    <option value="PAYPAL">PayPal</option>
                  </select>
                </Field>
                <Field label={`المبلغ (${selectedPlan?.currency ?? "EGP"})`}>
                  <input type="number" min="1" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className={fieldClass} required dir="ltr" />
                </Field>
                <Field label="رقم المرجع" hint="اختياري">
                  <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className={fieldClass} placeholder="رقم التحويل أو العملية" dir="ltr" />
                </Field>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-white/8 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={16} />
                <p className="text-xs font-bold leading-5 text-white/55">
                  <span className="text-white/80">{selectedPlan?.name}</span> · {statusLabels[effectiveStatus]} · {endSummary}
                  {recordPayment ? ` · دفعة ${Number(paymentAmount || 0).toLocaleString("ar-EG")} ${selectedPlan?.currency ?? "EGP"}` : ""}
                </p>
              </div>
              <button type="submit" className="min-h-11 shrink-0 rounded-lg bg-emerald-500 px-5 text-sm font-black text-white transition hover:bg-emerald-400">
                مراجعة وحفظ
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {current ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/60">الاشتراك الحالي</h3>
            <div className="grid gap-2.5">
              <SubRow label="الخطة" value={current.planName ?? "بدون خطة"} />
              {current.planPrice ? <SubRow label="السعر" value={`${current.planPrice.toLocaleString("ar-EG")} ج.م`} /> : null}
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">الحالة</span>
                <AdminStatusBadge tone={subTone[current.status] || "default"}>{statusLabels[current.status]}</AdminStatusBadge>
              </div>
              <SubRow label="بداية الفترة" value={formatDate(current.currentPeriodStart)} />
              <SubRow label="نهاية الفترة" value={formatDate(current.currentPeriodEnd)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {current.status !== "ACTIVE" ? (
                <form action={async (formData) => { formData.set("subscriptionId", current.id); formData.set("tenantId", customer.id); onAction("activate-subscription", "تفعيل الاشتراك", "سيتم تفعيل الاشتراك لهذا العميل.", formData); }}>
                  <button type="submit" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 text-xs font-extrabold text-emerald-400 transition hover:bg-emerald-500/10"><PlayCircle size={14} /> تفعيل الاشتراك</button>
                </form>
              ) : null}
              {current.status !== "CANCELLED" && current.status !== "EXPIRED" ? (
                <form action={async (formData) => { formData.set("subscriptionId", current.id); formData.set("tenantId", customer.id); onAction("cancel-subscription", "إلغاء الاشتراك", "سيتم إلغاء الاشتراك الحالي.", formData, true); }}>
                  <button type="submit" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-red-500/20 px-3 text-xs font-extrabold text-red-400/70 transition hover:border-red-400/40 hover:text-red-400"><Ban size={14} /> إلغاء الاشتراك</button>
                </form>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/60">التجربة المجانية</h3>
            <div className="grid gap-2.5">
              <SubRow label="تاريخ البداية" value={formatDate(customer.trialStartedAt)} />
              <SubRow label="تاريخ النهاية" value={formatDate(customer.trialEndsAt)} />
            </div>
            <form action={async (formData) => { formData.set("tenantId", customer.id); formData.set("days", "14"); onAction("extend-trial", "تمديد التجربة", `تمديد تجربة ${customer.displayName} لمدة 14 يوماً؟`, formData); }}>
              <button type="submit" className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/8 px-3 text-xs font-extrabold text-white/55 transition hover:border-amber-500/30 hover:text-[#f3cf73]"><RefreshCw size={14} /> تمديد التجربة 14 يومًا</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/5"><CreditCard size={19} className="text-white/25" /></span>
          <div>
            <p className="text-sm font-black text-white/65">لا يوجد اشتراك حالي</p>
            <p className="mt-0.5 text-xs font-bold text-white/35">استخدم «إنشاء اشتراك» لاختيار الباقة والمدة.</p>
          </div>
        </div>
      )}

      {allSubscriptions.length > 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/3 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white/60">سجل الاشتراكات</h3>
          <div className="grid gap-2">
            {allSubscriptions.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-white/80">{subscription.planName ?? "بدون خطة"}</p>
                  <p className="text-xs text-white/40">{formatDate(subscription.createdAt)} {subscription.currentPeriodEnd ? `← ${formatDate(subscription.currentPeriodEnd)}` : ""}</p>
                </div>
                <AdminStatusBadge tone={subTone[subscription.status] || "default"}>{statusLabels[subscription.status]}</AdminStatusBadge>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid content-start gap-1.5">
      <span className="text-xs font-black text-white/55">{label}</span>
      {children}
      {hint ? <span className="text-[0.68rem] font-bold text-white/30">{hint}</span> : null}
    </label>
  );
}

function SubRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-left text-sm text-white/80">{value}</span>
    </div>
  );
}
