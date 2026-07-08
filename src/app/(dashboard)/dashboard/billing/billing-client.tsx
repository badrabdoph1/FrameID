"use client";

import { useActionState, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, CreditCard, FileImage, Loader2, Package, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BuilderPageHeader } from "@/components/dashboard/builder-primitives";
import {
  cancelPaymentRequestAction,
  createPaymentDraftAction,
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

type ActionResult = { success: true; draftId?: string } | { success: false; error: string };
type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "الباقة",
  2: "الدفع",
  3: "تأكيد",
  4: "الإثبات",
  5: "الإرسال",
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "تم الإرسال",
  PENDING: "قيد الانتظار",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "تمت الموافقة",
  REJECTED: "مرفوض",
  CANCELLED: "ملغي",
};

function getPaymentMethodLabel(method: string): string {
  return ({ INSTAPAY: "إنستا باي", VODAFONE_CASH: "فودافون كاش", STRIPE: "Stripe", PAYPAL: "PayPal" } as Record<string, string>)[method] ?? method;
}

function isActionSuccess(state: unknown): state is Extract<ActionResult, { success: true }> {
  return Boolean(state && typeof state === "object" && (state as Record<string, unknown>).success === true);
}

function isActionFailure(state: unknown): state is Extract<ActionResult, { success: false }> {
  if (!state || typeof state !== "object") return false;
  const record = state as Record<string, unknown>;
  return record.success === false && typeof record.error === "string";
}

function getActionError(state: unknown): string | null {
  return isActionFailure(state) ? state.error : null;
}

function getInitialStep(paymentRequest: PaymentRequestData | null, hasDraft: boolean, hasProof: boolean): WizardStep {
  if (paymentRequest && !["DRAFT", "REJECTED", "CANCELLED"].includes(paymentRequest.status)) return 5;
  if (hasProof) return 5;
  if (hasDraft) return 4;
  return 1;
}

