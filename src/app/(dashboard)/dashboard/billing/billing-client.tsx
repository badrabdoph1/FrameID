"use client";

import { useActionState, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
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
  updatePaymentDraftAction,
  uploadProofAction,
} from "@/app/(dashboard)/dashboard/billing/actions";

/* ─── Types ────────────────────────────────────── */

type PlanData = {
  id: string;
  code: string;
  name: string;
  priceAmount: number;
  currency: string;
  billingInterval: string;
  features: string[];
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

/* ─── Helpers ──────────────────────────────────── */

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; border: string }> = {
  TRIAL: { label: "نسخة تجريبية", color: "#f3cf73", bg: "rgba(243, 207, 115, 0.08)", border: "rgba(243, 207, 115, 0.22)" },
  ACTIVE: { label: "مشترك", color: "#4ade80", bg: "rgba(74, 222, 128, 0.07)", border: "rgba(74, 222, 128, 0.22)" },
  EXPIRED: { label: "منتهي", color: "#f87171", bg: "rgba(248, 113, 113, 0.08)", border: "rgba(248, 113, 113, 0.24)" },
  PAST_DUE: { label: "متأخر", color: "#fb923c", bg: "rgba(251, 146, 60, 0.08)", border: "rgba(251, 146, 60, 0.22)" },
  CANCELLED: { label: "ملغي", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.08)", border: "rgba(167, 139, 250, 0.22)" },
  SUSPENDED: { label: "معلق", color: "#f87171", bg: "rgba(248, 113, 113, 0.08)", border: "rgba(248, 113, 113, 0.24)" },
};

const REQ_STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "مسودة", color: "rgba(245, 234, 214, 0.5)", bg: "rgba(255, 255, 255, 0.04)" },
  SUBMITTED: { label: "قيد المراجعة", color: "#f3cf73", bg: "rgba(243, 207, 115, 0.1)" },
  PENDING: { label: "قيد المراجعة", color: "#f3cf73", bg: "rgba(243, 207, 115, 0.1)" },
  UNDER_REVIEW: { label: "قيد المراجعة", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.1)" },
  APPROVED: { label: "تمت الموافقة", color: "#4ade80", bg: "rgba(74, 222, 128, 0.1)" },
  REJECTED: { label: "مرفوض", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
  CANCELLED: { label: "ملغي", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.1)" },
};

const LOG_LABELS: Record<string, string> = {
  SUBMITTED: "تم تقديم الطلب",
  APPROVED: "تمت الموافقة",
  REJECTED: "تم الرفض",
  REUPLOAD_REQUESTED: "طلب إعادة رفع الصورة",
  NOTE_ADDED: "ملاحظة من الإدارة",
  DRAFT_CREATED: "تم إنشاء المسودة",
};

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    INSTAPAY: "انستاباي",
    VODAFONE_CASH: "فودافون كاش",
    STRIPE: "Stripe",
    PAYPAL: "PayPal",
  };
  return labels[method] ?? method;
}

/* ─── Section Components ───────────────────────── */

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        overflow: "hidden",
        borderRadius: 16,
        border: "1px solid rgba(245, 234, 214, 0.08)",
        background: "rgba(255, 255, 255, 0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "14px 16px",
          borderBottom: "1px solid rgba(245, 234, 214, 0.06)",
        }}
      >
        {icon ? (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(243, 207, 115, 0.1)",
              color: "#f3cf73",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        ) : null}
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              color: "#fff7e8",
              fontSize: "0.95rem",
              fontWeight: 950,
              margin: 0,
            }}
          >
            {title}
          </h2>
          {description ? (
            <p
              style={{
                color: "rgba(245, 234, 214, 0.5)",
                fontSize: "0.78rem",
                lineHeight: 1.6,
                margin: "4px 0 0",
              }}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

function Badge({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: "0.72rem",
        fontWeight: 900,
        color,
        background: bg,
      }}
    >
      {label}
    </span>
  );
}

/* ─── Main Component ───────────────────────────── */

