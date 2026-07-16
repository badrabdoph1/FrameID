import type { CustomerSubscriptionStatus } from "./customer-types";

export type CustomerPlanOption = {
  id: string;
  code: string;
  name: string;
  priceAmount: number;
  currency: string;
  billingInterval: string;
  isActive: boolean;
};

export type CustomerSubscriptionSnapshot = {
  id: string;
  tenantId: string;
  planId: string | null;
  status: CustomerSubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
};

export type CustomerSubscriptionDurationMode =
  | "30"
  | "90"
  | "365"
  | "forever"
  | "custom-date"
  | "adjust";

export type ManualPaymentMethod = "INSTAPAY" | "VODAFONE_CASH" | "STRIPE" | "PAYPAL";

export type CustomerSubscriptionEditInput = {
  tenantId: string;
  subscriptionId?: string;
  planId: string;
  status: CustomerSubscriptionStatus;
  durationMode: CustomerSubscriptionDurationMode;
  customEndDate?: string;
  adjustmentDays?: number;
  recordPayment: boolean;
  paymentAmount?: number;
  paymentMethod?: ManualPaymentMethod;
  paymentReference?: string;
  note?: string;
  actor: { id: string; name: string };
};

export type CustomerSubscriptionEditCommand = {
  tenantId: string;
  subscriptionId?: string;
  planId: string;
  previousPlanId: string | null;
  previousStatus: CustomerSubscriptionStatus | null;
  status: CustomerSubscriptionStatus;
  periodStart: Date;
  periodEnd: Date;
  expiresAt: Date | null;
  actor: { id: string; name: string };
  note: string | null;
  payment: {
    id: string;
    amount: number;
    currency: string;
    method: ManualPaymentMethod;
    reference: string | null;
  } | null;
};

export type CustomerSubscriptionEditorRepository = {
  listActivePlans(): Promise<CustomerPlanOption[]>;
  getPlan(planId: string): Promise<CustomerPlanOption | null>;
  getSubscription(tenantId: string, subscriptionId?: string): Promise<CustomerSubscriptionSnapshot | null>;
  applyEdit(command: CustomerSubscriptionEditCommand): Promise<{ subscriptionId: string; paymentId: string | null }>;
};

const permanentEnd = new Date("2099-12-31T23:59:59.999Z");
const paymentMethods: ManualPaymentMethod[] = ["INSTAPAY", "VODAFONE_CASH", "STRIPE", "PAYPAL"];

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function parseCustomEndDate(value: string | undefined): Date {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    throw new Error("اختر تاريخ انتهاء صحيحًا");
  }
  const parsed = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error("اختر تاريخ انتهاء صحيحًا");
  return parsed;
}

function calculatePeriodEnd(input: CustomerSubscriptionEditInput, current: CustomerSubscriptionSnapshot | null, now: Date) {
  if (input.durationMode === "forever") {
    return { periodEnd: new Date(permanentEnd), expiresAt: null };
  }

  if (input.durationMode === "custom-date") {
    const periodEnd = parseCustomEndDate(input.customEndDate);
    return { periodEnd, expiresAt: periodEnd };
  }

  if (input.durationMode === "adjust") {
    const days = Math.round(input.adjustmentDays ?? 0);
    if (!Number.isFinite(days) || days === 0 || Math.abs(days) > 3650) {
      throw new Error("اكتب عدد أيام بين -3650 و3650، ولا تستخدم صفرًا");
    }
    const periodEnd = addDays(current?.currentPeriodEnd ?? now, days);
    return { periodEnd, expiresAt: periodEnd };
  }

  const days = Number(input.durationMode);
  const periodEnd = addDays(now, days);
  return { periodEnd, expiresAt: periodEnd };
}

export function createCustomerSubscriptionEditor({
  repository,
  now = () => new Date(),
  createId = () => crypto.randomUUID(),
}: {
  repository: CustomerSubscriptionEditorRepository;
  now?: () => Date;
  createId?: () => string;
}) {
  async function edit(input: CustomerSubscriptionEditInput) {
    if (!input.tenantId || !input.planId) throw new Error("اختر العميل والباقة أولًا");

    const [plan, current] = await Promise.all([
      repository.getPlan(input.planId),
      repository.getSubscription(input.tenantId, input.subscriptionId),
    ]);

    if (!plan?.isActive) throw new Error("الباقة المختارة غير متاحة حاليًا");
    if (input.subscriptionId && !current) throw new Error("الاشتراك المطلوب تعديله غير موجود");

    const editedAt = now();
    const { periodEnd, expiresAt } = calculatePeriodEnd(input, current, editedAt);
    let status = input.status;

    if (input.durationMode === "adjust" && periodEnd.getTime() <= editedAt.getTime() && status === "ACTIVE") {
      status = "EXPIRED";
    }

    if ((status === "ACTIVE" || status === "TRIAL") && periodEnd.getTime() <= editedAt.getTime()) {
      throw new Error("تاريخ انتهاء الاشتراك النشط يجب أن يكون في المستقبل");
    }

    let payment: CustomerSubscriptionEditCommand["payment"] = null;
    if (input.recordPayment) {
      if (status !== "ACTIVE") throw new Error("تسجيل الدفعة متاح للاشتراك النشط فقط");
      const method = input.paymentMethod;
      if (!method || !paymentMethods.includes(method)) throw new Error("اختر طريقة دفع صحيحة");
      const amount = input.paymentAmount ?? plan.priceAmount;
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("قيمة الدفعة يجب أن تكون أكبر من صفر");
      payment = {
        id: createId(),
        amount: Math.round(amount),
        currency: plan.currency,
        method,
        reference: input.paymentReference?.trim() || null,
      };
    }

    return repository.applyEdit({
      tenantId: input.tenantId,
      subscriptionId: current?.id,
      planId: plan.id,
      previousPlanId: current?.planId ?? null,
      previousStatus: current?.status ?? null,
      status,
      periodStart: input.durationMode === "adjust" ? current?.currentPeriodStart ?? editedAt : editedAt,
      periodEnd,
      expiresAt,
      actor: input.actor,
      note: input.note?.trim() || null,
      payment,
    });
  }

  return {
    edit,
    listActivePlans: () => repository.listActivePlans(),
  };
}
