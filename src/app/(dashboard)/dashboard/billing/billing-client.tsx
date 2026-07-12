"use client";

import { useActionState, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, CreditCard, Loader2, Package, Sparkles, Upload, X } from "lucide-react";

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
  metadata: unknown;
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
type FeatureSheetKind = "basic" | "pro";

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
const BASIC_PRICE_AMOUNT = 40;
const BASIC_CURRENCY = "EGP";
const BASIC_INTERVAL = "monthly";

const BASIC_VISIBLE_FEATURES = [
  "معرض خاص لكل عميل (رابط + كلمة مرور)",
  "موقع احترافي كامل",
  "صفحة أسعار وباقات",
  "معرض أعمال",
  "مساحة تخزين 1 GB",
  "لينك واحد لكل شغلك",
  "لوحة تحكم كاملة",
  "تعديل الموقع في أي وقت",
];

const BASIC_EXTRA_FEATURES = [
  "تصميم متجاوب ومحسن للموبايل",
  "استضافة مجانية داخل منصة FrameID",
  "شهادة SSL للرابط المنشور",
  "تحديثات مجانية للمنصة",
  "دعم فني من داخل لوحة التحكم",
  "صفحات وبيانات التواصل",
  "تحسين أساسي للظهور في محركات البحث",
  "إدارة الباقات والأسعار من لوحة التحكم",
  "رفع الصور والألبومات من لوحة التحكم",
  "رابط عام جاهز للمشاركة مع العملاء",
];

const PRO_VISIBLE_FEATURES = [
  "دومين مخصص",
  "إزالة شعار FrameID",
  "مساحة تخزين 10 GB",
  "معرض خاص للعملاء بجودة أصلية",
  "حجز المواعيد أونلاين",
  "قوالب حصرية إضافية",
  "إحصائيات متقدمة",
  "دعم فني بأولوية",
];

const PRO_FUTURE_FEATURES = [
  "Google Analytics",
  "Meta Pixel",
  "Google Search Console",
  "Instagram Feed",
  "WhatsApp API",
  "Messenger Integration",
  "فيديو داخل المعرض",
  "معرض غير محدود",
  "صفحات إضافية",
  "Blog",
  "Reviews",
  "CRM",
  "AI Features",
  "Team Members",
  "API",
  "Automation للتسويق والمتابعة",
  "تقارير تحميل ومشاهدة المعارض",
];

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

function buildBasicPlan(plan: PlanData | undefined): PlanData | null {
  if (!plan) return null;
  return {
    ...plan,
    name: "الباقة الأساسية",
    priceAmount: BASIC_PRICE_AMOUNT,
    currency: BASIC_CURRENCY,
    billingInterval: BASIC_INTERVAL,
  };
}

