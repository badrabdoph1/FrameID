"use client";

import { useActionState, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  FileImage,
  FileX,
  Info,
  Loader2,
  Package,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BuilderPageHeader } from "@/components/dashboard/builder-primitives";
import {
  cancelPaymentRequestAction,
  createPaymentDraftAction,
  removeProofAction,
  submitPaymentRequestAction,
  uploadProofAction,
} from "@/app/(dashboard)/dashboard/billing/actions";

type PlanData = {
  id: string;
  code: string;
  name: string;
  priceAmount: number;
  currency: string;
  billingInterval: string;
  features: unknown;
  isActive: boolean;
};

type PaymentMethodData = {
  id: string;
  paymentMethod: string;
  isActive: boolean;
  label: string | null;
  description: string | null;
  config: Record<string, unknown>;
  qrCodeAssetId: string | null;
  qrCodeUrl: string | null;
  sortOrder: number;
  accounts: Array<{
    id: string;
    paymentSettingsId: string;
    label: string | null;
    accountName: string;
    accountNumber: string;
    bankName: string | null;
    iban: string | null;
    swift: string | null;
    phoneNumber: string | null;
    instructions: string | null;
    notes: string | null;
    isActive: boolean;
    sortOrder: number;
  }>;
};

type PaymentRequestData = {
  id: string;
  status: string;
  method: string;
  amount: number;
  reference: string | null;
  proofAssetId: string | null;
  proofUrl: string | null;
  planId: string | null;
  submittedAt: Date | null;
  rejectionReason: string | null;
};

type LogData = {
  id: string;
  action: string;
  actorName: string | null;
  note: string | null;
  createdAt: Date;
};

type BillingClientProps = {
  session: {
    user: { id: string; email: string; name: string; role: string };
    tenant: {
      id: string;
      displayName: string;
      status: string;
      trialEndsAt: Date;
      trialStartedAt: Date;
      trialDays: number;
      gracePeriodEndsAt: Date | null;
    };
    site: { id: string; slug: string; title: string; status: string; slugChangeUsed: boolean };
    subscription: {
      id: string;
      planId: string | null;
      plan: { code: string; name: string; priceAmount: number; currency: string } | null;
      status: string;
      currentPeriodEnd: Date | null;
    } | null;
  };
  plans: PlanData[];
  paymentMethods: PaymentMethodData[];
  paymentRequest: PaymentRequestData | null;
  logs: LogData[];
  daysRemaining: number;
  requested?: boolean;
  draftId?: string;
  error?: string;
};

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  TRIAL: { label: "نسخة تجريبية", color: "#f3cf73", bg: "rgba(243, 207, 115, 0.1)" },
  ACTIVE: { label: "مشترك", color: "#4ade80", bg: "rgba(74, 222, 128, 0.1)" },
  EXPIRED: { label: "منتهي", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
  PAST_DUE: { label: "متأخر", color: "#fb923c", bg: "rgba(251, 146, 60, 0.1)" },
  CANCELLED: { label: "ملغي", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.1)" },
  SUSPENDED: { label: "موقوف", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
  NONE: { label: "غير مفعل", color: "#f3cf73", bg: "rgba(243, 207, 115, 0.1)" },
};

const REQUEST_STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "مسودة", color: "rgba(245, 234, 214, 0.72)", bg: "rgba(255,255,255,0.05)" },
  SUBMITTED: { label: "تم الإرسال", color: "#f3cf73", bg: "rgba(243, 207, 115, 0.1)" },
  PENDING: { label: "قيد الانتظار", color: "#f3cf73", bg: "rgba(243, 207, 115, 0.1)" },
  UNDER_REVIEW: { label: "قيد المراجعة", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.1)" },
  APPROVED: { label: "تمت الموافقة", color: "#4ade80", bg: "rgba(74, 222, 128, 0.1)" },
  REJECTED: { label: "مرفوض", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
  CANCELLED: { label: "ملغي", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.1)" },
};

