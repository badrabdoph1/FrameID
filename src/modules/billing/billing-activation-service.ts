import { PaymentError, ValidationError } from "@/lib/errors";

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
    reviewedAt?: Date
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
    activatedAt: Date
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

  getTrialInfo(
    tenantId: string
  ): Promise<{
    trialStartedAt: Date;
    trialEndsAt: Date;
    trialDays: number;
    gracePeriodEndsAt: Date | null;
  } | null>;

  daysRemaining(trialEndsAt: Date): number;
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
      await repository.updatePaymentRequest(id, data);
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

      await repository.recordAudit(
        result.tenantId,
        undefined,
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
      adminNote?: string;
    }) {
      const reviewedAt = now();
      const payment = await repository.approvePayment(
        input.paymentRequestId,
        input.reviewerId,
        input.adminNote,
        reviewedAt
      );

      await repository.activateSubscription(
        payment.tenantId,
        payment.subscriptionId,
        payment.planId,
        reviewedAt
      );

      await repository.addLog(
        input.paymentRequestId,
        "APPROVED",
        input.reviewerId,
        undefined,
        input.adminNote || "تم قبول طلب الدفع"
      );

      await repository.recordAudit(
        input.reviewerId,
        payment.tenantId,
        "PAYMENT_APPROVED",
        "PaymentRequest",
        input.paymentRequestId
      );

      await repository.recordAudit(
        input.reviewerId,
        payment.tenantId,
        "SUBSCRIPTION_ACTIVATED",
        "Subscription",
        payment.subscriptionId
      );
    },

    async rejectPayment(input: {
      paymentRequestId: string;
      reviewerId: string;
      reason: string;
    }) {
      if (!input.reason?.trim()) {
        throw new ValidationError("FID-VAL-002", "سبب الرفض مطلوب");
      }

      const reviewedAt = now();
      const payment = await repository.rejectPayment(
        input.paymentRequestId,
        input.reviewerId,
        input.reason,
        reviewedAt
      );

      await repository.addLog(
        input.paymentRequestId,
        "REJECTED",
        input.reviewerId,
        undefined,
        input.reason
      );

      await repository.recordAudit(
        input.reviewerId,
        payment.tenantId,
        "PAYMENT_REJECTED",
        "PaymentRequest",
        input.paymentRequestId
      );
    },

    async requestReupload(input: {
      paymentRequestId: string;
      reviewerId: string;
      note: string;
    }) {
      if (!input.note?.trim()) {
        throw new ValidationError("FID-VAL-002", "ملاحظة إعادة الرفع مطلوبة");
      }

      await repository.requestReupload(
        input.paymentRequestId,
        input.reviewerId,
        input.note
      );

      await repository.addLog(
        input.paymentRequestId,
        "REUPLOAD_REQUESTED",
        input.reviewerId,
        undefined,
        input.note
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
        status: "DRAFT" as const
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
        reason: input.adminNote || "تم الرفض من لوحة الإدارة العليا"
      });
    }
  };
}