export function BillingClient({ session, plans, paymentMethods, paymentRequest, daysRemaining, requested, draftId, error: urlError }: BillingClientProps) {
  const subscriptionStatus = session.subscription?.status ?? session.tenant.status;
  const requestLocked = Boolean(paymentRequest && LOCKED_REQUEST_STATUSES.includes(paymentRequest.status));
  const siteHref = session.site.slug ? `/p/${session.site.slug}` : "/dashboard";

  const basicPlan = useMemo(() => buildBasicPlan(plans.find((plan) => plan.isActive)), [plans]);
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
  const [featureSheet, setFeatureSheet] = useState<FeatureSheetKind | null>(null);
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

  const selectedPlan = selectedPlanId && basicPlan?.id === selectedPlanId ? basicPlan : undefined;
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
      setSelectedPlanId(null);
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
        .billing-step-motion { animation: billingStepIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes billingStepIn {
          from { opacity: 0; transform: translateY(14px) scale(0.985); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) { .billing-step-motion { animation: none; } }
      `}</style>

      <BuilderPageHeader
        eyebrow="التفعيل"
        title={subscriptionStatus === "ACTIVE" ? "اشتراكك نشط" : "تفعيل الاشتراك"}
        description={subscriptionStatus === "ACTIVE" ? "اشتراكك مفعل ويمكنك استخدام كل الميزات." : "ابدأ بالباقة الأساسية الآن، واطلب التفعيل بعد تحويل الاشتراك الشهري."}
      />

      {urlError ? <Alert tone="danger" title="حدث خطأ" text={urlError === "no-subscription" ? "لا يوجد اشتراك نشط. يرجى إنشاء الموقع أولاً." : urlError} /> : null}
      {subscriptionStatus === "ACTIVE" ? <Alert tone="success" title="تم التفعيل" text="الموقع مفعل بالفعل." /> : null}
      {subscriptionStatus !== "ACTIVE" ? <TrialNotice daysRemaining={daysRemaining} submitted={submitted} status={paymentRequest?.status ?? null} /> : null}

      {subscriptionStatus !== "ACTIVE" ? (
        <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-3 sm:p-4">
          <StepTabs steps={stepConfig} current={step} onSelect={goToStep} />

          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/15 p-3 sm:p-4">
            <AnimatedStepPanel stageKey={stageKey}>
              {step === 1 ? (
                <CheckoutStage title="اختار الباقة" icon={<Package className="size-4" />}>
                  {basicPlan ? (
                    <div className="grid gap-3 lg:grid-cols-[1.06fr_0.94fr]">
                      <BasicPlanCard
                        plan={basicPlan}
                        selected={selectedPlanId === basicPlan.id}
                        disabled={Boolean(draftState || requestLocked)}
                        onSelect={() => handlePlanSelect(basicPlan.id)}
                        onShowDetails={() => setFeatureSheet("basic")}
                      />
                      <FutureProPlanCard onShowDetails={() => setFeatureSheet("pro")} />
                    </div>
                  ) : <Alert tone="warning" title="لا توجد باقات" text="لا توجد باقات مفعلة حاليًا. تواصل مع الدعم الفني." />}
                  <Actions>
                    <Button type="button" variant="luxury" disabled={!selectedPlan} onClick={() => setStep(2)}>متابعة بالباقة الأساسية</Button>
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
                    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                      <div className="flex flex-col gap-3">
                        <PaymentInstructionCard
                          account={selectedAccount}
                          method={selectedMethod}
                          fallbackMethod={paymentRequest?.method ?? null}
                          copied={copiedKey === "pay-account"}
                          onCopy={() => selectedAccount ? copyToClipboard(selectedAccount.phoneNumber ?? selectedAccount.accountNumber, "pay-account") : undefined}
                        />
                        <PaymentAmountCard plan={selectedPlan} request={paymentRequest} />
                      </div>
                      <div className="flex flex-col gap-3">
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
                          <form action={submitAction} className="mt-auto">
                            <input type="hidden" name="draftId" value={draftState} />
                            <Button type="submit" variant="luxury" className="w-full" disabled={!canSubmitExistingProof || submitPending}>{submitPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{submitPending ? "جاري تقديم الطلب..." : "تقديم الطلب الآن"}</Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
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

      {featureSheet ? <FeatureBottomSheet kind={featureSheet} onClose={() => setFeatureSheet(null)} /> : null}
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

function BasicPlanCard({ plan, selected, disabled, onSelect, onShowDetails }: { plan: PlanData; selected: boolean; disabled: boolean; onSelect: () => void; onShowDetails: () => void }) {
  return (
    <article className={`relative overflow-hidden rounded-[1.65rem] border p-4 text-right shadow-2xl shadow-amber-950/20 ${selected ? "border-amber-300/75 bg-amber-500/12" : "border-amber-300/30 bg-[linear-gradient(145deg,rgba(243,207,115,0.13),rgba(255,255,255,0.035))]"}`}>
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-amber-200/70 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full border border-amber-200/24 bg-amber-200/10 px-3 py-1 text-[0.68rem] font-black text-[#f3cf73]">الأكثر مناسبة للبداية</span>
          <h3 className="mt-3 text-xl font-black text-[#fff7e8]">الباقة الأساسية</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-white/45">كل ما تحتاجه لنشر موقعك واستقبال عملائك.</p>
        </div>
        {selected ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300 px-2.5 py-1 text-[0.68rem] font-black text-black"><Check size={12} />مختارة</span> : null}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <strong className="text-4xl font-black text-[#f3cf73]">40</strong>
        <span className="pb-1 text-sm font-black text-white/50">جنيه / شهريًا</span>
      </div>

      <ul className="mt-4 grid gap-2 text-sm font-bold text-white/70">
        {BASIC_VISIBLE_FEATURES.map((feature) => <FeatureItem key={feature}>{feature}</FeatureItem>)}
      </ul>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" disabled={disabled} onClick={onSelect} className={`min-h-11 rounded-2xl px-4 text-sm font-black transition ${selected ? "bg-emerald-300 text-black" : "bg-[#f3cf73] text-[#17120a] hover:bg-[#ffe08a]"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>{selected ? "تم اختيار الباقة" : "اختيار الباقة"}</button>
        <button type="button" onClick={onShowDetails} className="min-h-11 rounded-2xl border border-white/12 bg-white/[0.045] px-4 text-sm font-black text-white/75 transition hover:border-amber-300/30 hover:text-white">عرض كل المميزات</button>
      </div>
    </article>
  );
}

function FutureProPlanCard({ onShowDetails }: { onShowDetails: () => void }) {
  return (
    <article className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.025] p-4 text-right opacity-95">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%)]" aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full border border-sky-300/22 bg-sky-300/10 px-3 py-1 text-[0.68rem] font-black text-sky-200">قريبًا</span>
            <h3 className="mt-3 text-xl font-black text-[#fff7e8]">Pro</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-white/42">إصدار مستقبلي للمصورين الذين يحتاجون توسعًا أكبر.</p>
          </div>
          <Sparkles className="size-6 text-sky-200/70" />
        </div>

        <div className="mt-4 flex items-end gap-2">
          <strong className="text-3xl font-black text-white/70">قريبًا</strong>
        </div>

        <ul className="mt-4 grid gap-2 text-sm font-bold text-white/58">
          {PRO_VISIBLE_FEATURES.map((feature) => <FeatureItem key={feature} muted>{feature}</FeatureItem>)}
        </ul>

        <div className="mt-4 grid gap-2">
          <button type="button" disabled className="min-h-11 cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-white/32">الشراء غير متاح حاليًا</button>
          <button type="button" onClick={onShowDetails} className="min-h-11 rounded-2xl border border-sky-300/18 bg-sky-300/8 px-4 text-sm font-black text-sky-100 transition hover:bg-sky-300/12">عرض كل المميزات القادمة</button>
        </div>
      </div>
    </article>
  );
}

function FeatureItem({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <li className="flex gap-2"><CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${muted ? "text-sky-200/60" : "text-emerald-300"}`} /> <span>{children}</span></li>;
}

function FeatureBottomSheet({ kind, onClose }: { kind: FeatureSheetKind; onClose: () => void }) {
  const isPro = kind === "pro";
  const title = isPro ? "كل المميزات القادمة في Pro" : "كل مميزات الباقة الأساسية";
  const description = isPro ? "هذه أفكار ومميزات مستقبلية مقترحة، وليست متاحة حاليًا داخل الاشتراك." : "هذه مميزات متاحة فعليًا في المنصة أو ضمن تجربة استخدام FrameID الحالية.";
  const features = isPro ? PRO_FUTURE_FEATURES : [...BASIC_VISIBLE_FEATURES, ...BASIC_EXTRA_FEATURES];

  return (
    <div className="fixed inset-0 z-50 grid items-end bg-black/65 p-2 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="إغلاق" className="absolute inset-0" onClick={onClose} />
      <section className="relative mx-auto grid max-h-[86dvh] w-full max-w-2xl gap-4 overflow-hidden rounded-t-[1.8rem] border border-white/12 bg-[#10131a] p-4 shadow-2xl sm:rounded-[1.8rem] sm:p-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[0.68rem] font-black uppercase tracking-[0.2em] ${isPro ? "text-sky-200" : "text-[#f3cf73]"}`}>{isPro ? "Future Roadmap" : "Available Now"}</p>
            <h3 className="mt-1 text-xl font-black text-[#fff7e8]">{title}</h3>
            <p className="mt-1 text-xs font-bold leading-6 text-white/48">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"><X className="size-5" /></button>
        </header>
        <div className="grid max-h-[58dvh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {features.map((feature) => <div key={feature} className="flex gap-2 rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-sm font-bold leading-6 text-white/72"><CheckCircle2 className={`mt-1 size-4 shrink-0 ${isPro ? "text-sky-200" : "text-emerald-300"}`} />{feature}</div>)}
        </div>
      </section>
    </div>
  );
}