const LOG_LABELS: Record<string, string> = {
  DRAFT_CREATED: "تم إنشاء المسودة",
  DRAFT_UPDATED: "تم تحديث المسودة",
  PROOF_UPLOADED: "تم رفع إثبات الدفع",
  PROOF_REMOVED: "تم حذف إثبات الدفع",
  SUBMITTED: "تم تقديم الطلب",
  APPROVED: "تمت الموافقة",
  REJECTED: "تم الرفض",
  REUPLOAD_REQUESTED: "طلب إعادة رفع الإثبات",
  NOTE_ADDED: "ملاحظة من الإدارة",
  CANCELLED: "تم الإلغاء",
};

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    INSTAPAY: "إنستا باي",
    VODAFONE_CASH: "فودافون كاش",
    STRIPE: "Stripe",
    PAYPAL: "PayPal",
  };
  return labels[method] ?? method;
}

function normalizeFeatures(features: unknown): string[] {
  if (Array.isArray(features)) return features.map(String);
  if (features && typeof features === "object") {
    return Object.entries(features as Record<string, unknown>).map(([key, value]) => {
      if (typeof value === "boolean") return `${key}: ${value ? "متاح" : "غير متاح"}`;
      return `${key}: ${String(value)}`;
    });
  }
  return [];
}

function getActionError(state: unknown): string | null {
  if (state && typeof state === "object" && "success" in state && !(state as { success: boolean }).success) {
    return (state as { error: string }).error;
  }
  return null;
}

function getActionSuccess(state: unknown): boolean {
  return Boolean(state && typeof state === "object" && "success" in state && (state as { success: boolean }).success);
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 950, color, background: bg }}>
      {label}
    </span>
  );
}

