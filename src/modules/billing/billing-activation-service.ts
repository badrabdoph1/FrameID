export type ManualPaymentMethod = "INSTAPAY" | "VODAFONE_CASH";

export type BillingActivationRepository = {
  createPaymentRequest(input: {
    tenantId: string;
    subscriptionId: string;
    method: ManualPaymentMethod;
    amount: number;
    currency: string;
    reference?: string;
    proofAssetId?: string;
  }): Promise<{
    id: string;
    status: "PENDING";
  }>;
  approvePayment(input: {
    paymentRequestId: string;
    reviewerId: string;
    adminNote?: string;
    reviewedAt: Date;
  }): Promise<{
    tenantId: string;
    subscriptionId: string;
  }>;
  rejectPayment(input: {
    paymentRequestId: string;
    reviewerId: string;
    adminNote?: string;
    reviewedAt: Date;
  }): Promise<{
    tenantId: string;
  }>;
  activateSubscription(input: {
    tenantId: string;
    subscriptionId: string;
    activatedAt: Date;
  }): Promise<void>;
  recordAudit(input: {
    actorUserId?: string;
    tenantId?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
};

export function createBillingActivationService({
  repository,
  now = () => new Date()
}: {
  repository: BillingActivationRepository;
  now?: () => Date;
}) {
  return {
    async requestManualActivation(input: {
      tenantId: string;
      subscriptionId: string;
      method: ManualPaymentMethod;
      amount: number;
      currency: string;
      reference?: string;
      proofAssetId?: string;
    }) {
      if (input.amount <= 0) {
        throw new Error("Payment amount must be positive");
      }

      const payment = await repository.createPaymentRequest(input);

      await repository.recordAudit({
        tenantId: input.tenantId,
        action: "PAYMENT_REQUEST_CREATED",
        entityType: "PaymentRequest",
        entityId: payment.id,
        metadata: {
          method: input.method,
          amount: input.amount,
          currency: input.currency
        }
      });

      return {
        paymentRequestId: payment.id,
        status: payment.status
      };
    },
    async approveManualPayment(input: {
      paymentRequestId: string;
      reviewerId: string;
      adminNote?: string;
    }) {
      const reviewedAt = now();
      const payment = await repository.approvePayment({
        paymentRequestId: input.paymentRequestId,
        reviewerId: input.reviewerId,
        adminNote: input.adminNote,
        reviewedAt
      });

      await repository.activateSubscription({
        tenantId: payment.tenantId,
        subscriptionId: payment.subscriptionId,
        activatedAt: reviewedAt
      });

      await repository.recordAudit({
        actorUserId: input.reviewerId,
        tenantId: payment.tenantId,
        action: "PAYMENT_APPROVED",
        entityType: "PaymentRequest",
        entityId: input.paymentRequestId
      });

      await repository.recordAudit({
        actorUserId: input.reviewerId,
        tenantId: payment.tenantId,
        action: "SUBSCRIPTION_ACTIVATED",
        entityType: "Subscription",
        entityId: payment.subscriptionId
      });
    },
    async rejectManualPayment(input: {
      paymentRequestId: string;
      reviewerId: string;
      adminNote?: string;
    }) {
      const reviewedAt = now();
      const payment = await repository.rejectPayment({
        paymentRequestId: input.paymentRequestId,
        reviewerId: input.reviewerId,
        adminNote: input.adminNote,
        reviewedAt
      });

      await repository.recordAudit({
        actorUserId: input.reviewerId,
        tenantId: payment.tenantId,
        action: "PAYMENT_REJECTED",
        entityType: "PaymentRequest",
        entityId: input.paymentRequestId
      });
    }
  };
}
