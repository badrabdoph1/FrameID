"use client";

import { useActionState, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, CreditCard, Loader2, Package, Upload, X } from "lucide-react";

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

type PaymentAccountData = {
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
  accounts: PaymentAccountData[];
};

type PaymentRequestData = {
  id: string;
  status: string;
  method: string;
  paymentAccountId: string | null;
  amount: number;
  currency: string;
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
type CheckoutStep = 1 | 2 | 3;

type StepConfig = {
  step: CheckoutStep;
  title: string;
  done: boolean;
  available: boolean;
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "تم الإرسال",
  PENDING: "قيد الانتظار",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "تمت الموافقة",
  REJECTED: "مرفوض",
  CANCELLED: "ملغي",
  EXPIRED: "منتهي",
  REFUNDED: "مسترد",
};

const LOCKED_REQUEST_STATUSES = ["SUBMITTED", "PENDING", "UNDER_REVIEW", "APPROVED"];
const SUPPORT_EMAIL = "support@frameid.app";

function getPaymentMethodLabel(method: string): string {
  return ({ INSTAPAY: "إنستا باي", VODAFONE_CASH: "فودافون كاش", STRIPE: "Stripe", PAYPAL: "PayPal" } as Record<string, string>)[method] ?? method;
}

function getBillingIntervalLabel(interval: string): string {
  return ({ monthly: "شهري", yearly: "سنوي", annual: "سنوي", lifetime: "مدى الحياة" } as Record<string, string>)[interval] ?? interval;
}

function normalizePlanFeatures(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (!features || typeof features !== "object") return [];

  const record = features as Record<string, unknown>;
  const labels: string[] = [];

  if (record.publicSite) labels.push("موقع عام جاهز للنشر");
  if (record.dashboard) labels.push("لوحة تحكم كاملة");
  if (typeof record.themes === "number") labels.push(`${record.themes} قالب متاح`);
  if (typeof record.galleryImages === "number") labels.push(`حتى ${record.galleryImages.toLocaleString()} صورة`);
  if (record.customDomain === true) labels.push("دومين مخصص");
  if (record.customDomain === false) labels.push("بدون دومين مخصص");
  if (record.storage) labels.push(`مساحة ${String(record.storage)}`);
  if (record.priority === "vip") labels.push("دعم VIP");
  else if (record.priority === "high") labels.push("دعم أولوية عالية");
  else if (record.priority === "standard") labels.push("دعم عادي");
  if (record.manualActivation) labels.push("تفعيل يدوي آمن");

  return labels;
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

function getInitialStep(paymentRequest: PaymentRequestData | null, hasDraft: boolean, hasProof: boolean): CheckoutStep {
  if (paymentRequest && LOCKED_REQUEST_STATUSES.includes(paymentRequest.status)) return 3;
  if (hasDraft || hasProof) return 2;
  return 1;
}

function getSupportHref(receiptNumber: string): string {
  const subject = encodeURIComponent("متابعة طلب تفعيل FrameID");
  const body = encodeURIComponent(`مرحبًا، أحتاج مساعدة في متابعة طلب التفعيل.\nرقم الإيصال: ${receiptNumber}`);
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export function BillingClient({ session, plans, paymentMethods, paymentRequest, daysRemaining, requested, draftId, error: urlError }: BillingClientProps) {
  const subscriptionStatus = session.subscription?.status ?? session.tenant.status;
  const requestLocked = Boolean(paymentRequest && LOCKED_REQUEST_STATUSES.includes(paymentRequest.status));
  const siteHref = session.site.slug ? `/${session.site.slug}` : "/dashboard";

  const visiblePlans = useMemo(() => plans.filter((plan) => plan.isActive).slice(0, 2), [plans]);
  const initialMethod = useMemo(() => paymentMethods.find((method) => method.paymentMethod === paymentRequest?.method) ?? null, [paymentMethods, paymentRequest?.method]);
  const initialAccount = useMemo(() => initialMethod?.accounts.find((account) => account.id === paymentRequest?.paymentAccountId) ?? initialMethod?.accounts[0] ?? null, [initialMethod, paymentRequest?.paymentAccountId]);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(paymentRequest?.planId ?? null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(initialMethod?.id ?? null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(initialAccount?.id ?? paymentRequest?.paymentAccountId ?? null);
  const [draftState, setDraftState] = useState<string | null>(paymentRequest?.id ?? draftId ?? null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploaded, setProofUploaded] = useState(Boolean(paymentRequest?.proofAssetId));
  const [fileError, setFileError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [step, setStep] = useState<CheckoutStep>(() => getInitialStep(paymentRequest, Boolean(paymentRequest?.id ?? draftId), Boolean(paymentRequest?.proofAssetId)));

  const [createState, createAction, createPending] = useActionState<ActionResult | null, FormData>(async (_prev, fd) => createPaymentDraftAction(fd), null);
  const [completePaymentState, completePaymentAction, completePaymentPending] = useActionState<ActionResult | null, FormData>(async (_prev, fd) => {
    const uploaded = await uploadProofAction(fd);
    if (!uploaded.success) return uploaded;

    const submittedForm = new FormData();
    submittedForm.set("draftId", String(fd.get("draftId") ?? ""));
    const submittedResult = await submitPaymentRequestAction(submittedForm);

    if (submittedResult.success) {
      setProofUploaded(true);
      setProofFile(null);
      setStep(3);
    }

    return submittedResult;
  }, null);
  const [submitState, submitAction, submitPending] = useActionState<ActionResult | null, FormData>(async (_prev, fd) => submitPaymentRequestAction(fd), null);
  const [cancelState, cancelAction, cancelPending] = useActionState<ActionResult | null, FormData>(async (_prev, fd) => cancelPaymentRequestAction(fd), null);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId), [plans, selectedPlanId]);
  const selectedMethod = useMemo(() => paymentMethods.find((method) => method.id === selectedMethodId) ?? initialMethod, [paymentMethods, selectedMethodId, initialMethod]);
  const selectedAccount = useMemo(() => selectedMethod?.accounts.find((account) => account.id === selectedAccountId) ?? selectedMethod?.accounts[0] ?? initialAccount, [selectedMethod, selectedAccountId, initialAccount]);

  const uploadSucceeded = proofUploaded || isActionSuccess(completePaymentState);
  const submitted = requested || requestLocked || isActionSuccess(submitState) || isActionSuccess(completePaymentState);
  const canUploadAndSubmit = Boolean(draftState && proofFile && !requestLocked);
  const canSubmitExistingProof = Boolean(draftState && uploadSucceeded && !requestLocked);
  const receiptNumber = paymentRequest?.id ?? draftState ?? draftId ?? "FRAMEID-PENDING";
  const stageKey = `${step}-${draftState ? "draft" : "select"}-${submitted ? "submitted" : "editing"}`;

  const stepConfig: StepConfig[] = [
    { step: 1, title: "الباقة", done: Boolean(selectedPlan || draftState), available: !requestLocked },
    { step: 2, title: "الدفع", done: Boolean(draftState && uploadSucceeded), available: Boolean(selectedPlan || draftState) && !requestLocked },
    { step: 3, title: "الإيصال", done: submitted, available: Boolean(draftState && uploadSucceeded) || submitted || requestLocked },
  ];

  useEffect(() => {
    if (isActionSuccess(createState) && createState.draftId) {
      setDraftState(createState.draftId);
      setStep(2);
    }
  }, [createState]);

  useEffect(() => {
    if (isActionSuccess(submitState)) setStep(3);
  }, [submitState]);

  useEffect(() => {
    if (isActionSuccess(cancelState)) {
      setDraftState(null);
      setProofUploaded(false);
      setProofFile(null);
      setSelectedMethodId(null);
      setSelectedAccountId(null);
      setStep(1);
    }
  }, [cancelState]);

  function goToStep(nextStep: CheckoutStep) {
    const target = stepConfig.find((item) => item.step === nextStep);
    if (target?.available) setStep(nextStep);
  }

  function handlePlanSelect(planId: string) {
    if (draftState || requestLocked) return;
    setSelectedPlanId(planId);
  }

  function handleMethodSelect(methodId: string) {
    if (draftState || requestLocked) return;
    const method = paymentMethods.find((item) => item.id === methodId) ?? null;
    setSelectedMethodId(methodId);
    setSelectedAccountId(method?.accounts[0]?.id ?? null);
  }

  async function copyToClipboard(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600);
    } catch {
      setCopiedKey(null);
    }
  }

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
    setProofUploaded(false);
    setProofFile(file);
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4">
      <style>{`
        .billing-step-motion {
          animation: billingStepIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes billingStepIn {
          from { opacity: 0; transform: translateY(14px) scale(0.985); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .billing-step-motion { animation: none; }
        }
      `}</style>

      <BuilderPageHeader
        eyebrow="التفعيل"
        title={subscriptionStatus === "ACTIVE" ? "اشتراكك نشط" : "تفعيل الاشتراك"}
        description={subscriptionStatus === "ACTIVE" ? "اشتراكك مفعل ويمكنك استخدام كل الميزات." : "اختار الباقة، حوّل المبلغ، ارفع إثبات الدفع، وسيتم مراجعة الطلب خلال 24 ساعة."}
      />

      {urlError ? <Alert tone="danger" title="حدث خطأ" text={urlError === "no-subscription" ? "لا يوجد اشتراك نشط. يرجى إنشاء الموقع أولاً." : urlError} /> : null}
      {subscriptionStatus === "ACTIVE" ? <Alert tone="success" title="تم التفعيل" text="الموقع مفعل بالفعل." /> : null}
      {subscriptionStatus !== "ACTIVE" ? <TrialNotice daysRemaining={daysRemaining} submitted={submitted} status={paymentRequest?.status ?? null} /> : null}

      {subscriptionStatus !== "ACTIVE" ? (
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-4">
          <StepTabs steps={stepConfig} current={step} onSelect={goToStep} />

          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/15 p-4">
            <AnimatedStepPanel stageKey={stageKey}>
              {step === 1 ? (
                <CheckoutStage title="اختار الباقة" icon={<Package className="size-4" />}>
                  {visiblePlans.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {visiblePlans.map((plan) => (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          selected={selectedPlanId === plan.id}
                          disabled={Boolean(draftState || requestLocked)}
                          onSelect={() => handlePlanSelect(plan.id)}
                        />
                      ))}
                    </div>
                  ) : <Alert tone="warning" title="لا توجد باقات" text="لا توجد باقات مفعلة حاليًا. تواصل مع الدعم الفني." />}
                  <Actions>
                    <Button type="button" variant="luxury" disabled={!selectedPlan} onClick={() => setStep(2)}>متابعة</Button>
                  </Actions>
                </CheckoutStage>
              ) : null}

              {step === 2 ? (
                <CheckoutStage title={draftState ? "الدفع والإثبات" : "اختار وسيلة الدفع"} icon={<CreditCard className="size-4" />}>
                  {!draftState ? (
                    <>
                      <PaymentMethodPicker
                        methods={paymentMethods}
                        selectedMethodId={selectedMethodId}
                        selectedPlanId={selectedPlanId}
                        pending={createPending}
                        action={createAction}
                        onMethodSelect={handleMethodSelect}
                      />
                      {getActionError(createState) ? <ErrorText text={getActionError(createState)!} /> : null}
                    </>
                  ) : (
                    <>
                      <PaymentInstructionCard
                        account={selectedAccount}
                        method={selectedMethod}
                        plan={selectedPlan}
                        fallbackMethod={paymentRequest?.method ?? null}
                        copied={copiedKey === "pay-account"}
                        onCopy={() => selectedAccount ? copyToClipboard(selectedAccount.phoneNumber ?? selectedAccount.accountNumber, "pay-account") : undefined}
                      />
                      <PaymentAmountCard plan={selectedPlan} request={paymentRequest} />
                      <ProofSubmitCard
                        draftId={draftState}
                        proofFile={proofFile}
                        proofUploaded={uploadSucceeded}
                        pending={completePaymentPending}
                        canSubmit={canUploadAndSubmit}
                        action={completePaymentAction}
                        onFileSelect={handleFileSelect}
                      />
                      {fileError ? <ErrorText text={fileError} /> : null}
                      {getActionError(completePaymentState) ? <ErrorText text={getActionError(completePaymentState)!} /> : null}
                      {uploadSucceeded && !submitted ? (
                        <form action={submitAction}>
                          <input type="hidden" name="draftId" value={draftState} />
                          <Button type="submit" variant="luxury" disabled={!canSubmitExistingProof || submitPending}>{submitPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{submitPending ? "جاري تقديم الطلب..." : "تقديم الطلب الآن"}</Button>
                        </form>
                      ) : null}
                    </>
                  )}

                  <Actions>
                    {!draftState ? <Button type="button" variant="ghost" onClick={() => setStep(1)}>رجوع</Button> : null}
                    {draftState && !requestLocked && !submitted ? <CancelDraftForm draftId={draftState} cancelAction={cancelAction} pending={cancelPending} /> : null}
                  </Actions>
                </CheckoutStage>
              ) : null}

              {step === 3 ? (
                <CheckoutStage title="معلومات الدفع" icon={<CheckCircle2 className="size-4" />}>
                  {submitted ? (
                    <SuccessReceiptCard
                      receiptNumber={receiptNumber}
                      status={paymentRequest?.status ?? (isActionSuccess(completePaymentState) || isActionSuccess(submitState) ? "SUBMITTED" : "PENDING")}
                      rejectionReason={paymentRequest?.rejectionReason ?? null}
                      copied={copiedKey === "receipt"}
                      dashboardHref="/dashboard"
                      siteHref={siteHref}
                      onCopy={() => copyToClipboard(receiptNumber, "receipt")}
                    />
                  ) : (
                    <>
                      <FinalSummary plan={selectedPlan} method={selectedMethod} account={selectedAccount} uploadSucceeded={uploadSucceeded} request={paymentRequest} />
                      <form action={submitAction}>
                        <input type="hidden" name="draftId" value={draftState ?? ""} />
                        <Button type="submit" variant="luxury" disabled={!canSubmitExistingProof || submitPending}>{submitPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{submitPending ? "جاري تقديم الطلب..." : "تقديم الطلب"}</Button>
                      </form>
                    </>
                  )}
                  {getActionError(submitState) ? <ErrorText text={getActionError(submitState)!} /> : null}
                  {getActionError(cancelState) ? <ErrorText text={getActionError(cancelState)!} /> : null}
                  <Actions>{!requestLocked && !submitted ? <Button type="button" variant="ghost" onClick={() => setStep(2)}>رجوع</Button> : null}</Actions>
                </CheckoutStage>
              ) : null}
            </AnimatedStepPanel>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function AnimatedStepPanel({ stageKey, children }: { stageKey: string; children: ReactNode }) {
  return <div key={stageKey} className="billing-step-motion">{children}</div>;
}

function TrialNotice({ daysRemaining, submitted, status }: { daysRemaining: number; submitted: boolean; status: string | null }) {
  if (submitted || status) return <Alert tone="success" title="طلب التفعيل" text={`الحالة: ${REQUEST_STATUS_LABELS[status ?? "SUBMITTED"] ?? status ?? "تم الإرسال"}`} />;
  return <Alert tone="warning" title="الفترة التجريبية" text={daysRemaining > 0 ? `متبقي ${daysRemaining} يوم.` : "التجربة انتهت. فعّل الاشتراك للاستمرار."} />;
}

function StepTabs({ steps, current, onSelect }: { steps: StepConfig[]; current: CheckoutStep; onSelect: (step: CheckoutStep) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((item) => (
        <button key={item.step} type="button" disabled={!item.available} onClick={() => onSelect(item.step)} className={`rounded-2xl border px-2 py-3 text-center transition ${current === item.step ? "border-amber-400/50 bg-amber-500/10" : item.done ? "border-emerald-500/20 bg-emerald-500/10" : "border-white/[0.07] bg-black/10"} ${!item.available ? "cursor-not-allowed opacity-55" : "hover:border-white/20"}`}>
          <span className={`mx-auto mb-1 grid size-6 place-items-center rounded-full text-xs font-black ${item.done ? "bg-emerald-400 text-black" : current === item.step ? "bg-[#f3cf73] text-black" : "bg-white/10 text-white/40"}`}>{item.done ? <Check size={13} /> : item.step}</span>
          <strong className="block truncate text-[0.72rem] text-white/60">{item.title}</strong>
        </button>
      ))}
    </div>
  );
}

function CheckoutStage({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
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

function PlanCard({ plan, selected, disabled, onSelect }: { plan: PlanData; selected: boolean; disabled: boolean; onSelect: () => void }) {
  const features = normalizePlanFeatures(plan.features);
  const visibleFeatures = features.slice(0, 6);
  const remainingFeatures = Math.max(features.length - visibleFeatures.length, 0);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`flex min-h-[22rem] flex-col rounded-3xl border p-4 text-right transition ${selected ? "border-amber-400/70 bg-amber-500/10 shadow-2xl shadow-amber-950/20" : "border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-[0.68rem] font-black text-white/45" dir="ltr">{plan.code}</span>
        {selected ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-2 py-1 text-[0.68rem] font-black text-black"><Check size={12} />مختارة</span> : <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[0.68rem] font-black text-white/35">اختيار</span>}
      </span>

      <strong className="text-base font-black leading-7 text-[#fff7e8]">{plan.name}</strong>
      <span className="mt-2 flex items-end gap-1 text-[#f3cf73]" dir="ltr">
        <strong className="text-2xl font-black leading-none">{plan.priceAmount.toLocaleString()}</strong>
        <small className="pb-0.5 text-xs font-bold">{plan.currency}</small>
      </span>
      <span className="mt-1 text-xs font-bold text-white/35">اشتراك {getBillingIntervalLabel(plan.billingInterval)}</span>

      <span className="my-4 h-px w-full bg-white/[0.08]" />

      <span className="grid flex-1 gap-2">
        {visibleFeatures.length > 0 ? visibleFeatures.map((feature) => (
          <span key={feature} className="flex items-start gap-2 text-xs leading-6 text-white/60">
            <Check className="mt-1 size-3.5 shrink-0 text-emerald-300" />
            <span>{feature}</span>
          </span>
        )) : <span className="text-xs leading-6 text-white/35">باقة مناسبة للبدء.</span>}
        {remainingFeatures > 0 ? <span className="text-xs font-black text-[#f3cf73]">+ {remainingFeatures} ميزة إضافية</span> : null}
      </span>

      <span className={`mt-4 grid h-10 place-items-center rounded-xl text-xs font-black ${selected ? "bg-[#f3cf73] text-black" : "bg-white/[0.06] text-white/55"}`}>{selected ? "تم اختيار هذه الباقة" : "اختار هذه الباقة"}</span>
    </button>
  );
}

function PaymentMethodPicker({ methods, selectedMethodId, selectedPlanId, pending, action, onMethodSelect }: { methods: PaymentMethodData[]; selectedMethodId: string | null; selectedPlanId: string | null; pending: boolean; action: (payload: FormData) => void; onMethodSelect: (id: string) => void }) {
  if (methods.length === 0) return <Alert tone="warning" title="لا توجد وسائل دفع" text="الأدمن يحتاج يفعّل وسيلة دفع أولاً." />;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {methods.map((method) => {
        const selected = selectedMethodId === method.id;
        const account = method.accounts[0] ?? null;
        const disabled = !selectedPlanId || !account || pending;
        return (
          <form key={method.id} action={action}>
            <input type="hidden" name="planId" value={selectedPlanId ?? ""} />
            <input type="hidden" name="method" value={method.paymentMethod} />
            <input type="hidden" name="accountId" value={account?.id ?? ""} />
            <button type="submit" disabled={disabled} onMouseDown={() => onMethodSelect(method.id)} onTouchStart={() => onMethodSelect(method.id)} className={`min-h-28 w-full rounded-2xl border p-4 text-right transition ${selected ? "border-amber-400/60 bg-amber-500/10" : "border-white/[0.08] bg-white/[0.025] hover:border-white/20"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
              <span className="flex items-center justify-between gap-3">
                <strong className="text-sm font-black text-[#fff7e8]">{method.label ?? getPaymentMethodLabel(method.paymentMethod)}</strong>
                {pending && selected ? <Loader2 className="size-5 animate-spin text-[#f3cf73]" /> : selected ? <CheckCircle2 className="size-5 text-emerald-300" /> : <CreditCard className="size-5 text-white/30" />}
              </span>
              <small className="mt-2 block text-xs leading-6 text-white/40">{!account ? "لا يوجد رقم دفع متاح" : pending && selected ? "جاري تجهيز الدفع..." : "اضغط للذهاب للدفع مباشرة"}</small>
            </button>
          </form>
        );
      })}
    </div>
  );
}

function PaymentInstructionCard({ account, method, plan, copied, onCopy, fallbackMethod }: { account: PaymentAccountData | null; method: PaymentMethodData | null | undefined; plan: PlanData | undefined; copied: boolean; onCopy: () => void; fallbackMethod?: string | null }) {
  const methodLabel = method ? (method.label ?? getPaymentMethodLabel(method.paymentMethod)) : fallbackMethod ? getPaymentMethodLabel(fallbackMethod) : "وسيلة الدفع";
  const number = account?.phoneNumber ?? account?.accountNumber ?? "";

  return (
    <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-white/[0.04] to-emerald-500/10 p-4 shadow-2xl shadow-amber-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-black text-[#f3cf73]">{methodLabel}</span>
          <h3 className="m-0 mt-1 text-lg font-black text-[#fff7e8]">حوّل قيمة المبلغ على هذا الرقم</h3>
          {plan ? <p className="m-0 mt-1 text-xs text-white/45">المبلغ المطلوب: {plan.priceAmount.toLocaleString()} {plan.currency}</p> : null}
        </div>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">آمن ومباشر</span>
      </div>

      {number ? (
        <button type="button" onClick={onCopy} className="mt-4 grid w-full gap-1 rounded-2xl border border-amber-300/30 bg-black/25 p-4 text-center shadow-inner transition hover:border-amber-300/60 hover:bg-black/35">
          <strong className="text-2xl font-black tracking-wider text-[#f3cf73]" dir="ltr">{number}</strong>
          <small className="text-xs font-bold text-white/45">{copied ? "تم النسخ ✅" : "👆 اضغط على الرقم للنسخ"}</small>
        </button>
      ) : <Alert tone="warning" title="لا يوجد رقم" text="لم يتم ربط رقم دفع بهذه الوسيلة." />}
    </div>
  );
}

function PaymentAmountCard({ plan, request }: { plan: PlanData | undefined; request: PaymentRequestData | null }) {
  const amount = plan ? `${plan.priceAmount.toLocaleString()} ${plan.currency}` : request ? `${request.amount.toLocaleString()} ${request.currency}` : "محفوظ";
  return (
    <div className="grid gap-2 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4">
      <span className="text-xs font-black text-white/35">تفاصيل الاشتراك</span>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <strong className="text-base font-black text-[#fff7e8]">{plan?.name ?? "الباقة المختارة"}</strong>
        <strong className="rounded-2xl bg-[#f3cf73] px-4 py-2 text-sm font-black text-black" dir="ltr">{amount}</strong>
      </div>
    </div>
  );
}

function ProofSubmitCard({ draftId, proofFile, proofUploaded, pending, canSubmit, action, onFileSelect }: { draftId: string; proofFile: File | null; proofUploaded: boolean; pending: boolean; canSubmit: boolean; action: (payload: FormData) => void; onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4">
      <input type="hidden" name="draftId" value={draftId} />
      <input id="proof-input" name="proof" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileSelect} className="hidden" />
      <label htmlFor="proof-input" className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 bg-black/20 px-4 text-center transition hover:bg-white/[0.04]">
        <Upload className="size-6 text-[#f3cf73]" />
        <strong className="text-sm text-[#fff7e8]">{proofFile ? proofFile.name : proofUploaded ? "تم رفع إثبات الدفع" : "ارفع سكرين صورة التحويل"}</strong>
        <small className="text-white/35">JPEG / PNG / WebP — بحد أقصى 5MB</small>
      </label>
      <Button type="submit" variant="luxury" disabled={!canSubmit || pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{pending ? "جاري تقديم الطلب..." : "تم الدفع ~ قدم طلب"}</Button>
    </form>
  );
}

function SuccessReceiptCard({ receiptNumber, status, rejectionReason, copied, dashboardHref, siteHref, onCopy }: { receiptNumber: string; status: string; rejectionReason: string | null; copied: boolean; dashboardHref: string; siteHref: string; onCopy: () => void }) {
  const rejected = status === "REJECTED";
  return (
    <div className="grid gap-4">
      <div className={`rounded-3xl border p-5 ${rejected ? "border-red-500/20 bg-red-500/10" : "border-emerald-500/20 bg-emerald-500/10"}`}>
        <span className={rejected ? "text-xs font-black text-red-300" : "text-xs font-black text-emerald-300"}>{REQUEST_STATUS_LABELS[status] ?? status}</span>
        <h3 className="m-0 mt-1 text-xl font-black text-[#fff7e8]">{rejected ? "الطلب يحتاج مراجعة" : "تم تقديم الطلب بنجاح"}</h3>
        <p className="m-0 mt-2 text-sm leading-7 text-white/55">عادة يتم قبول طلبات التفعيل خلال أول 24 ساعة. إذا تأخر قبول الطلب، تواصل مع الدعم الفني وقدم رقم الإيصال المرفق.</p>
        {rejected ? <p className="m-0 mt-2 text-xs font-bold text-red-300">سبب الرفض: {rejectionReason ?? "غير محدد"}</p> : null}
      </div>

      <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-white/[0.04] to-black/20 p-4 shadow-2xl shadow-amber-950/20">
        <span className="text-xs font-black text-[#f3cf73]">كارت الإيصال</span>
        <button type="button" onClick={onCopy} className="mt-3 grid w-full gap-1 rounded-2xl border border-amber-300/30 bg-black/25 p-4 text-center transition hover:border-amber-300/60">
          <strong className="break-all text-lg font-black text-[#fff7e8]" dir="ltr">{receiptNumber}</strong>
          <small className="text-xs font-bold text-white/45">{copied ? "تم نسخ الإيصال ✅" : "👆 اضغط لنسخ رقم الإيصال"}</small>
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <a href={dashboardHref} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#f3cf73] px-4 text-sm font-black text-black transition hover:opacity-90">العودة للوحة التحكم</a>
        <a href={siteHref} className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/15">فتح الموقع</a>
        <a href={getSupportHref(receiptNumber)} className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 text-sm font-black text-[#fff7e8] transition hover:bg-white/[0.1]">الدعم الفني</a>
      </div>
    </div>
  );
}

function FinalSummary({ plan, method, account, uploadSucceeded, request }: { plan: PlanData | undefined; method: PaymentMethodData | null | undefined; account: PaymentAccountData | null; uploadSucceeded: boolean; request: PaymentRequestData | null }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 text-sm">
      <SummaryLine label="الباقة" value={plan?.name ?? "محفوظة في الطلب"} />
      <SummaryLine label="المبلغ" value={plan ? `${plan.priceAmount.toLocaleString()} ${plan.currency}` : request ? `${request.amount.toLocaleString()} ${request.currency}` : "محفوظ"} ltr />
      <SummaryLine label="الدفع" value={method ? (method.label ?? getPaymentMethodLabel(method.paymentMethod)) : request ? getPaymentMethodLabel(request.method) : "محفوظ"} />
      <SummaryLine label="الإثبات" value={uploadSucceeded ? "تم الرفع" : "لم يرفع"} />
      {account ? <SummaryLine label="الحساب" value={account.label ?? account.accountName} /> : null}
    </div>
  );
}

function CancelDraftForm({ draftId, cancelAction, pending }: { draftId: string; cancelAction: (payload: FormData) => void; pending: boolean }) {
  return <form action={cancelAction}><input type="hidden" name="draftId" value={draftId} /><Button type="submit" variant="ghost" disabled={pending} style={{ color: "#f87171" }}>{pending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}إلغاء الطلب</Button></form>;
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">{children}</div>;
}

function SummaryLine({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return <div className="flex justify-between gap-3"><span className="text-white/35">{label}</span><strong className="truncate text-[#fff7e8]" dir={ltr ? "ltr" : undefined}>{value}</strong></div>;
}

function Alert({ tone, title, text }: { tone: "success" | "danger" | "warning"; title: string; text: string }) {
  const className = tone === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : tone === "warning" ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-red-500/20 bg-red-500/10 text-red-300";
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  return <div className={`flex items-start gap-3 rounded-2xl border p-3 ${className}`}><Icon className="mt-1 size-4 shrink-0" /><div><strong className="block text-sm">{title}</strong><p className="m-0 mt-1 text-xs leading-6 text-white/60">{text}</p></div></div>;
}

function ErrorText({ text }: { text: string }) {
  return <p className="m-0 text-xs font-bold text-red-300">{text}</p>;
}