export function BillingClient({
  session,
  plans,
  paymentMethods,
  paymentRequest,
  logs,
  daysRemaining,
  requested,
  draftId,
  error: urlError,
}: BillingClientProps) {
  const { subscription, tenant } = session;
  const subStatus = subscription?.status ?? "NONE";
  const statusInfo = STATUS_INFO[subStatus] ?? STATUS_INFO.TRIAL;

  const existingPlan = subscription?.plan ?? null;

  /* ── State ── */
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    paymentRequest?.planId ?? null,
  );
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(
    paymentRequest?.proofUrl ?? null,
  );
  const [reference, setReference] = useState(paymentRequest?.reference ?? "");
  const [draftState, setDraftState] = useState<string | null>(
    paymentRequest?.id ?? draftId ?? null,
  );
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  /* ── useActionState Hooks ── */
  const [createState, createAction, createPending] = useActionState(
    async (_prev: unknown, fd: FormData) => {
      const result = await createPaymentDraftAction(fd);
      if (result.success && result.draftId) {
        setDraftState(result.draftId);
      }
      return result;
    },
    null,
  );

  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: unknown, fd: FormData) => {
      return updatePaymentDraftAction(fd);
    },
    null,
  );

  const [uploadState, uploadAction, uploadPending] = useActionState(
    async (_prev: unknown, fd: FormData) => {
      const result = await uploadProofAction(fd);
      if (result.success) {
        setProofFile(null);
      }
      return result;
    },
    null,
  );

  const [removeState, removeAction, removePending] = useActionState(
    async (_prev: unknown, fd: FormData) => {
      const result = await removeProofAction(fd);
      if (result.success) {
        setProofPreview(null);
        setProofFile(null);
      }
      return result;
    },
    null,
  );

  const [submitState, submitAction, submitPending] = useActionState(
    async (_prev: unknown, fd: FormData) => {
      const result = await submitPaymentRequestAction(fd);
      return result;
    },
    null,
  );

  const [cancelState, cancelAction, cancelPending] = useActionState(
    async (_prev: unknown, fd: FormData) => {
      const result = await cancelPaymentRequestAction(fd);
      if (result.success) {
        setDraftState(null);
        setProofPreview(null);
        setProofFile(null);
      }
      return result;
    },
    null,
  );

  /* ── Handlers ── */
  const hasDraft = !!draftState;

  const isPlanSelected = !!selectedPlanId;
  const isMethodSelected = !!selectedMethodId;
  const isAccountSelected = !!selectedAccountId;
  const isProofReady = !!proofPreview || !!proofFile;
  const canSubmit = isPlanSelected && isMethodSelected && isAccountSelected && isProofReady;

  const selectedMethod = paymentMethods.find((pm) => pm.id === selectedMethodId);
  const selectedAccount = selectedMethod?.accounts.find((a) => a.id === selectedAccountId);
  const selectedPlan = plans.find((p) => p.id === (selectedPlanId ?? paymentRequest?.planId));

  const isExistingRequestActive =
    paymentRequest &&
    !["DRAFT", "REJECTED", "CANCELLED"].includes(paymentRequest.status);

  /* ── File Handler ── */
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFileError("نوع الملف غير مدعوم. يرجى اختيار صورة JPEG, PNG, أو WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("حجم الملف يتجاوز 5 ميجابايت. يرجى اختيار صورة أصغر.");
      e.target.value = "";
      return;
    }
    setFileError(null);
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveFile() {
    setProofFile(null);
    setProofPreview(paymentRequest?.proofUrl ?? null);
  }

  /* ── Submit Handlers ── */

  function handleCreateDraft() {
    const fd = new FormData();
    fd.append("planId", selectedPlanId ?? "");
    fd.append("method", selectedMethod?.paymentMethod ?? "");
    fd.append("accountId", selectedAccountId ?? "");
    fd.append("reference", reference ?? "");
    createAction(fd);
  }

  function handleUploadProof() {
    if (!draftState || !proofFile) return;
    const fd = new FormData();
    fd.append("draftId", draftState);
    fd.append("proof", proofFile);
    uploadAction(fd);
  }

  function handleRemoveProof() {
    if (!draftState) return;
    const fd = new FormData();
    fd.append("draftId", draftState);
    removeAction(fd);
  }

  function handleSubmit() {
    if (!draftState) return;
    const fd = new FormData();
    fd.append("draftId", draftState);
    submitAction(fd);
  }

  function handleCancel() {
    if (!draftState) return;
    const fd = new FormData();
    fd.append("draftId", draftState);
    cancelAction(fd);
  }

  /* ── Helper: get error from action state ── */
  function getError(state: unknown): string | null {
    if (state && typeof state === "object" && "success" in state && !state.success) {
      return (state as unknown as { error: string }).error;
    }
    return null;
  }

  return (
    <main className="space-y-5">
      <BuilderPageHeader
        eyebrow="الاشتراك والفواتير"
        title={subStatus === "ACTIVE" ? "اشتراكك نشط" : "فعّل اشتراكك"}
        description={
          subStatus === "ACTIVE"
            ? "اشتراكك نشط ومتجدد. يمكنك متابعة استخدام جميع الميزات."
            : "اختر الباقة المناسبة لك واتبع الخطوات لتفعيل اشتراكك والاستمتاع بكل الميزات."
        }
      />

      {urlError ? (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            borderRadius: 14,
            border: "1px solid rgba(248, 113, 113, 0.24)",
            background: "rgba(248, 113, 113, 0.08)",
            color: "#f87171",
            padding: "12px 14px",
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 950 }}>
              حدث خطأ
            </p>
            <p style={{ margin: "4px 0 0", color: "rgba(245, 234, 214, 0.58)", fontSize: "0.78rem" }}>
              {urlError === "no-subscription" ? "لا يوجد اشتراك نشط. يرجى إنشاء موقع أولاً." : urlError}
            </p>
          </div>
        </div>
      ) : null}

      {requested ? (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            borderRadius: 14,
            border: "1px solid rgba(243, 207, 115, 0.22)",
            background: "rgba(243, 207, 115, 0.08)",
            color: "#f3cf73",
            padding: "12px 14px",
          }}
        >
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 950 }}>
              تم تقديم طلبك بنجاح
            </p>
            <p style={{ margin: "4px 0 0", color: "rgba(245, 234, 214, 0.58)", fontSize: "0.78rem" }}>
              سيتم مراجعة طلبك خلال 24 ساعة. ستصل إليك إشعارات عبر البريد الإلكتروني.
            </p>
          </div>
        </div>
      ) : null}

      {/* ─── Status Banner ─── */}
      <SectionCard
        title="حالة الاشتراك"
        icon={<ShieldCheck size={16} />}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Badge label={statusInfo.label} color={statusInfo.color} bg={statusInfo.bg} />

            {existingPlan ? (
              <span style={{ color: "rgba(245, 234, 214, 0.6)", fontSize: "0.82rem" }}>
                {existingPlan.name}
                {existingPlan.priceAmount > 0
                  ? ` · ${existingPlan.priceAmount.toLocaleString()} ${existingPlan.currency}`
                  : " · مجاني"}
              </span>
            ) : null}
          </div>

          {subStatus === "TRIAL" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: daysRemaining <= 3 ? "#fb923c" : "#f3cf73",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              <Clock size={16} />
              {daysRemaining === 0
                ? "انتهت الفترة التجريبية"
                : daysRemaining === 1
                  ? "آخر يوم في الفترة التجريبية"
                  : `متبقي ${daysRemaining} أيام من الفترة التجريبية`}
            </div>
          ) : subStatus === "ACTIVE" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#4ade80",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={16} />
              {subscription?.currentPeriodEnd
                ? `مشترك حتى ${formatDate(subscription.currentPeriodEnd)}`
                : "اشتراكك نشط"}
            </div>
          ) : subStatus === "EXPIRED" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#f87171",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              <AlertTriangle size={16} />
              {tenant.gracePeriodEndsAt
                ? `فترة سماح حتى ${formatDate(tenant.gracePeriodEndsAt)}`
                : "انتهى اشتراكك"}
            </div>
          ) : null}

          {isExistingRequestActive ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: "0.72rem",
                fontWeight: 900,
                color: "#f3cf73",
                background: "rgba(243, 207, 115, 0.1)",
              }}
            >
              <Clock size={12} />
              قيد المراجعة
            </span>
          ) : null}
        </div>
      </SectionCard>

      {subStatus === "ACTIVE" ? (
        <SectionCard
          title="اشتراكك نشط 🎉"
          icon={<CheckCircle2 size={16} />}
        >
          <p style={{ color: "rgba(245, 234, 214, 0.7)", fontSize: "0.85rem", lineHeight: 1.7, margin: 0 }}>
            اشتراكك مفعل بالكامل. يمكنك الاستمتاع بجميع ميزات فریم الخاص بك دون أي قيود.
            {existingPlan ? (
              <> باقتك الحالية: <strong style={{ color: "#fff7e8" }}>{existingPlan.name}</strong></>
            ) : null}
          </p>

          {paymentRequest && paymentRequest.status === "APPROVED" ? (
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(74, 222, 128, 0.06)",
                border: "1px solid rgba(74, 222, 128, 0.15)",
              }}
            >
              <p style={{ margin: 0, color: "#4ade80", fontSize: "0.82rem", fontWeight: 700 }}>
                <CheckCircle2 size={14} style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }} />
                تم تأكيد دفع آخر اشتراك بنجاح
              </p>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {/* ─── Plan Selection ─── */}
      {subStatus !== "ACTIVE" ? (
        <SectionCard
          title="اختر باقتك"
          description="اختر الباقة المناسبة لمتطلباتك"
          icon={<Package size={16} />}
        >
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isCurrentPlan = existingPlan?.code === plan.code;

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  disabled={isCurrentPlan && subStatus === "ACTIVE"}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "block",
                    borderRadius: 14,
                    border: `1px solid ${
                      isSelected ? "rgba(243, 207, 115, 0.5)" : "rgba(245, 234, 214, 0.08)"
                    }`,
                    background: isSelected
                      ? "rgba(243, 207, 115, 0.06)"
                      : "rgba(255, 255, 255, 0.02)",
                    padding: 16,
                    transition: "all 0.15s",
                    opacity: isCurrentPlan && subStatus === "ACTIVE" ? 0.6 : 1,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.borderColor = "rgba(245, 234, 214, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.borderColor = "rgba(245, 234, 214, 0.08)";
                  }}
                >
                  {isSelected ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#f3cf73",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Check size={14} color="#0a0a0a" strokeWidth={3} />
                    </div>
                  ) : null}

                  {isCurrentPlan ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: "rgba(243, 207, 115, 0.15)",
                        color: "#f3cf73",
                        fontSize: "0.65rem",
                        fontWeight: 900,
                      }}
                    >
                      باقتك الحالية
                    </div>
                  ) : null}

                  <div style={{ marginBottom: 8 }}>
                    <h3 style={{ color: "#fff7e8", fontSize: "1rem", fontWeight: 950, margin: 0 }}>
                      {plan.name}
                    </h3>
                    <p style={{ color: "rgba(245, 234, 214, 0.4)", fontSize: "0.72rem", margin: "2px 0 0" }}>
                      {plan.code}
                    </p>
                  </div>

                  <div style={{ margin: "10px 0", direction: "ltr", textAlign: "right" }}>
                    <span style={{ color: "#f3cf73", fontSize: "1.5rem", fontWeight: 950 }}>
                      {plan.priceAmount > 0 ? plan.priceAmount.toLocaleString() : "مجاني"}
                    </span>
                    {plan.priceAmount > 0 ? (
                      <span style={{ color: "rgba(245, 234, 214, 0.5)", fontSize: "0.78rem", marginRight: 4 }}>
                        {plan.currency}
                        {plan.billingInterval === "MONTHLY" ? " / شهرياً" : " / سنوياً"}
                      </span>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginTop: 12,
                    }}
                  >
                    {(plan.features ?? []).map((feature, fi) => (
                      <div
                        key={fi}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          color: "rgba(245, 234, 214, 0.6)",
                          fontSize: "0.78rem",
                          lineHeight: 1.5,
                        }}
                      >
                        <Check size={12} color="#4ade80" style={{ marginTop: 3, flexShrink: 0 }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {/* ─── Payment Method & Account Selection ─── */}
      {subStatus !== "ACTIVE" && paymentMethods.length > 0 ? (
        <SectionCard
          title="وسيلة الدفع"
          description="اختر وسيلة الدفع المناسبة لك"
          icon={<CreditCard size={16} />}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {paymentMethods.map((method) => {
              const isSelected = selectedMethodId === method.id;
              return (
                <div key={method.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMethodId(method.id);
                      setSelectedAccountId(null);
                    }}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      borderRadius: 12,
                      border: `1px solid ${
                        isSelected ? "rgba(243, 207, 115, 0.5)" : "rgba(245, 234, 214, 0.08)"
                      }`,
                      background: isSelected
                        ? "rgba(243, 207, 115, 0.06)"
                        : "rgba(255, 255, 255, 0.02)",
                      padding: "12px 14px",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.borderColor = "rgba(245, 234, 214, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.borderColor = "rgba(245, 234, 214, 0.08)";
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid ${isSelected ? "#f3cf73" : "rgba(245, 234, 214, 0.2)"}`,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected ? (
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#f3cf73",
                          }}
                        />
                      ) : null}
                    </div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <p style={{ color: "#fff7e8", fontSize: "0.88rem", fontWeight: 800, margin: 0 }}>
                        {method.label ?? getPaymentMethodLabel(method.paymentMethod)}
                      </p>
                      {method.description ? (
                        <p style={{ color: "rgba(245, 234, 214, 0.5)", fontSize: "0.75rem", margin: "2px 0 0" }}>
                          {method.description}
                        </p>
                      ) : null}
                    </div>
                    {method.qrCodeUrl ? (
                      <img
                        src={method.qrCodeUrl}
                        alt="QR"
                        style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0, objectFit: "cover" }}
                      />
                    ) : null}
                  </button>

                  {/* Accounts for selected method */}
                  {isSelected && method.accounts.length > 0 ? (
                    <div style={{ marginTop: 10, marginRight: 32, display: "flex", flexDirection: "column", gap: 8 }}>
                      {method.accounts.map((account) => {
                        const accSelected = selectedAccountId === account.id;
                        return (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => setSelectedAccountId(account.id)}
                            style={{
                              all: "unset",
                              cursor: "pointer",
                              display: "block",
                              borderRadius: 10,
                              border: `1px solid ${
                                accSelected ? "rgba(243, 207, 115, 0.4)" : "rgba(245, 234, 214, 0.06)"
                              }`,
                              background: accSelected
                                ? "rgba(243, 207, 115, 0.04)"
                                : "rgba(255, 255, 255, 0.015)",
                              padding: "10px 12px",
                              transition: "all 0.15s",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  border: `2px solid ${accSelected ? "#f3cf73" : "rgba(245, 234, 214, 0.2)"}`,
                                  display: "grid",
                                  placeItems: "center",
                                  flexShrink: 0,
                                  marginTop: 2,
                                }}
                              >
                                {accSelected ? (
                                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f3cf73" }} />
                                ) : null}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ color: "#fff7e8", fontSize: "0.82rem", fontWeight: 700, margin: 0 }}>
                                  {account.label ?? account.accountName}
                                </p>

                                <div style={{ display: "grid", gap: 3, marginTop: 6 }}>
                                  {account.accountName ? (
                                    <InfoRow label="الاسم" value={account.accountName} />
                                  ) : null}
                                  {account.accountNumber ? (
                                    <InfoRow label="الرقم" value={account.accountNumber} />
                                  ) : null}
                                  {account.bankName ? (
                                    <InfoRow label="البنك" value={account.bankName} />
                                  ) : null}
                                  {account.iban ? (
                                    <InfoRow label="IBAN" value={account.iban} />
                                  ) : null}
                                  {account.phoneNumber ? (
                                    <InfoRow label="رقم الهاتف" value={account.phoneNumber} />
                                  ) : null}
                                </div>

                                {account.instructions ? (
                                  <p
                                    style={{
                                      margin: "8px 0 0",
                                      color: "rgba(245, 234, 214, 0.5)",
                                      fontSize: "0.75rem",
                                      lineHeight: 1.6,
                                      borderTop: "1px solid rgba(245, 234, 214, 0.06)",
                                      paddingTop: 8,
                                    }}
                                  >
                                    {account.instructions}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {/* ─── Payment Proof Upload ─── */}
      {subStatus !== "ACTIVE" ? (
        <SectionCard
          title="إثبات الدفع"
          description="ارفع صورة التحويل أو الإيصال كدليل على الدفع"
          icon={<FileImage size={16} />}
        >
          {proofPreview ? (
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid rgba(245, 234, 214, 0.08)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  maxWidth: 400,
                }}
              >
                <img
                  src={proofPreview}
                  alt="صورة الإثبات"
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: 240,
                    objectFit: "contain",
                    display: "block",
                    background: "rgba(0,0,0,0.3)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    display: "flex",
                    gap: 6,
                  }}
                >
                  {proofFile ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById("proof-input") as HTMLInputElement;
                          input?.click();
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        <Upload size={12} />
                        تغيير
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: "rgba(239, 68, 68, 0.6)",
                          color: "#fff",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        <X size={12} />
                        حذف
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {!proofPreview ? (
            <label
              htmlFor="proof-input"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: "32px 16px",
                borderRadius: 12,
                border: "1px dashed rgba(245, 234, 214, 0.15)",
                background: "rgba(255, 255, 255, 0.015)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.015)";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(243, 207, 115, 0.1)",
                  display: "grid",
                  placeItems: "center",
                  color: "#f3cf73",
                }}
              >
                <Upload size={20} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#fff7e8", fontSize: "0.82rem", fontWeight: 700, margin: 0 }}>
                  اضغط لاختيار صورة الإثبات
                </p>
                <p style={{ color: "rgba(245, 234, 214, 0.4)", fontSize: "0.72rem", margin: "4px 0 0" }}>
                  JPEG, PNG, WebP فقط — حد أقصى 5MB
                </p>
              </div>
            </label>
          ) : null}

          <input
            id="proof-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {fileError ? (
            <p style={{ color: "#f87171", fontSize: "0.78rem", marginTop: 8 }}>
              {fileError}
            </p>
          ) : null}

          {proofFile && hasDraft ? (
            <form action={handleUploadProof} style={{ marginTop: 12 }}>
              <Button type="submit" variant="secondary" disabled={uploadPending}>
                {uploadPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                {uploadPending ? "جاري الرفع..." : "رفع الصورة إلى الخادم"}
              </Button>
              {getError(uploadState) ? (
                <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: 6 }}>
                  {getError(uploadState)}
                </p>
              ) : null}
            </form>
          ) : null}

          {paymentRequest?.proofAssetId && proofPreview && !proofFile ? (
            <form action={handleRemoveProof} style={{ marginTop: 12 }}>
              <input type="hidden" name="draftId" value={draftState ?? ""} />
              <Button type="submit" variant="ghost" disabled={removePending} style={{ color: "#f87171" }}>
                {removePending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileX size={14} />
                )}
                {removePending ? "جاري الحذف..." : "حذف صورة الإثبات"}
              </Button>
              {getError(removeState) ? (
                <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: 6 }}>
                  {getError(removeState)}
                </p>
              ) : null}
            </form>
          ) : null}
        </SectionCard>
      ) : null}

      {/* ─── Reference Number ─── */}
      {subStatus !== "ACTIVE" ? (
        <SectionCard
          title="رقم المرجع (اختياري)"
          description="رقم عملية التحويل أو الـ Transaction ID"
          icon={<Info size={16} />}
        >
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="أدخل رقم المرجع إن وجد"
            style={{
              width: "100%",
              minHeight: 40,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid rgba(245, 234, 214, 0.1)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#fff7e8",
              fontSize: "0.85rem",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </SectionCard>
      ) : null}

      {/* ─── Submit Section ─── */}
      {subStatus !== "ACTIVE" && !isExistingRequestActive ? (
        <SectionCard
          title="ملخص الطلب"
          description="راجع اختياراتك قبل التقديم"
          icon={<CheckCircle2 size={16} />}
        >
          <div
            style={{
              display: "grid",
              gap: 8,
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(245, 234, 214, 0.06)",
              marginBottom: 14,
            }}
          >
            <SummaryRow label="الباقة" value={selectedPlan?.name ?? "لم يتم الاختيار"} />
            <SummaryRow
              label="المبلغ"
              value={
                selectedPlan
                  ? `${selectedPlan.priceAmount.toLocaleString()} ${selectedPlan.currency}`
                  : "لم يتم الاختيار"
              }
            />
            <SummaryRow
              label="وسيلة الدفع"
              value={
                selectedMethod
                  ? (selectedMethod.label ?? getPaymentMethodLabel(selectedMethod.paymentMethod))
                  : "لم يتم الاختيار"
              }
            />
            <SummaryRow
              label="الحساب"
              value={selectedAccount ? (selectedAccount.label ?? selectedAccount.accountName) : "لم يتم الاختيار"}
            />
            <SummaryRow label="صورة الإثبات" value={proofPreview ? "تم الرفع" : "لم يتم الرفع"} />
            {reference ? <SummaryRow label="رقم المرجع" value={reference} /> : null}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {!hasDraft ? (
              <form action={handleCreateDraft}>
                <input type="hidden" name="planId" value={selectedPlanId ?? ""} />
                <input
                  type="hidden"
                  name="method"
                  value={selectedMethod?.paymentMethod ?? ""}
                />
                <input type="hidden" name="accountId" value={selectedAccountId ?? ""} />
                <Button
                  type="submit"
                  variant="luxury"
                  disabled={!canSubmit || createPending}
                >
                  {createPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {createPending ? "جاري الحفظ..." : "احفظ المسودة"}
                </Button>
              </form>
            ) : null}

            {hasDraft ? (
              <>
                <form action={handleSubmit}>
                  <input type="hidden" name="draftId" value={draftState} />
                  <Button type="submit" variant="luxury" disabled={submitPending}>
                    {submitPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    {submitPending ? "جاري التقديم..." : "تقديم طلب التفعيل"}
                  </Button>
                </form>

                <form action={handleCancel}>
                  <input type="hidden" name="draftId" value={draftState} />
                  <Button
                    type="submit"
                    variant="ghost"
                    disabled={cancelPending}
                    style={{ color: "#f87171" }}
                  >
                    {cancelPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                    {cancelPending ? "جاري الإلغاء..." : "إلغاء المسودة"}
                  </Button>
                </form>
              </>
            ) : null}
          </div>

          {getError(createState) ? (
            <p style={{ color: "#f87171", fontSize: "0.78rem", marginTop: 8 }}>
              {getError(createState)}
            </p>
          ) : null}
          {getError(submitState) ? (
            <p style={{ color: "#f87171", fontSize: "0.78rem", marginTop: 8 }}>
              {getError(submitState)}
            </p>
          ) : null}
        </SectionCard>
      ) : null}

      {/* ─── Request Status Section ─── */}
      {paymentRequest && isExistingRequestActive ? (
        <SectionCard
          title="حالة الطلب"
          description="تفاصيل طلب التفعيل الحالي"
          icon={<Clock size={16} />}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Badge
              label={REQ_STATUS_INFO[paymentRequest.status]?.label ?? paymentRequest.status}
              color={REQ_STATUS_INFO[paymentRequest.status]?.color ?? "rgba(245, 234, 214, 0.5)"}
              bg={REQ_STATUS_INFO[paymentRequest.status]?.bg ?? "rgba(255, 255, 255, 0.04)"}
            />
            {paymentRequest.submittedAt ? (
              <span style={{ color: "rgba(245, 234, 214, 0.4)", fontSize: "0.75rem" }}>
                تم التقديم: {formatDate(paymentRequest.submittedAt)}
              </span>
            ) : null}
          </div>

          {/* Timeline */}
          {logs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {logs.map((log, idx) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom:
                      idx < logs.length - 1
                        ? "1px solid rgba(245, 234, 214, 0.04)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      width: 20,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background:
                          log.action === "APPROVED"
                            ? "#4ade80"
                            : log.action === "REJECTED"
                              ? "#f87171"
                              : "#f3cf73",
                        marginTop: 4,
                      }}
                    />
                    {idx < logs.length - 1 ? (
                      <div
                        style={{
                          width: 1,
                          flex: 1,
                          background: "rgba(245, 234, 214, 0.06)",
                          minHeight: 20,
                        }}
                      />
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#fff7e8", fontSize: "0.82rem", fontWeight: 700, margin: 0 }}>
                      {LOG_LABELS[log.action] ?? log.action}
                    </p>
                    {log.note ? (
                      <p
                        style={{
                          color: "rgba(245, 234, 214, 0.55)",
                          fontSize: "0.75rem",
                          margin: "2px 0 0",
                        }}
                      >
                        {log.note}
                      </p>
                    ) : null}
                    <p style={{ color: "rgba(245, 234, 214, 0.3)", fontSize: "0.68rem", margin: "2px 0 0" }}>
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {/* ─── Rejected State ─── */}
      {paymentRequest?.status === "REJECTED" ? (
        <SectionCard
          title="تم رفض الطلب"
          icon={<AlertTriangle size={16} />}
        >
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(248, 113, 113, 0.08)",
              border: "1px solid rgba(248, 113, 113, 0.2)",
              marginBottom: 14,
            }}
          >
            <p style={{ color: "#f87171", fontSize: "0.84rem", fontWeight: 700, margin: 0 }}>
              سبب الرفض
            </p>
            <p style={{ color: "rgba(245, 234, 214, 0.6)", fontSize: "0.82rem", margin: "6px 0 0" }}>
              {paymentRequest.rejectionReason ?? "لم يتم تحديد سبب الرفض"}
            </p>
          </div>

          <Button
            variant="luxury"
            onClick={() => {
              setDraftState(null);
              setSelectedPlanId(null);
              setSelectedMethodId(null);
              setSelectedAccountId(null);
              setProofFile(null);
              setProofPreview(null);
              setReference("");
            }}
          >
            إنشاء طلب جديد
          </Button>
        </SectionCard>
      ) : null}

      {/* ─── FAQ Section ─── */}
      <SectionCard
        title="أسئلة شائعة"
        icon={<Info size={16} />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div
                key={idx}
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(245, 234, 214, 0.06)",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen(isOpen ? null : idx)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    width: "100%",
                    padding: "12px 14px",
                  }}
                >
                  <span style={{ color: "#fff7e8", fontSize: "0.83rem", fontWeight: 700 }}>
                    {item.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={14} style={{ color: "rgba(245, 234, 214, 0.4)", flexShrink: 0 }} />
                  ) : (
                    <ChevronDown size={14} style={{ color: "rgba(245, 234, 214, 0.4)", flexShrink: 0 }} />
                  )}
                </button>
                {isOpen ? (
                  <div style={{ padding: "0 14px 12px" }}>
                    <p style={{ color: "rgba(245, 234, 214, 0.55)", fontSize: "0.78rem", lineHeight: 1.7, margin: 0 }}>
                      {item.a}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ─── After Payment Section ─── */}
      {subStatus !== "ACTIVE" ? (
        <SectionCard
          title="بعد التقديم"
          description="ماذا يحدث بعد تقديم طلب التفعيل؟"
          icon={<Info size={16} />}
        >
          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {AFTER_PAYMENT_STEPS.map((step, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(245, 234, 214, 0.06)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(243, 207, 115, 0.1)",
                    color: "#f3cf73",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 10px",
                    fontSize: "1rem",
                    fontWeight: 950,
                  }}
                >
                  {idx + 1}
                </div>
                <p style={{ color: "#fff7e8", fontSize: "0.82rem", fontWeight: 700, margin: 0 }}>
                  {step.title}
                </p>
                <p style={{ color: "rgba(245, 234, 214, 0.5)", fontSize: "0.75rem", lineHeight: 1.6, margin: "6px 0 0" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </main>
  );
}

/* ─── Data ─────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 6, fontSize: "0.75rem" }}>
      <span style={{ color: "rgba(245, 234, 214, 0.4)", flexShrink: 0 }}>{label}:</span>
      <span style={{ color: "rgba(245, 234, 214, 0.75)", fontFamily: "monospace", fontSize: "0.72rem" }}>
        {value}
      </span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: "0.82rem" }}>
      <span style={{ color: "rgba(245, 234, 214, 0.5)" }}>{label}</span>
      <span style={{ color: value === "لم يتم الاختيار" || value === "لم يتم الرفع" ? "rgba(245, 234, 214, 0.3)" : "#fff7e8", fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: "كيف أعرف أن الدفع تم بنجاح؟",
    a: "بعد تقديم طلب الدفع، ستظهر حالة الطلب في هذه الصفحة. ستتلقى إشعاراً عبر البريد الإلكتروني ولوحة التحكم عند تأكيد الدفع.",
  },
  {
    q: "كم تستغرق مراجعة الطلب؟",
    a: "عادةً ما تتم مراجعة طلبات الدفع خلال 24 ساعة من تاريخ التقديم. في بعض الحالات قد تستغرق المراجعة وقتاً أطول قليلاً.",
  },
  {
    q: "ماذا يحدث بعد الموافقة؟",
    a: "بمجرد الموافقة على طلبك، سيتم تفعيل اشتراكك فوراً. ستتمكن من استخدام جميع ميزات الباقة التي اخترتها دون أي قيود.",
  },
  {
    q: "هل يمكنني تغيير الباقة لاحقاً؟",
    a: 'نعم، يمكنك ترقية باقتك أو تغييرها في أي وقت. سيتم احتساب الفروق بشكل نسبي. تواصل مع فريق الدعم للمساعدة في تغيير الباقة.',
  },
  {
    q: "ماذا لو رُفض طلبي؟",
    a: "إذا تم رفض طلبك، سيتم إعلامك بسبب الرفض. يمكنك تصحيح البيانات وإعادة التقديم مرة أخرى. لا تتردد في التواصل مع الدعم الفني للمساعدة.",
  },
];

const AFTER_PAYMENT_STEPS = [
  {
    title: "مراجعة الطلب",
    description: "سيتم مراجعة طلبك خلال 24 ساعة من قبل فريق الإدارة",
  },
  {
    title: "تفعيل الاشتراك",
    description: "سيتم تفعيل اشتراكك فور الموافقة على طلب الدفع",
  },
  {
    title: "إشعار بالتأكيد",
    description: "سيتم إشعارك عبر البريد الإلكتروني ولوحة التحكم",
  },
];