function PaymentMethodPicker({ methods, selectedMethodId, selectedPlanId, pending, action, onMethodSelect }: { methods: PaymentMethodData[]; selectedMethodId: string | null; selectedPlanId: string | null; pending: boolean; action: (payload: FormData) => void; onMethodSelect: (methodId: string) => void }) {
  const availableMethods = methods.filter((method) => method.isActive && method.accounts.length > 0);
  if (!selectedPlanId) return <Alert tone="warning" title="اختار الباقة أولًا" text="لازم تختار الباقة الأساسية قبل وسيلة الدفع." />;
  if (availableMethods.length === 0) return <Alert tone="warning" title="لا توجد وسائل دفع" text="وسائل الدفع اليدوية غير مفعلة حاليًا." />;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {availableMethods.map((method) => {
        const selected = selectedMethodId === method.id;
        const isInstapay = method.paymentMethod === "INSTAPAY";
        return (
          <form key={method.id} action={action}>
            <input type="hidden" name="planId" value={selectedPlanId} />
            <input type="hidden" name="method" value={method.paymentMethod} />
            <input type="hidden" name="paymentMethodId" value={method.id} />
            <input type="hidden" name="paymentAccountId" value={method.accounts[0]?.id ?? ""} />
            <button type="submit" disabled={pending} onClick={() => onMethodSelect(method.id)} className={`group relative flex min-h-36 w-full flex-col items-start justify-between overflow-hidden rounded-3xl border p-4 text-right transition sm:p-5 ${selected ? "border-amber-400/60 bg-amber-500/10" : "border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] hover:border-white/20"} ${pending ? "cursor-wait opacity-70" : ""}`}>
              {selected ? <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(243,207,115,0.08),transparent_60%)]" /> : null}
              <div className="flex items-center gap-3">
                <div className={`grid size-10 shrink-0 place-items-center rounded-2xl transition ${isInstapay ? "bg-rose-500/12 group-hover:bg-rose-500/18" : "bg-red-500/12 group-hover:bg-red-500/18"}`}>
                  <CreditCard className={`size-5 ${isInstapay ? "text-rose-400" : "text-red-400"}`} />
                </div>
                <div>
                  <span className="flex items-center gap-2 text-base font-black text-[#fff7e8]">{method.label ?? getPaymentMethodLabel(method.paymentMethod)}</span>
                  <span className="mt-0.5 block text-xs text-white/40">{method.description ?? "تحويل يدوي"}</span>
                </div>
              </div>
              <span className="mt-3 self-end rounded-full border border-amber-400/18 bg-amber-500/10 px-3 py-1 text-[0.55rem] font-black text-[#f3cf73] transition group-hover:bg-amber-500/15">{pending ? "جاري التجهيز..." : "اختار وابدأ"}</span>
            </button>
          </form>
        );
      })}
    </div>
  );
}

