export type ServicesPaymentMethod = "INSTAPAY" | "VODAFONE_CASH" | "STRIPE" | "PAYPAL";

export interface ServicesPaymentRepository {
  getPayableAcquisition(acquisitionId: string): Promise<{ id: string; tenantId: string; status: string; acceptedTotal: number | null; acceptedCurrency: string | null } | null>;
  createDraft(input: { acquisitionId: string; tenantId: string; method: ServicesPaymentMethod; paymentAccountId?: string | null; reference?: string | null; amount: number; currency: string }): Promise<{ id: string; status: "DRAFT" }>;
  submit(input: { paymentRequestId: string; tenantId: string; proofAssetId: string; idempotencyKey: string; submittedAt: Date }): Promise<{ id: string; status: "SUBMITTED"; acquisitionId: string }>;
  approve(input: { paymentRequestId: string; reviewerId: string; idempotencyKey: string; approvedAt: Date }): Promise<{ acquisitionId: string; tenantId: string }>;
  reject(input: { paymentRequestId: string; reviewerId: string; reason: string; idempotencyKey: string; rejectedAt: Date }): Promise<{ acquisitionId: string; tenantId: string }>;
  refund(input: { paymentRequestId: string; reviewerId: string; reason: string; idempotencyKey: string; refundedAt: Date }): Promise<{ acquisitionId: string; tenantId: string }>;
}

export function createServicesPaymentService(repository: ServicesPaymentRepository, now: () => Date = () => new Date()) {
  return {
    async createDraft(input: { acquisitionId: string; tenantId: string; method: ServicesPaymentMethod; paymentAccountId?: string | null; reference?: string | null }) {
      const acquisition = await repository.getPayableAcquisition(input.acquisitionId);
      if (!acquisition) throw new Error(`Payable acquisition not found: ${input.acquisitionId}`);
      if (acquisition.tenantId !== input.tenantId) throw new Error("Acquisition ownership mismatch.");
      if (acquisition.status !== "AWAITING_PAYMENT") throw new Error(`Acquisition is not awaiting payment: ${acquisition.status}`);
      if (acquisition.acceptedTotal == null || !acquisition.acceptedCurrency) throw new Error("Acquisition has no accepted price snapshot.");
      return repository.createDraft({
        ...input,
        amount: acquisition.acceptedTotal,
        currency: acquisition.acceptedCurrency,
      });
    },
    submit(input: { paymentRequestId: string; tenantId: string; proofAssetId: string; idempotencyKey: string }) {
      return repository.submit({ ...input, submittedAt: now() });
    },
    approve(input: { paymentRequestId: string; reviewerId: string; idempotencyKey: string }) {
      return repository.approve({ ...input, approvedAt: now() });
    },
    reject(input: { paymentRequestId: string; reviewerId: string; reason: string; idempotencyKey: string }) {
      if (!input.reason.trim()) throw new Error("Payment rejection reason is required.");
      return repository.reject({ ...input, rejectedAt: now() });
    },
    refund(input: { paymentRequestId: string; reviewerId: string; reason: string; idempotencyKey: string }) {
      if (!input.reason.trim()) throw new Error("Refund reason is required.");
      return repository.refund({ ...input, refundedAt: now() });
    },
  };
}