function SectionCard({ title, description, icon, children }: { title: string; description?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <div className="flex items-start gap-3 border-b border-white/[0.06] px-4 py-3">
        {icon ? <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-[#f3cf73]">{icon}</div> : null}
        <div className="min-w-0">
          <h2 className="m-0 text-[0.95rem] font-black text-[#fff7e8]">{title}</h2>
          {description ? <p className="m-0 mt-1 text-xs font-bold leading-6 text-white/45">{description}</p> : null}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-white/45">{label}</span>
      <strong className={muted ? "text-white/30" : "text-[#fff7e8]"}>{value}</strong>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[88px,1fr] gap-2 text-xs leading-6">
      <span className="text-white/38">{label}</span>
      <strong className="break-all font-mono text-white/75" dir="ltr">{value}</strong>
    </div>
  );
}

export function BillingClient({ session, plans, paymentMethods, paymentRequest, logs, daysRemaining, requested, draftId, error: urlError }: BillingClientProps) {
  const { subscription, tenant } = session;
  const subStatus = subscription?.status ?? tenant.status ?? "NONE";
  const statusInfo = STATUS_INFO[subStatus] ?? STATUS_INFO.NONE;
  const existingPlan = subscription?.plan ?? null;
  const activeRequestLocked = Boolean(paymentRequest && !["DRAFT", "REJECTED", "CANCELLED"].includes(paymentRequest.status));

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(paymentRequest?.planId ?? null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [reference, setReference] = useState(paymentRequest?.reference ?? "");
  const [draftState, setDraftState] = useState<string | null>(paymentRequest?.id ?? draftId ?? null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(paymentRequest?.proofUrl ?? null);
  const [proofUploaded, setProofUploaded] = useState(Boolean(paymentRequest?.proofAssetId));
  const [fileError, setFileError] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const [createState, createAction, createPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await createPaymentDraftAction(fd);
    if (result.success && result.draftId) setDraftState(result.draftId);
    return result;
  }, null);

  const [uploadState, uploadAction, uploadPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await uploadProofAction(fd);
    if (result.success) {
      setProofUploaded(true);
      setProofFile(null);
    }
    return result;
  }, null);

  const [removeState, removeAction, removePending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await removeProofAction(fd);
    if (result.success) {
      setProofUploaded(false);
      setProofFile(null);
      setProofPreview(null);
    }
    return result;
  }, null);

  const [submitState, submitAction, submitPending] = useActionState(async (_prev: unknown, fd: FormData) => submitPaymentRequestAction(fd), null);
  const [cancelState, cancelAction, cancelPending] = useActionState(async (_prev: unknown, fd: FormData) => {
    const result = await cancelPaymentRequestAction(fd);
    if (result.success) {
      setDraftState(null);
      setProofUploaded(false);
      setProofFile(null);
      setProofPreview(null);
    }
    return result;
  }, null);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId), [plans, selectedPlanId]);
  const selectedMethod = useMemo(() => paymentMethods.find((m) => m.id === selectedMethodId), [paymentMethods, selectedMethodId]);
  const selectedAccount = useMemo(() => selectedMethod?.accounts.find((a) => a.id === selectedAccountId) ?? null, [selectedMethod, selectedAccountId]);
  const canCreateDraft = Boolean(selectedPlan && selectedMethod && selectedAccount && !draftState && !activeRequestLocked);
  const canUploadProof = Boolean(draftState && proofFile && !activeRequestLocked);
  const canSubmit = Boolean(draftState && (proofUploaded || getActionSuccess(uploadState)) && !activeRequestLocked);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFileError("نوع الملف غير مدعوم. اختر JPEG أو PNG أو WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("حجم الملف يتجاوز 5MB.");
      e.target.value = "";
      return;
    }
    setFileError(null);
    setProofFile(file);
    setProofUploaded(false);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  const workflow = [
    { title: "اختر الباقة", done: Boolean(selectedPlan), description: selectedPlan?.name ?? "اختر الخطة المناسبة" },
    { title: "اختر وسيلة الدفع", done: Boolean(selectedMethod && selectedAccount), description: selectedMethod ? (selectedMethod.label ?? getPaymentMethodLabel(selectedMethod.paymentMethod)) : "InstaPay أو Vodafone Cash" },
    { title: "أنشئ المسودة", done: Boolean(draftState), description: draftState ? "تم حفظ بيانات الطلب" : "يتم قفل السعر والباقة" },
    { title: "ارفع إثبات الدفع", done: Boolean(proofUploaded || getActionSuccess(uploadState)), description: proofUploaded || getActionSuccess(uploadState) ? "تم رفع الإثبات" : "صورة التحويل أو الإيصال" },
    { title: "أرسل الطلب", done: Boolean(activeRequestLocked || getActionSuccess(submitState)), description: activeRequestLocked ? "قيد مراجعة الإدارة" : "بعد الإرسال لا يمكن التعديل" },
  ];

  return (
    <main className="space-y-5">
      <BuilderPageHeader
        eyebrow="الاشتراك والتفعيل"
        title={subStatus === "ACTIVE" ? "اشتراكك نشط" : "فعّل موقعك باحتراف"}
        description={subStatus === "ACTIVE" ? "اشتراكك مفعل ويمكنك استخدام كل الميزات." : "رحلة تفعيل واضحة: اختر الباقة، ادفع، ارفع الإثبات، ثم يتم تفعيل الموقع بعد مراجعة الإدارة."}
      />

      {urlError ? <AlertBox tone="danger" title="حدث خطأ" body={urlError === "no-subscription" ? "لا يوجد اشتراك نشط. يرجى إنشاء الموقع أولاً." : urlError} /> : null}
      {requested || getActionSuccess(submitState) ? <AlertBox tone="success" title="تم إرسال الطلب" body="طلب التفعيل قيد المراجعة الآن. ستظهر الحالة هنا وفي لوحة التحكم." /> : null}

      <SectionCard title="حالة الاشتراك والموقع" icon={<ShieldCheck size={16} />}>
        <div className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge label={statusInfo.label} color={statusInfo.color} bg={statusInfo.bg} />
              {existingPlan ? <span className="text-sm font-bold text-white/60">{existingPlan.name}</span> : <span className="text-sm font-bold text-white/40">لا توجد باقة مدفوعة حالياً</span>}
            </div>
            <p className="m-0 text-sm leading-7 text-white/55">
              {subStatus === "ACTIVE"
                ? `اشتراكك نشط${subscription?.currentPeriodEnd ? ` حتى ${formatDate(subscription.currentPeriodEnd)}` : ""}.`
                : daysRemaining > 0
                  ? `متبقي ${daysRemaining} يوم في الفترة التجريبية. يمكنك التفعيل الآن بدون إيقاف موقعك.`
                  : tenant.gracePeriodEndsAt
                    ? `انتهت التجربة، وفترة السماح حتى ${formatDate(tenant.gracePeriodEndsAt)}.`
                    : "انتهت الفترة التجريبية. فعّل الاشتراك لاستمرار الموقع."}
            </p>
          </div>
          <div className="grid gap-2 rounded-xl border border-white/[0.06] bg-black/10 p-3">
            <SummaryRow label="حالة الموقع" value={session.site.status} />
            <SummaryRow label="بداية التجربة" value={formatDate(tenant.trialStartedAt)} />
            <SummaryRow label="نهاية التجربة" value={formatDate(tenant.trialEndsAt)} />
            <SummaryRow label="أيام التجربة" value={`${tenant.trialDays} يوم`} />
          </div>
        </div>
      </SectionCard>

      {paymentRequest ? (
        <SectionCard title="حالة طلب التفعيل الحالي" icon={<Clock size={16} />}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                label={REQUEST_STATUS_INFO[paymentRequest.status]?.label ?? paymentRequest.status}
                color={REQUEST_STATUS_INFO[paymentRequest.status]?.color ?? "#f3cf73"}
                bg={REQUEST_STATUS_INFO[paymentRequest.status]?.bg ?? "rgba(243,207,115,0.1)"}
              />
              {paymentRequest.submittedAt ? <span className="text-xs font-bold text-white/38">تم الإرسال: {formatDate(paymentRequest.submittedAt)}</span> : null}
            </div>
            {paymentRequest.status === "REJECTED" ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">
                سبب الرفض: {paymentRequest.rejectionReason ?? "لم يتم تحديد سبب الرفض"}
              </div>
            ) : null}
            {logs.length > 0 ? <Timeline logs={logs} /> : null}
          </div>
        </SectionCard>
      ) : null}

      {subStatus !== "ACTIVE" ? (
        <SectionCard title="مراحل التفعيل" description="اتبع الخطوات بالترتيب حتى يصل الطلب للأدمن بشكل واضح." icon={<CheckCircle2 size={16} />}>
          <div className="grid gap-3 md:grid-cols-5">
            {workflow.map((step, idx) => (
              <div key={step.title} className={`rounded-xl border p-3 ${step.done ? "border-emerald-500/20 bg-emerald-500/8" : "border-white/[0.07] bg-white/[0.02]"}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-white/8 text-xs font-black text-white/75">{idx + 1}</span>
                  {step.done ? <CheckCircle2 className="size-4 text-emerald-400" /> : <Clock className="size-4 text-white/25" />}
                </div>
                <strong className="block text-sm text-[#fff7e8]">{step.title}</strong>
                <span className="mt-1 block text-xs leading-5 text-white/42">{step.description}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {subStatus !== "ACTIVE" ? (
        <SectionCard title="اختر الباقة" description="كل باقة يتم تسعيرها من لوحة الإدارة ولا يوجد سعر مكتوب داخل الكود." icon={<Package size={16} />}>
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((plan) => {
              const selected = selectedPlanId === plan.id;
              const features = normalizeFeatures(plan.features).slice(0, 6);
              return (
                <button key={plan.id} type="button" onClick={() => !draftState && !activeRequestLocked && setSelectedPlanId(plan.id)} disabled={Boolean(draftState || activeRequestLocked)} className={`rounded-2xl border p-4 text-right transition ${selected ? "border-amber-400/60 bg-amber-500/10" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="m-0 text-base font-black text-[#fff7e8]">{plan.name}</h3>
                      <p className="m-0 mt-1 text-xs font-bold text-white/35">{plan.code}</p>
                    </div>
                    {selected ? <span className="grid size-7 place-items-center rounded-full bg-[#f3cf73] text-black"><Check size={15} /></span> : null}
                  </div>
                  <p className="my-4 text-2xl font-black text-[#f3cf73]" dir="ltr">{plan.priceAmount.toLocaleString()} {plan.currency}</p>
                  <div className="grid gap-2">
                    {features.map((feature) => <span key={feature} className="flex items-start gap-2 text-xs leading-5 text-white/55"><Check className="mt-1 size-3 shrink-0 text-emerald-400" />{feature}</span>)}
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {subStatus !== "ACTIVE" ? (
        <SectionCard title="وسيلة الدفع" description="كل الأرقام والتعليمات تظهر من Payment Settings بدون Deploy." icon={<CreditCard size={16} />}>
          {paymentMethods.length === 0 ? (
            <AlertBox tone="warning" title="لا توجد وسائل دفع مفعلة" body="اطلب من الأدمن تفعيل InstaPay أو Vodafone Cash من Payment Settings." />
          ) : (
            <div className="grid gap-3">
              {paymentMethods.map((method) => {
                const selected = selectedMethodId === method.id;
                return (
                  <div key={method.id} className={`rounded-2xl border ${selected ? "border-amber-400/40 bg-amber-500/8" : "border-white/[0.08] bg-white/[0.02]"}`}>
                    <button type="button" disabled={Boolean(draftState || activeRequestLocked)} onClick={() => { setSelectedMethodId(method.id); setSelectedAccountId(null); }} className="flex w-full items-center gap-3 p-4 text-right">
                      <span className={`grid size-5 place-items-center rounded-full border-2 ${selected ? "border-[#f3cf73]" : "border-white/20"}`}>{selected ? <span className="size-2 rounded-full bg-[#f3cf73]" /> : null}</span>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-sm text-[#fff7e8]">{method.label ?? getPaymentMethodLabel(method.paymentMethod)}</strong>
                        {method.description ? <span className="mt-1 block text-xs text-white/45">{method.description}</span> : null}
                      </div>
                      {method.qrCodeUrl ? <img src={method.qrCodeUrl} alt="QR Code" className="size-12 rounded-lg object-cover" /> : null}
                    </button>

                    {selected ? (
                      <div className="grid gap-2 px-4 pb-4 md:grid-cols-2">
                        {method.accounts.map((account) => {
                          const accountSelected = selectedAccountId === account.id;
                          return (
                            <button key={account.id} type="button" disabled={Boolean(draftState || activeRequestLocked)} onClick={() => setSelectedAccountId(account.id)} className={`rounded-xl border p-3 text-right ${accountSelected ? "border-amber-400/50 bg-amber-500/10" : "border-white/[0.07] bg-black/10"}`}>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <strong className="text-sm text-[#fff7e8]">{account.label ?? account.accountName}</strong>
                                {accountSelected ? <CheckCircle2 className="size-4 text-[#f3cf73]" /> : null}
                              </div>
                              <InfoRow label="الاسم" value={account.accountName} />
                              <InfoRow label="الرقم" value={account.accountNumber} />
                              <InfoRow label="الهاتف" value={account.phoneNumber} />
                              <InfoRow label="البنك" value={account.bankName} />
                              <InfoRow label="IBAN" value={account.iban} />
                              <InfoRow label="SWIFT" value={account.swift} />
                              {account.instructions ? <p className="mt-2 border-t border-white/[0.06] pt-2 text-xs leading-6 text-white/50">{account.instructions}</p> : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      ) : null}

      {subStatus !== "ACTIVE" ? (
        <SectionCard title="إنشاء مسودة الطلب" description="بعد حفظ المسودة تستطيع رفع إثبات الدفع، ثم إرسال الطلب للمراجعة." icon={<Info size={16} />}>
          <div className="grid gap-3">
            <input value={reference} onChange={(e) => setReference(e.target.value)} disabled={Boolean(draftState || activeRequestLocked)} placeholder="رقم المرجع أو Transaction ID — اختياري" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/25" dir="ltr" />
            {!draftState ? (
              <form action={createAction}>
                <input type="hidden" name="planId" value={selectedPlanId ?? ""} />
                <input type="hidden" name="method" value={selectedMethod?.paymentMethod ?? ""} />
                <input type="hidden" name="accountId" value={selectedAccountId ?? ""} />
                <input type="hidden" name="reference" value={reference} />
                <Button type="submit" variant="luxury" disabled={!canCreateDraft || createPending}>
                  {createPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {createPending ? "جاري الحفظ..." : "حفظ مسودة طلب التفعيل"}
                </Button>
              </form>
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">تم إنشاء مسودة الطلب. يمكنك الآن رفع إثبات الدفع.</div>
            )}
            {getActionError(createState) ? <ErrorText text={getActionError(createState)!} /> : null}
          </div>
        </SectionCard>
      ) : null}

      {subStatus !== "ACTIVE" ? (
        <SectionCard title="إثبات الدفع" description="ارفع صورة التحويل. يمكنك المعاينة والاستبدال والحذف قبل الإرسال." icon={<FileImage size={16} />}>
          <div className="space-y-3">
            {proofPreview ? (
              <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/25">
                <img src={proofPreview} alt="إثبات الدفع" className="max-h-72 w-full object-contain" />
              </div>
            ) : null}

            {!proofPreview ? (
              <label htmlFor="proof-input" className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center">
                <Upload className="size-8 text-[#f3cf73]" />
                <strong className="text-sm text-[#fff7e8]">اضغط لاختيار صورة الإثبات</strong>
                <span className="text-xs text-white/38">JPEG / PNG / WebP — بحد أقصى 5MB</span>
              </label>
            ) : (
              <div className="flex flex-wrap gap-2">
                <label htmlFor="proof-input" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-black text-white/70 hover:bg-white/5">
                  <Upload className="size-4" /> استبدال الصورة
                </label>
                {draftState && proofUploaded ? (
                  <form action={removeAction}>
                    <input type="hidden" name="draftId" value={draftState} />
                    <Button type="submit" variant="ghost" disabled={removePending} style={{ color: "#f87171" }}>
                      {removePending ? <Loader2 className="size-4 animate-spin" /> : <FileX className="size-4" />}
                      حذف الصورة
                    </Button>
                  </form>
                ) : (
                  <Button type="button" variant="ghost" onClick={() => { setProofFile(null); setProofPreview(null); setProofUploaded(false); }} style={{ color: "#f87171" }}>
                    <X className="size-4" /> حذف الصورة
                  </Button>
                )}
              </div>
            )}

            <input id="proof-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
            {fileError ? <ErrorText text={fileError} /> : null}
            {getActionError(uploadState) ? <ErrorText text={getActionError(uploadState)!} /> : null}
            {getActionError(removeState) ? <ErrorText text={getActionError(removeState)!} /> : null}

            {proofFile ? (
              <form action={uploadAction}>
                <input type="hidden" name="draftId" value={draftState ?? ""} />
                <input type="hidden" name="proof-name" value={proofFile.name} />
                <Button type="submit" variant="secondary" disabled={!canUploadProof || uploadPending}>
                  {uploadPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {uploadPending ? "جاري الرفع..." : "رفع الصورة إلى الخادم"}
                </Button>
              </form>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {subStatus !== "ACTIVE" && !activeRequestLocked ? (
        <SectionCard title="ملخص الطلب والإرسال" description="بعد الإرسال لن يستطيع العميل تعديل الطلب إلا إذا طلب الأدمن إعادة رفع الإثبات." icon={<CheckCircle2 size={16} />}>
          <div className="mb-4 grid gap-2 rounded-xl border border-white/[0.07] bg-black/10 p-3">
            <SummaryRow label="الباقة المختارة" value={selectedPlan?.name ?? "لم يتم الاختيار"} muted={!selectedPlan} />
            <SummaryRow label="السعر" value={selectedPlan ? `${selectedPlan.priceAmount.toLocaleString()} ${selectedPlan.currency}` : "لم يتم الاختيار"} muted={!selectedPlan} />
            <SummaryRow label="وسيلة الدفع" value={selectedMethod ? (selectedMethod.label ?? getPaymentMethodLabel(selectedMethod.paymentMethod)) : "لم يتم الاختيار"} muted={!selectedMethod} />
            <SummaryRow label="حساب الدفع" value={selectedAccount ? (selectedAccount.label ?? selectedAccount.accountName) : "لم يتم الاختيار"} muted={!selectedAccount} />
            <SummaryRow label="إثبات الدفع" value={proofUploaded || getActionSuccess(uploadState) ? "تم الرفع" : "لم يتم الرفع"} muted={!(proofUploaded || getActionSuccess(uploadState))} />
          </div>

          <div className="flex flex-wrap gap-2">
            <form action={submitAction}>
              <input type="hidden" name="draftId" value={draftState ?? ""} />
              <Button type="submit" variant="luxury" disabled={!canSubmit || submitPending}>
                {submitPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                {submitPending ? "جاري الإرسال..." : "إرسال طلب التفعيل"}
              </Button>
            </form>
            {draftState ? (
              <form action={cancelAction}>
                <input type="hidden" name="draftId" value={draftState} />
                <Button type="submit" variant="ghost" disabled={cancelPending} style={{ color: "#f87171" }}>
                  {cancelPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                  إلغاء المسودة
                </Button>
              </form>
            ) : null}
          </div>
          {getActionError(submitState) ? <ErrorText text={getActionError(submitState)!} /> : null}
          {getActionError(cancelState) ? <ErrorText text={getActionError(cancelState)!} /> : null}
        </SectionCard>
      ) : null}

      <SectionCard title="ماذا يحدث بعد الدفع؟" icon={<Info size={16} />}>
        <div className="grid gap-3 md:grid-cols-3">
          {AFTER_PAYMENT_STEPS.map((step, idx) => (
            <div key={step.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
              <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-amber-500/10 text-base font-black text-[#f3cf73]">{idx + 1}</span>
              <strong className="block text-sm text-[#fff7e8]">{step.title}</strong>
              <p className="m-0 mt-2 text-xs leading-6 text-white/45">{step.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="أسئلة شائعة" icon={<Info size={16} />}>
        <div className="grid gap-2">
          {FAQ_ITEMS.map((item, idx) => {
            const open = faqOpen === idx;
            return (
              <div key={item.q} className="overflow-hidden rounded-xl border border-white/[0.07]">
                <button type="button" onClick={() => setFaqOpen(open ? null : idx)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right">
                  <strong className="text-sm text-[#fff7e8]">{item.q}</strong>
                  {open ? <ChevronUp className="size-4 text-white/35" /> : <ChevronDown className="size-4 text-white/35" />}
                </button>
                {open ? <p className="m-0 px-4 pb-4 text-xs leading-7 text-white/50">{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </main>
  );
}

function AlertBox({ tone, title, body }: { tone: "success" | "danger" | "warning"; title: string; body: string }) {
  const toneClass = tone === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : tone === "warning" ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-red-500/20 bg-red-500/10 text-red-300";
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-2xl border p-4 ${toneClass}`}>
      <Icon className="mt-1 size-4 shrink-0" />
      <div>
        <strong className="block text-sm">{title}</strong>
        <p className="m-0 mt-1 text-xs leading-6 text-white/60">{body}</p>
      </div>
    </div>
  );
}

function ErrorText({ text }: { text: string }) {
  return <p className="m-0 mt-2 text-xs font-bold text-red-300">{text}</p>;
}

function Timeline({ logs }: { logs: LogData[] }) {
  return (
    <div className="grid gap-0">
      {logs.map((log, idx) => (
        <div key={log.id} className="grid grid-cols-[24px,1fr] gap-3 border-b border-white/[0.05] py-3 last:border-0">
          <div className="flex flex-col items-center">
            <span className={`mt-1 size-3 rounded-full ${log.action === "APPROVED" ? "bg-emerald-400" : log.action === "REJECTED" ? "bg-red-400" : "bg-[#f3cf73]"}`} />
            {idx < logs.length - 1 ? <span className="mt-1 min-h-6 w-px flex-1 bg-white/[0.08]" /> : null}
          </div>
          <div>
            <strong className="block text-sm text-[#fff7e8]">{LOG_LABELS[log.action] ?? log.action}</strong>
            {log.note ? <p className="m-0 mt-1 text-xs leading-6 text-white/50">{log.note}</p> : null}
            <span className="mt-1 block text-[0.68rem] text-white/30">{formatDate(log.createdAt)}{log.actorName ? ` · ${log.actorName}` : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const FAQ_ITEMS = [
  { q: "كيف أعرف أن الدفع تم بنجاح؟", a: "بعد تقديم الطلب ستظهر حالته داخل هذه الصفحة ولوحة التحكم. عند موافقة الإدارة يتم تفعيل الاشتراك تلقائياً." },
  { q: "كم تستغرق مراجعة الطلب؟", a: "تتم مراجعة الطلبات يدوياً حسب سياسة الإدارة. حالة الطلب ستبقى واضحة أمامك طوال الوقت." },
  { q: "هل أستطيع تعديل الطلب بعد الإرسال؟", a: "لا. بعد الإرسال يتم قفل الطلب لحماية بيانات الدفع. يستطيع الأدمن طلب إعادة رفع الإثبات إذا كانت الصورة غير واضحة." },
  { q: "هل يمكن إضافة Stripe أو PayPal لاحقاً؟", a: "نعم. النظام مبني حول Payment Settings حتى يمكن إضافة وسائل دفع مستقبلية بدون تغيير رحلة العميل." },
];

const AFTER_PAYMENT_STEPS = [
  { title: "مراجعة الطلب", description: "الأدمن يراجع بيانات العميل، الباقة، وسيلة الدفع، وإثبات الدفع." },
  { title: "قبول أو رفض", description: "في حالة الرفض يظهر السبب للعميل. وفي حالة القبول يتم التفعيل مباشرة." },
  { title: "تفعيل الموقع", description: "يتم تحديث الاشتراك وحالة الموقع وإرسال إشعار للعميل داخل النظام." },
];