function PaymentInstructionCard({ account, method, fallbackMethod, copied, onCopy }: { account: PaymentAccountData | null | undefined; method: PaymentMethodData | null | undefined; fallbackMethod: string | null; copied: boolean; onCopy: () => void }) {
  const accountNumber = account?.accountNumber ?? "";
  const ownerName = "Badr A** B** H****";
  return (
    <div className="overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-b from-amber-500/10 to-amber-500/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/15">
            <CreditCard className="size-4 text-[#f3cf73]" />
          </div>
          <div>
            <p className="text-[0.55rem] font-black tracking-[0.15em] text-white/25">حول على</p>
            <h3 className="text-base font-black text-[#fff7e8]">{method?.label ?? getPaymentMethodLabel(method?.paymentMethod ?? fallbackMethod ?? "الدفع")}</h3>
          </div>
        </div>
        <span className="rounded-full border border-amber-400/18 bg-amber-500/10 px-2.5 py-1 text-[0.5rem] font-black text-[#f3cf73]">يدوي</span>
      </div>
      <button type="button" onClick={onCopy} className="group relative w-full px-4 py-4 text-right transition hover:bg-white/[0.01] active:bg-white/[0.02] sm:px-5 sm:py-5">
        <div className="flex items-center justify-between">
          <p className="text-[0.55rem] font-black tracking-[0.15em] text-white/25">رقم الحساب</p>
          <span className={`flex items-center gap-1 text-[0.55rem] font-black transition-all ${copied ? "text-emerald-400" : "text-white/20 opacity-0 group-hover:opacity-100"}`}>
            {copied ? <><CheckCircle2 className="size-3" /> تم النسخ</> : <><Copy className="size-3" /> نسخ</>}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p dir="ltr" className={`text-xl font-black tracking-wider transition-colors sm:text-2xl ${copied ? "text-emerald-400" : "text-[#f3cf73]"}`}>{accountNumber || "غير متاح"}</p>
          <div className={`grid size-9 shrink-0 place-items-center rounded-xl transition-all ${copied ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.04] text-white/25 group-hover:bg-white/[0.07] group-hover:text-white/50"}`}>
            {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-2.5 sm:px-5">
        <div>
          <p className="text-[0.5rem] font-black tracking-[0.15em] text-white/20">صاحب الحساب</p>
          <p className="mt-0.5 text-sm font-bold text-white/65" dir="ltr">{ownerName}</p>
        </div>
        <div className="shrink-0 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
          <p className="text-[0.5rem] font-black tracking-wider text-white/20">{method?.paymentMethod === "VODAFONE_CASH" ? "CASH" : "INSTAPAY"}</p>
        </div>
      </div>
      {account?.instructions ? <p className="border-t border-white/[0.04] px-4 py-2.5 text-[0.7rem] leading-6 text-white/40 sm:px-5">{account.instructions}</p> : null}
    </div>
  );
}

function PaymentAmountCard({ plan, request }: { plan: PlanData | undefined; request: PaymentRequestData | null }) {
  const amount = (request?.amount ?? plan?.priceAmount ?? BASIC_PRICE_AMOUNT).toLocaleString();
  const currency = request?.currency ?? plan?.currency ?? BASIC_CURRENCY;
  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01]">
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/12">
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[0.55rem] font-black tracking-[0.15em] text-white/25">المبلغ المطلوب</p>
            <p className="mt-0.5 text-2xl font-black text-[#fff7e8] sm:text-3xl">{amount} <span className="text-sm font-black text-white/40">{currency}</span></p>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 sm:flex">
          <Package className="size-3 text-white/30" />
          <span className="text-[0.55rem] font-black text-white/35">{plan?.name ?? "الباقة الأساسية"}</span>
        </div>
      </div>
    </div>
  );
}

