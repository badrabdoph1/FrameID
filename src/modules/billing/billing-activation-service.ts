import { PaymentError, ValidationError } from "@/lib/errors";

type PaymentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "PENDING"
  | "REFUNDED"
  | "EXPIRED";

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "CANCELLED", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "DRAFT"],
  APPROVED: ["REFUNDED"],
  REJECTED: ["DRAFT"],
  CANCELLED: [],
  PENDING: ["SUBMITTED", "CANCELLED"],
  REFUNDED: [],
  EXPIRED: [],
};

function assertValidTransition(
  current: PaymentStatus,
  target: PaymentStatus,
  errorCode: string,
): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed?.includes(target)) {
    throw new PaymentError(errorCode);
  }
}

export type PaymentMethod = "INSTAPAY" | "VODAFONE_CASH" | "STRIPE" | "PAYPAL";

export type BillingActivationRepository = {
  createDraftPaymentRequest(input: {
    tenantId: string;
    subscriptionId: string;
    planId?: string;
    method: PaymentMethod;
    amount: number;
    currency?: string;
  }): Promise<{ id: string; status: "DRAFT" }>;

  updatePaymentRequest(
    id: string,
    data: {
      method?: PaymentMethod;
      paymentAccountId?: string;
      amount?: number;
      reference?: string;
    }
  ): Promise<void>;

  uploadProof(id: string, proofAssetId: string): Promise<void>;
  removeProof(id: string): Promise<void>;

  submitPaymentRequest(
    id: string,
    submittedAt: Date
  ): Promise<{ tenantId: string; subscriptionId: string }>;

  getCustomerActivePaymentRequest(
    tenantId: string
  ): Promise<{
    id: string;
    status: string;
    method: string;
    amount: number;
    reference: string | null;
    proofAssetId: string | null;
    planId: string | null;
    submittedAt: Date | null;
    rejectionReason: string | null;
  } | null>;

  approvePayment(
    paymentRequestId: string,
    reviewerId: string,
    adminNote?: string,
    reviewedAt?: Date
  ): Promise<{
    tenantId: string;
    subscriptionId: string;
    planId: string | null;
  }>;

  rejectPayment(
    paymentRequestId: string,
    reviewerId: string,
    reason: string,
    reviewedAt?: Date,
    adminNote?: string
  ): Promise<{ tenantId: string }>;

  requestReupload(
    paymentRequestId: string,
    reviewerId: string,
    note: string
  ): Promise<void>;

  activateSubscription(
    tenantId: string,
    subscriptionId: string,
    planId: string | null,
    activatedAt: Date,
    currentPeriodEnd?: Date
  ): Promise<void>;

  cancelSubscription(subscriptionId: string): Promise<void>;

  extendTrial(
    tenantId: string,
    days: number
  ): Promise<{ newEndDate: Date }>;

  endTrial(tenantId: string): Promise<void>;

  addLog(
    paymentRequestId: string,
    action: string,
    actorUserId?: string,
    actorName?: string,
    note?: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  getLogs(
    paymentRequestId: string
  ): Promise<
    Array<{
      id: string;
      action: string;
      actorName: string | null;
      note: string | null;
      createdAt: Date;
    }>
  >;

  createNotification(
    tenantId: string,
    type: string,
    title: string,
    body: string,
    priority?: string
  ): Promise<void>;

  createNotificationLog(
    type: string,
    title: string,
    body: string,
    category: string,
    userId?: string,
    tenantId?: string
  ): Promise<void>;

  recordAudit(
    actorUserId?: string,
    tenantId?: string,
    action?: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  recordSubscriptionChange(
    subscriptionId: string,
    fromPlanId: string | null,
    toPlanId: string | null,
    fromStatus: string,
    toStatus: string,
    changeType: string,
    initiatedById?: string,
    reason?: string
  ): Promise<void>;

  getPlan(planId: string): Promise<{
    id: string;
    billingInterval: string;
    priceAmount: number;
  } | null>;

  getTrialInfo(
    tenantId: string
  ): Promise<{
    trialStartedAt: Date;
    trialEndsAt: Date;
    trialDays: number;
    gracePeriodEndsAt: Date | null;
  } | null>;

  daysRemaining(trialEndsAt: Date): number;

  getPaymentRequestById(
    id: string
  ): Promise<{
    id: string;
    status: string;
    tenantId: string;
    subscriptionId: string;
    method: string;
    amount: number;
    planId: string | null;
    reference: string | null;
    proofAssetId: string | null;
    submittedAt: Date | null;
    adminNote: string | null;
    rejectionReason: string | null;
    tenant: { id: string; status: string };
    plan: { id: string; name: string } | null;
    paymentAccount: { id: string; accountName: string } | null;
    proofAsset: { id: string; url: string } | null;
  }>;

  cancelPaymentRequest(
    id: string,
    cancelledAt: Date
  ): Promise<{ tenantId: string; subscriptionId: string }>;
};

export function createBillingActivationService({
  repository,
  now = () => new Date()
}: {
  repository: BillingActivationRepository;
  now?: () => Date;
}) {
  return {
    async createDraftPayment(input: {
      tenantId: string;
      subscriptionId: string;
      planId?: string;
      method: PaymentMethod;
      amount: number;
      currency?: string;
    }) {
      if (input.amount <= 0) {
        throw new PaymentError("FID-PAY-006");
      }

      return repository.createDraftPaymentRequest(input);
    },

    async updateDraftPayment(
      id: string,
      data: {
        method?: PaymentMethod;
        paymentAccountId?: string;
        amount?: number;
        reference?: string;
      }
    ) {
      const current = await repository.getPaymentRequestById(id);
      if (current.status !== "DRAFT") {
        return { success: false, error: "الحالة الحالية لا تسمح بالتعديل" };
      }
      await repository.updatePaymentRequest(id, data);
      return { success: true };
    },

    async uploadPaymentProof(paymentRequestId: string, proofAssetId: string) {
      await repository.uploadProof(paymentRequestId, proofAssetId);
    },

    async removePaymentProof(paymentRequestId: string) {
      await repository.removeProof(paymentRequestId);
    },

    async submitPayment(paymentRequestId: string) {
      const submittedAt = now();
      const result = await repository.submitPaymentRequest(
        paymentRequestId,
        submittedAt
      );

      await repository.addLog(
        paymentRequestId,
        "SUBMITTED",
        undefined,
        undefined,
        "تم تقديم طلب الدفع"
      );

      await repository.createNotification(
        result.tenantId,
        "payment_submitted",
        "تم تقديم طلب الدفع",
        "تم تقديم طلب الدفع الخاص بك بنجاح. سيتم مراجعته من قبل فريق الإدارة.",
        "normal"
      );

      await repository.recordAudit(
        undefined,
        result.tenantId,
        "PAYMENT_REQUEST_SUBMITTED",
        "PaymentRequest",
        paymentRequestId
      );

      return result;
    },

    async getCustomerActivePaymentRequest(tenantId: string) {
      return repository.getCustomerActivePaymentRequest(tenantId);
    },

    async approvePayment(input: {
      paymentRequestId: string;
      reviewerId: string;
      adminName?: string;
      adminNote?: string;
    }) {
      const payment = await repository.getPaymentRequestById(input.paymentRequestId);
      assertValidTransition(payment.status as PaymentStatus, "APPROVED", "FID-PAY-001");

      const reviewedAt = now();

      const approved = await repository.approvePayment(
        input.paymentRequestId,
        input.reviewerId,
        input.adminNote,
        reviewedAt
      );

      let periodEnd: Date | undefined;
      if (approved.planId) {
        const plan = await repository.getPlan(approved.planId);
        if (plan) {
          const months = plan.billingInterval === "YEARLY" ? 12 : 1;
          periodEnd = new Date(reviewedAt);
          periodEnd.setMonth(periodEnd.getMonth() + months);
        }
      }

      await repository.activateSubscription(
        approved.tenantId,
        approved.subscriptionId,
        approved.planId,
        reviewedAt,
        periodEnd
      );

      await repository.recordSubscriptionChange(
        approved.subscriptionId,
        null,
        approved.planId,
        payment.status,
        "ACTIVE",
        "ACTIVATE",
        input.reviewerId,
        "تم تفعيل الاشتراك بعد الموافقة على الدفع"
      );

      await repository.addLog(
        input.paymentRequestId,
        "APPROVED",
        input.reviewerId,
        input.adminName,
        input.adminNote || "تم قبول طلب الدفع"
      );

      await repository.createNotification(
        approved.tenantId,
        "payment_approved",
        "تم قبول طلب الدفع",
        "تمت الموافقة على طلب الدفع الخاص بك وتم تفعيل اشتراكك. يمكنك الآن استخدام جميع الميزات.",
        "high"
      );

      await repository.createNotificationLog(
        "payment_approved",
        "تم قبول طلب الدفع",
        `تمت الموافقة على طلب الدفع ${input.paymentRequestId.slice(0, 8)}...`,
        "billing",
        undefined,
        approved.tenantId
      );

      await repository.recordAudit(
        input.reviewerId,
        approved.tenantId,
        "PAYMENT_APPROVED",
        "PaymentRequest",
        input.paymentRequestId
      );

      await repository.recordAudit(
        input.reviewerId,
        approved.tenantId,
        "SUBSCRIPTION_ACTIVATED",
        "Subscription",
        approved.subscriptionId
      );
    },

    async rejectPayment(input: {
      paymentRequestId: string;
      reviewerId: string;
      adminName?: string;
      reason: string;
      adminNote?: string;
    }) {
      if (!input.reason?.trim()) {
        throw new ValidationError("FID-VAL-002", "سبب الرفض مطلوب");
      }

      const payment = await repository.getPaymentRequestById(input.paymentRequestId);
      assertValidTransition(payment.status as PaymentStatus, "REJECTED", "FID-PAY-002");

      const reviewedAt = now();
      const rejected = await repository.rejectPayment(
        input.paymentRequestId,
        input.reviewerId,
        input.reason,
        reviewedAt,
        input.adminNote
      );

      await repository.addLog(
        input.paymentRequestId,
        "REJECTED",
        input.reviewerId,
        input.adminName,
        input.reason
      );

      await repository.createNotification(
        rejected.tenantId,
        "payment_rejected",
        "تم رفض طلب الدفع",
        `عذراً، تم رفض طلب الدفع الخاص بك. السبب: ${input.reason}. يرجى مراجعة البيانات وإعادة التقديم.`,
        "high"
      );

      await repository.createNotificationLog(
        "payment_rejected",
        "تم رفض طلب الدفع",
        `تم رفض طلب الدفع: ${input.reason}`,
        "billing",
        undefined,
        rejected.tenantId
      );

      await repository.recordAudit(
        input.reviewerId,
        rejected.tenantId,
        "PAYMENT_REJECTED",
        "PaymentRequest",
        input.paymentRequestId
      );
    },

    async requestReupload(input: {
      paymentRequestId: string;
      reviewerId: string;
      adminName?: string;
      note: string;
    }) {
      if (!input.note?.trim()) {
        throw new ValidationError("FID-VAL-002", "ملاحظة إعادة الرفع مطلوبة");
      }

      const payment = await repository.getPaymentRequestById(input.paymentRequestId);
      assertValidTransition(payment.status as PaymentStatus, "DRAFT", "FID-PAY-003");

      await repository.requestReupload(
        input.paymentRequestId,
        input.reviewerId,
        input.note
      );

      await repository.addLog(
        input.paymentRequestId,
        "REUPLOAD_REQUESTED",
        input.reviewerId,
        input.adminName,
        input.note
      );

      await repository.createNotification(
        payment.tenantId,
        "reupload_requested",
        "مطلوب إعادة رفع إثبات الدفع",
        `يرجى إعادة رفع صورة إثبات الدفع مع التعديلات المطلوبة. ملاحظة: ${input.note}`,
        "high"
      );

      await repository.createNotificationLog(
        "reupload_requested",
        "مطلوب إعادة رفع إثبات الدفع",
        `طلب إعادة رفع: ${input.note}`,
        "billing",
        undefined,
        payment.tenantId
      );
    },

    async addPaymentNote(input: {
      paymentRequestId: string;
      adminId: string;
      adminName?: string;
      note: string;
    }) {
      if (!input.note?.trim()) {
        throw new ValidationError("FID-VAL-002", "الملاحظة مطلوبة");
      }

      await repository.addLog(
        input.paymentRequestId,
        "NOTE_ADDED",
        input.adminId,
        input.adminName,
        input.note
      );

      await repository.recordAudit(
        input.adminId,
        undefined,
        "PAYMENT_NOTE_ADDED",
        "PaymentRequest",
        input.paymentRequestId,
        { note: input.note }
      );
    },

    async requestManualActivation(input: {
      tenantId: string;
      subscriptionId: string;
      method: string;
      amount: number;
      currency: string;
      reference?: string;
      proofAssetId?: string;
    }) {
      if (input.amount <= 0) {
        throw new PaymentError("FID-PAY-006");
      }

      const draft = await repository.createDraftPaymentRequest({
        tenantId: input.tenantId,
        subscriptionId: input.subscriptionId,
        method: input.method as PaymentMethod,
        amount: input.amount,
        currency: input.currency
      });

      if (input.reference) {
        await repository.updatePaymentRequest(draft.id, {
          reference: input.reference
        });
      }

      if (input.proofAssetId) {
        await repository.uploadProof(draft.id, input.proofAssetId);
      }

      await repository.submitPaymentRequest(draft.id, now());

      await repository.addLog(
        draft.id,
        "SUBMITTED",
        undefined,
        undefined,
        "تم تقديم طلب الدفع (يدوي)"
      );

      await repository.recordAudit(
        undefined,
        input.tenantId,
        "PAYMENT_REQUEST_CREATED",
        "PaymentRequest",
        draft.id,
        {
          method: input.method,
          amount: input.amount,
          currency: input.currency
        }
      );

      return {
        paymentRequestId: draft.id,
        status: "SUBMITTED" as const
      };
    },

    async approveManualPayment(input: {
      paymentRequestId: string;
      reviewerId: string;
      adminNote?: string;
    }) {
      await this.approvePayment(input);
    },

    async rejectManualPayment(input: {
      paymentRequestId: string;
      reviewerId: string;
      adminNote?: string;
    }) {
      await this.rejectPayment({
        paymentRequestId: input.paymentRequestId,
        reviewerId: input.reviewerId,
        reason: input.adminNote || "تم الرفض من لوحة الإدارة العليا",
        adminNote: input.adminNote
      });
    },

    async cancelPaymentRequest(paymentRequestId: string) {
      const current = await repository.getPaymentRequestById(paymentRequestId);
      const allowed = VALID_TRANSITIONS[current.status as PaymentStatus] ?? [];

      if (!allowed.includes("CANCELLED")) {
        return { success: false, error: "لا يمكن إلغاء الطلب في الحالة الحالية" };
      }

      const cancelledAt = now();
      const result = await repository.cancelPaymentRequest(
        paymentRequestId,
        cancelledAt
      );

      await repository.addLog(
        paymentRequestId,
        "CANCELLED",
        undefined,
        undefined,
        "تم إلغاء طلب الدفع"
      );

      await repository.recordAudit(
        undefined,
        result.tenantId,
        "PAYMENT_REQUEST_CANCELLED",
        "PaymentRequest",
        paymentRequestId
      );

      return { success: true };
    }
  };
}