export function BillingClient({ session, plans, paymentMethods, paymentRequest, daysRemaining, requested, draftId, error: urlError }: BillingClientProps) {
  const subscriptionStatus = session.subscription?.status ?? session.tenant.status;
  const requestLocked = Boolean(paymentRequest && !["DRAFT", "REJECTED", "CANCELLED"].includes(paymentRequest.status));

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(paymentRequest?.planId ?? null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [reference, setReference] = useState(paymentRequest?.reference ?? "");
  const [draftState, setDraftState] = useState<string | null>(paymentRequest?.id ?? draftId ?? null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploaded, setProofUploaded] = useState(Boolean(paymentRequest?.proofAssetId));
  const [fileError, setFileError] = useState<string | null>(null);
  const [step, setStep] = useState<WizardStep>(() => getInitialStep(paymentRequest, Boolean(paymentRequest?.id ?? draftId), Boolean(paymentRequest?.proofAssetId)));

  const [createState, createAction, createPending] = useActionState<ActionResult | null, FormData>(async (_prev, fd) => {
    const result = await createPaymentDraftAction(fd);
    if (result.success && result.draftId) {
      setDraftState(result.draftId);
      setStep(4);
    }
    return result;
  }, null);

  const [uploadState, uploadAction, uploadPending] = useActionState<ActionResult | null, FormData>(async (_prev, fd) => {
    const result = await uploadProofAction(fd);
    if (result.success) {
      setProofUploaded(true);
      setProofFile(null);
      setStep(5);
    }
    return result;
  }, null);

  const [submitState, submitAction, submitPending] = useActionState<ActionResult | null, FormData>(async (_prev, fd) => {
    const result = await submitPaymentRequestAction(fd);
    if (result.success) setStep(5);
    return result;
  }, null);

  const [cancelState, cancelAction, cancelPending] = useActionState<ActionResult | null, FormData>(async (_prev, fd) => {
    const result = await cancelPaymentRequestAction(fd);
    if (result.success) {
      setDraftState(null);
      setProofUploaded(false);
      setProofFile(null);
      setSelectedMethodId(null);
      setSelectedAccountId(null);
      setStep(1);
    }
    return result;
  }, null);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId), [plans, selectedPlanId]);
  const selectedMethod = useMemo(() => paymentMethods.find((method) => method.id === selectedMethodId), [paymentMethods, selectedMethodId]);
  const selectedAccount = useMemo(() => selectedMethod?.accounts.find((account) => account.id === selectedAccountId) ?? null, [selectedMethod, selectedAccountId]);

  const hasPaymentChoice = Boolean(selectedMethod && selectedAccount);
  const canCreateDraft = Boolean(selectedPlan && hasPaymentChoice && !draftState && !requestLocked);
  const canUploadProof = Boolean(draftState && proofFile && !requestLocked);
  const uploadSucceeded = proofUploaded || isActionSuccess(uploadState);
  const canSubmit = Boolean(draftState && uploadSucceeded && !requestLocked);
  const submitted = requested || requestLocked || isActionSuccess(submitState);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFileError("اختار صورة JPEG أو PNG أو WebP فقط.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("الصورة أكبر من 5MB.");
      e.target.value = "";
      return;
    }
    setFileError(null);
    setProofFile(file);
    setProofUploaded(false);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <BuilderPageHeader
        eyebrow="التفعيل"
        title={subscriptionStatus === "ACTIVE" ? "اشتراكك نشط" : "تفعيل بسيط في 5 خطوات"}
        description="كل خطوة قصيرة وواضحة. لن تظهر أي تفاصيل إضافية إلا عند الحاجة."
      />

      {urlError ? <Alert tone="danger" title="حدث خطأ" text={urlError === "no-subscription" ? "لا يوجد اشتراك نشط. يرجى إنشاء الموقع أولاً." : urlError} /> : null}
      {subscriptionStatus === "ACTIVE" ? <Alert tone="success" title="تم التفعيل" text="اشتراكك مفعل ويمكنك استخدام كل الميزات." /> : null}
      {subscriptionStatus !== "ACTIVE" ? <TopNotice daysRemaining={daysRemaining} paymentRequest={paymentRequest} submitted={submitted} /> : null}

      {subscriptionStatus !== "ACTIVE" ? (
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-2xl shadow-black/20">
          <StepDots current={step} />

          <div className="mt-5 min-h-[300px] rounded-2xl border border-white/[0.07] bg-black/15 p-4">
            {step === 1 ? (
              <CompactStage title="اختار الباقة" icon={<Package className="size-4" />}>
                <div className="grid gap-2">
                  {plans.map((plan) => (
                    <ChoiceRow key={plan.id} selected={selectedPlanId === plan.id} disabled={Boolean(draftState || requestLocked)} onClick={() => setSelectedPlanId(plan.id)}>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm text-[#fff7e8]">{plan.name}</strong>
                        <small className="text-white/35" dir="ltr">{plan.code}</small>
                      </span>
                      <span className="shrink-0 text-sm font-black text-[#f3cf73]" dir="ltr">{plan.priceAmount.toLocaleString()} {plan.currency}</span>
                    </ChoiceRow>
                  ))}
                </div>
                <FooterActions>
                  <Button type="button" variant="luxury" disabled={!selectedPlan} onClick={() => setStep(2)}>التالي</Button>
                </FooterActions>
              </CompactStage>
            ) : null}

            {step === 2 ? (
              <CompactStage title="اختار الدفع" icon={<CreditCard className="size-4" />}>
                {paymentMethods.length === 0 ? <Alert tone="warning" title="لا توجد وسائل دفع" text="الأدمن يحتاج يفعّل وسيلة دفع أولاً." /> : (
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      {paymentMethods.map((method) => (
                        <ChoiceRow key={method.id} selected={selectedMethodId === method.id} disabled={Boolean(draftState || requestLocked)} onClick={() => { setSelectedMethodId(method.id); setSelectedAccountId(null); }}>
                          <span className="text-sm font-black text-[#fff7e8]">{method.label ?? getPaymentMethodLabel(method.paymentMethod)}</span>
                          <small className="text-white/35">اختيار</small>
                        </ChoiceRow>
                      ))}
                    </div>
                    {selectedMethod ? (
                      <div className="grid gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                        <span className="text-xs font-black text-white/35">اختار الحساب</span>
                        {selectedMethod.accounts.map((account) => (
                          <ChoiceRow key={account.id} selected={selectedAccountId === account.id} disabled={Boolean(draftState || requestLocked)} onClick={() => setSelectedAccountId(account.id)}>
                            <span className="min-w-0">
                              <strong className="block truncate text-sm text-[#fff7e8]">{account.label ?? account.accountName}</strong>
                              <small className="block truncate text-white/35" dir="ltr">{account.phoneNumber ?? account.accountNumber}</small>
                            </span>
                            <small className="text-white/35">اختيار</small>
                          </ChoiceRow>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
                <FooterActions>
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>السابق</Button>
                  <Button type="button" variant="luxury" disabled={!hasPaymentChoice && !draftState} onClick={() => setStep(3)}>التالي</Button>
                </FooterActions>
              </CompactStage>
            ) : null}

            {step === 3 ? (
              <CompactStage title="تأكيد سريع" icon={<CheckCircle2 className="size-4" />}>
                <MiniSummary selectedPlan={selectedPlan} selectedMethod={selectedMethod} selectedAccount={selectedAccount} uploadSucceeded={uploadSucceeded} />
                <input value={reference} onChange={(e) => setReference(e.target.value)} disabled={Boolean(draftState || requestLocked)} placeholder="رقم العملية اختياري" className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/25" dir="ltr" />
                {!draftState ? (
                  <form action={createAction}>
                    <input type="hidden" name="planId" value={selectedPlanId ?? ""} />
                    <input type="hidden" name="method" value={selectedMethod?.paymentMethod ?? ""} />
                    <input type="hidden" name="accountId" value={selectedAccountId ?? ""} />
                    <input type="hidden" name="reference" value={reference} />
                    <Button type="submit" variant="luxury" disabled={!canCreateDraft || createPending}>{createPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{createPending ? "جاري الحفظ..." : "حفظ ومتابعة"}</Button>
                  </form>
                ) : <Alert tone="success" title="تم الحفظ" text="ارفع إثبات الدفع في الخطوة التالية." />}
                {getActionError(createState) ? <ErrorText text={getActionError(createState)!} /> : null}
                <FooterActions>
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>السابق</Button>
                  <Button type="button" variant="luxury" disabled={!draftState} onClick={() => setStep(4)}>التالي</Button>
                </FooterActions>
              </CompactStage>
            ) : null}

            {step === 4 ? (
              <CompactStage title="ارفع إثبات الدفع" icon={<FileImage className="size-4" />}>
                <form action={uploadAction} className="grid gap-3">
                  <input type="hidden" name="draftId" value={draftState ?? ""} />
                  <input id="proof-input" name="proof" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} className="hidden" />
                  <label htmlFor="proof-input" className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] px-4 text-center hover:bg-white/[0.04]">
                    <Upload className="size-5 text-[#f3cf73]" />
                    <strong className="text-sm text-[#fff7e8]">{proofFile ? proofFile.name : uploadSucceeded ? "تم رفع الإثبات" : "اختار صورة التحويل"}</strong>
                    <small className="text-white/35">JPEG / PNG / WebP - بحد أقصى 5MB</small>
                  </label>
                  {proofFile ? <Button type="submit" variant="luxury" disabled={!canUploadProof || uploadPending}>{uploadPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{uploadPending ? "جاري الرفع..." : "رفع الصورة"}</Button> : null}
                </form>
                {fileError ? <ErrorText text={fileError} /> : null}
                {getActionError(uploadState) ? <ErrorText text={getActionError(uploadState)!} /> : null}
                <FooterActions>
                  <Button type="button" variant="ghost" onClick={() => setStep(3)}>السابق</Button>
                  <Button type="button" variant="luxury" disabled={!uploadSucceeded} onClick={() => setStep(5)}>التالي</Button>
                </FooterActions>
              </CompactStage>
            ) : null}

            {step === 5 ? (
              <CompactStage title="إرسال الطلب" icon={<CheckCircle2 className="size-4" />}>
                {submitted ? (
                  <StatusCard status={paymentRequest?.status ?? (isActionSuccess(submitState) ? "SUBMITTED" : "PENDING")} rejectionReason={paymentRequest?.rejectionReason ?? null} />
                ) : (
                  <>
                    <MiniSummary selectedPlan={selectedPlan} selectedMethod={selectedMethod} selectedAccount={selectedAccount} uploadSucceeded={uploadSucceeded} />
                    <form action={submitAction}>
                      <input type="hidden" name="draftId" value={draftState ?? ""} />
                      <Button type="submit" variant="luxury" disabled={!canSubmit || submitPending}>{submitPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{submitPending ? "جاري الإرسال..." : "إرسال للأدمن"}</Button>
                    </form>
                    {draftState ? <form action={cancelAction}><input type="hidden" name="draftId" value={draftState} /><Button type="submit" variant="ghost" disabled={cancelPending} style={{ color: "#f87171" }}>{cancelPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}إلغاء</Button></form> : null}
                  </>
                )}
                {getActionError(submitState) ? <ErrorText text={getActionError(submitState)!} /> : null}
                {getActionError(cancelState) ? <ErrorText text={getActionError(cancelState)!} /> : null}
                <FooterActions>{!requestLocked ? <Button type="button" variant="ghost" onClick={() => setStep(4)}>السابق</Button> : null}</FooterActions>
              </CompactStage>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function TopNotice({ daysRemaining, paymentRequest, submitted }: { daysRemaining: number; paymentRequest: PaymentRequestData | null; submitted: boolean }) {
  if (submitted || paymentRequest) {
    const status = paymentRequest?.status ?? "SUBMITTED";
    return <Alert tone="success" title="طلب التفعيل" text={`الحالة الحالية: ${REQUEST_STATUS_LABELS[status] ?? status}`} />;
  }
  return <Alert tone="warning" title="الفترة التجريبية" text={daysRemaining > 0 ? `متبقي ${daysRemaining} يوم.` : "انتهت الفترة التجريبية. فعّل الاشتراك للاستمرار."} />;
}

function StepDots({ current }: { current: WizardStep }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {([1, 2, 3, 4, 5] as WizardStep[]).map((item) => (
        <div key={item} className={`rounded-2xl border px-2 py-3 text-center ${current === item ? "border-amber-400/50 bg-amber-500/10" : current > item ? "border-emerald-500/20 bg-emerald-500/8" : "border-white/[0.07] bg-black/10"}`}>
          <span className={`mx-auto mb-1 grid size-6 place-items-center rounded-full text-xs font-black ${current > item ? "bg-emerald-400 text-black" : current === item ? "bg-[#f3cf73] text-black" : "bg-white/8 text-white/40"}`}>{current > item ? <Check size={13} /> : item}</span>
          <strong className="block truncate text-[0.68rem] text-white/55">{STEP_LABELS[item]}</strong>
        </div>
      ))}
    </div>
  );
}

function CompactStage({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-[#f3cf73]">{icon}</span>
        <h2 className="m-0 text-lg font-black text-[#fff7e8]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ChoiceRow({ selected, disabled, onClick, children }: { selected: boolean; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 text-right transition ${selected ? "border-amber-400/60 bg-amber-500/10" : "border-white/[0.08] bg-white/[0.025] hover:border-white/20"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
      {children}
    </button>
  );
}

function MiniSummary({ selectedPlan, selectedMethod, selectedAccount, uploadSucceeded }: { selectedPlan: PlanData | undefined; selectedMethod: PaymentMethodData | undefined; selectedAccount: PaymentMethodData["accounts"][number] | null; uploadSucceeded: boolean }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 text-sm">
      <SummaryLine label="الباقة" value={selectedPlan?.name ?? "محفوظة"} />
      <SummaryLine label="الدفع" value={selectedMethod ? (selectedMethod.label ?? getPaymentMethodLabel(selectedMethod.paymentMethod)) : "محفوظ"} />
      <SummaryLine label="الحساب" value={selectedAccount?.label ?? selectedAccount?.accountName ?? "محفوظ"} />
      <SummaryLine label="الإثبات" value={uploadSucceeded ? "تم الرفع" : "لم يرفع بعد"} />
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><span className="text-white/35">{label}</span><strong className="truncate text-[#fff7e8]">{value}</strong></div>;
}

function FooterActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">{children}</div>;
}

function StatusCard({ status, rejectionReason }: { status: string; rejectionReason: string | null }) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
      <strong className="block text-sm text-emerald-300">{REQUEST_STATUS_LABELS[status] ?? status}</strong>
      <p className="m-0 mt-1 text-xs leading-6 text-white/55">طلبك وصل للإدارة. تابع الحالة من نفس الصفحة.</p>
      {status === "REJECTED" ? <p className="m-0 mt-2 text-xs font-bold text-red-300">سبب الرفض: {rejectionReason ?? "غير محدد"}</p> : null}
    </div>
  );
}

function Alert({ tone, title, text }: { tone: "success" | "danger" | "warning"; title: string; text: string }) {
  const className = tone === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : tone === "warning" ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-red-500/20 bg-red-500/10 text-red-300";
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  return <div className={`flex items-start gap-3 rounded-2xl border p-3 ${className}`}><Icon className="mt-1 size-4 shrink-0" /><div><strong className="block text-sm">{title}</strong><p className="m-0 mt-1 text-xs leading-6 text-white/60">{text}</p></div></div>;
}

function ErrorText({ text }: { text: string }) {
  return <p className="m-0 text-xs font-bold text-red-300">{text}</p>;
}