function ProofSubmitCard({ draftId, proofFile, proofUploaded, pending, canSubmit, action, onFileSelect }: { draftId: string; proofFile: File | null; proofUploaded: boolean; pending: boolean; canSubmit: boolean; action: (payload: FormData) => void; onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <form action={action} className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01]">
      <div className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 sm:px-5">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/12">
          <Upload className="size-4 text-sky-400" />
        </div>
        <div>
          <p className="text-[0.55rem] font-black tracking-[0.15em] text-white/25">الخطوة الأخيرة</p>
          <h3 className="text-sm font-black text-[#fff7e8]">إثبات الدفع</h3>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-white/[0.12] bg-black/20 p-5 text-center transition hover:border-amber-400/30 hover:bg-black/30">
          <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10">
            <Upload className="size-6 text-[#f3cf73]" />
          </div>
          <span className="text-sm font-black text-[#fff7e8]">ارفع صورة إثبات الدفع</span>
          <span className="text-xs text-white/35">JPEG / PNG / WebP — حتى 5MB</span>
          <input type="file" name="proof" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelect} />
        </label>
        {proofFile ? <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-300"><CheckCircle2 className="size-3.5" /> تم اختيار: {proofFile.name}</p> : null}
        {proofUploaded ? <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-300"><CheckCircle2 className="size-3.5" /> تم رفع إثبات الدفع بنجاح</p> : null}
        <Button type="submit" variant="luxury" className="mt-4 w-full" disabled={!canSubmit || pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{pending ? "جاري رفع الصورة..." : "تم الدفع — قدم طلب التفعيل"}</Button>
      </div>
    </form>
  );
}

function FinalSummary({ plan, method, account, uploadSucceeded, request }: { plan: PlanData | undefined; method: PaymentMethodData | null | undefined; account: PaymentAccountData | null | undefined; uploadSucceeded: boolean; request: PaymentRequestData | null }) {
  return <div className="grid gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-sm text-white/55"><p>الباقة: <b className="text-white">{plan?.name ?? "الباقة الأساسية"}</b></p><p>وسيلة الدفع: <b className="text-white">{method?.label ?? getPaymentMethodLabel(request?.method ?? "—")}</b></p><p>الحساب: <b className="text-white">{account?.phoneNumber ?? account?.accountNumber ?? "—"}</b></p><p>إثبات الدفع: <b className={uploadSucceeded ? "text-emerald-300" : "text-amber-300"}>{uploadSucceeded ? "مرفوع" : "غير مرفوع"}</b></p></div>;
}

function SuccessReceiptCard({ receiptNumber, status, rejectionReason, copied, dashboardHref, siteHref, onCopy }: { receiptNumber: string; status: string; rejectionReason: string | null; copied: boolean; dashboardHref: string; siteHref: string; onCopy: () => void }) {
  return (
    <div className="grid gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4">
      <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-full bg-emerald-400 text-black"><Check className="size-5" /></span><div><h3 className="text-lg font-black text-[#fff7e8]">تم تقديم طلب التفعيل</h3><p className="mt-1 text-sm text-white/55">الحالة: {REQUEST_STATUS_LABELS[status] ?? status}</p></div></div>
      <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3"><p className="text-xs text-white/40">رقم الإيصال</p><p dir="ltr" className="mt-1 break-all text-sm font-black text-[#f3cf73]">{receiptNumber}</p></div>
      {rejectionReason ? <Alert tone="danger" title="سبب الرفض" text={rejectionReason} /> : null}
      <div className="grid gap-2 sm:grid-cols-3"><Button type="button" variant="secondary" onClick={onCopy}>{copied ? <CheckCircle2 className="size-4" /> : <CreditCard className="size-4" />}{copied ? "اتنسخ" : "نسخ الإيصال"}</Button><a href={dashboardHref} className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-champagne px-4 text-sm font-bold text-amber-950">الرئيسية</a><a href={siteHref} target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-white/[0.08] px-4 text-sm font-bold text-white/70">فتح الموقع</a></div>
      <a href={getSupportHref(receiptNumber)} className="text-sm font-bold text-[#f3cf73]">تواصل مع الدعم بخصوص الطلب</a>
    </div>
  );
}

function CancelDraftForm({ draftId, cancelAction, pending }: { draftId: string; cancelAction: (payload: FormData) => void; pending: boolean }) {
  return <form action={cancelAction}><input type="hidden" name="draftId" value={draftId} /><Button type="submit" variant="ghost" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}إلغاء الطلب</Button></form>;
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2 pt-2">{children}</div>;
}

function ErrorText({ text }: { text: string }) {
  return <p className="text-sm font-bold text-red-300">{text}</p>;
}

function Alert({ tone, title, text }: { tone: "success" | "warning" | "danger"; title: string; text: string }) {
  const style = tone === "success" ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : tone === "warning" ? "border-amber-400/20 bg-amber-500/10 text-amber-100" : "border-red-400/20 bg-red-500/10 text-red-100";
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  return <div className={`flex gap-3 rounded-2xl border p-3 ${style}`}><Icon className="mt-0.5 size-5 shrink-0" /><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-sm opacity-75">{text}</p></div></div>;
}
