import { PaymentError, ValidationError } from "@/lib/errors";
import { getLifecycleEndDate, type LifecycleDurationPreset } from "@/modules/lifecycle/customer-lifecycle";

type PaymentStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING" | "REFUNDED" | "EXPIRED";

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "CANCELLED", "APPROVED", "REJECTED", "DRAFT"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "DRAFT", "CANCELLED"],
  APPROVED: ["REFUNDED"],
  REJECTED: ["DRAFT"],
  CANCELLED: [],
  PENDING: ["SUBMITTED", "CANCELLED", "UNDER_REVIEW", "APPROVED", "REJECTED", "DRAFT"],
  REFUNDED: [],
  EXPIRED: [],
};

function assertValidTransition(current: PaymentStatus, target: PaymentStatus, errorCode: string): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed?.includes(target)) throw new PaymentError(errorCode, `لا يمكن نقل طلب الدفع من ${current} إلى ${target}`);
}

function assertDraftStatus(status: string): void {
  if (status !== "DRAFT") throw new PaymentError("FID-PAY-003", "لا يمكن تعديل طلب الدفع بعد إرساله للمراجعة");
}

export type PaymentMethod = "INSTAPAY" | "VODAFONE_CASH" | "STRIPE" | "PAYPAL";

export type BillingActivationRepository = {
  createDraftPaymentRequest(input: { tenantId: string; subscriptionId: string; planId?: string; method: PaymentMethod; paymentAccountId?: string; amount: number; currency?: string; reference?: string | null }): Promise<{ id: string; status: "DRAFT" }>;
  updatePaymentRequest(id: string, data: { method?: PaymentMethod; paymentAccountId?: string; amount?: number; reference?: string | null }): Promise<void>;
  uploadProof(id: string, proofAssetId: string): Promise<void>;
  removeProof(id: string): Promise<void>;
  submitPaymentRequest(id: string, submittedAt: Date): Promise<{ tenantId: string; subscriptionId: string }>;
  getCustomerActivePaymentRequest(tenantId: string): Promise<{ id: string; status: string; method: string; amount: number; currency: string; reference: string | null; proofAssetId: string | null; paymentAccountId: string | null; planId: string | null; submittedAt: Date | null; rejectionReason: string | null } | null>;
  approvePayment(paymentRequestId: string, reviewerId: string, adminNote?: string, reviewedAt?: Date): Promise<{ tenantId: string; subscriptionId: string; planId: string | null }>;
  rejectPayment(paymentRequestId: string, reviewerId: string, reason: string, reviewedAt?: Date, adminNote?: string): Promise<{ tenantId: string }>;
  requestReupload(paymentRequestId: string, reviewerId: string, note: string): Promise<void>;
  activateSubscription(tenantId: string, subscriptionId: string, planId: string | null, activatedAt: Date, currentPeriodEnd?: Date | null): Promise<void>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  extendTrial(tenantId: string, days: number): Promise<{ newEndDate: Date }>;
  endTrial(tenantId: string): Promise<void>;
  addLog(paymentRequestId: string, action: string, actorUserId?: string, actorName?: string, note?: string, metadata?: Record<string, unknown>): Promise<void>;
  getLogs(paymentRequestId: string): Promise<Array<{ id: string; action: string; actorName: string | null; note: string | null; createdAt: Date }>>;
  createNotification(tenantId: string, type: string, title: string, body: string, priority?: string): Promise<void>;
  createNotificationLog(type: string, title: string, body: string, category: string, userId?: string, tenantId?: string): Promise<void>;
  recordAudit(actorUserId?: string, tenantId?: string, action?: string, entityType?: string, entityId?: string, metadata?: Record<string, unknown>): Promise<void>;
  recordSubscriptionChange(subscriptionId: string, fromPlanId: string | null, toPlanId: string | null, fromStatus: string, toStatus: string, changeType: string, initiatedById?: string, reason?: string): Promise<void>;
  getPlan(planId: string): Promise<{ id: string; billingInterval: string; priceAmount: number } | null>;
  getTrialInfo(tenantId: string): Promise<{ trialStartedAt: Date; trialEndsAt: Date; trialDays: number; gracePeriodEndsAt: Date | null } | null>;
  daysRemaining(trialEndsAt: Date): number;
  getPaymentRequestById(id: string): Promise<{ id: string; status: string; tenantId: string; subscriptionId: string; method: string; amount: number; currency: string; planId: string | null; paymentAccountId: string | null; reference: string | null; proofAssetId: string | null; submittedAt: Date | null; adminNote: string | null; rejectionReason: string | null; tenant: { id: string; status: string }; subscription: { id: string; status: string; planId: string | null }; plan: { id: string; name: string } | null; paymentAccount: { id: string; accountName: string } | null; proofAsset: { id: string; url: string } | null }>;
  cancelPaymentRequest(id: string, cancelledAt: Date): Promise<{ tenantId: string; subscriptionId: string }>;
};

export function createBillingActivationService({ repository, now = () => new Date() }: { repository: BillingActivationRepository; now?: () => Date }) {
  return {
    async createDraftPayment(input: { tenantId: string; subscriptionId: string; planId?: string; method: PaymentMethod; paymentAccountId?: string; amount: number; currency?: string; reference?: string | null }) {
      if (input.amount <= 0) throw new PaymentError("FID-PAY-006", "قيمة الدفع غير صالحة");
      const draft = await repository.createDraftPaymentRequest(input);
      await repository.addLog(draft.id, "DRAFT_CREATED", undefined, undefined, "تم إنشاء مسودة طلب الدفع");
      await repository.recordAudit(undefined, input.tenantId, "PAYMENT_DRAFT_CREATED", "PaymentRequest", draft.id, input);
      return draft;
    },

    async updateDraftPayment(id: string, data: { method?: PaymentMethod; paymentAccountId?: string; amount?: number; reference?: string | null }) {
      const current = await repository.getPaymentRequestById(id);
      assertDraftStatus(current.status);
      await repository.updatePaymentRequest(id, data);
      await repository.addLog(id, "DRAFT_UPDATED", undefined, undefined, "تم تحديث بيانات مسودة الدفع", data);
      return { success: true };
    },

    async uploadPaymentProof(paymentRequestId: string, proofAssetId: string) {
      const current = await repository.getPaymentRequestById(paymentRequestId);
      assertDraftStatus(current.status);
      await repository.uploadProof(paymentRequestId, proofAssetId);
      await repository.addLog(paymentRequestId, "PROOF_UPLOADED", undefined, undefined, "تم رفع إثبات الدفع", { proofAssetId });
      await repository.recordAudit(undefined, current.tenantId, "PAYMENT_PROOF_UPLOADED", "PaymentRequest", paymentRequestId, { proofAssetId });
    },

    async removePaymentProof(paymentRequestId: string) {
      const current = await repository.getPaymentRequestById(paymentRequestId);
      assertDraftStatus(current.status);
      await repository.removeProof(paymentRequestId);
      await repository.addLog(paymentRequestId, "PROOF_REMOVED", undefined, undefined, "تم حذف إثبات الدفع");
      await repository.recordAudit(undefined, current.tenantId, "PAYMENT_PROOF_REMOVED", "PaymentRequest", paymentRequestId);
    },

    async submitPayment(paymentRequestId: string) {
      const current = await repository.getPaymentRequestById(paymentRequestId);
      assertValidTransition(current.status as PaymentStatus, "SUBMITTED", "FID-PAY-001");
      if (!current.planId) throw new ValidationError("FID-VAL-002", "يرجى اختيار الباقة قبل إرسال الطلب");
      if (!current.paymentAccountId) throw new ValidationError("FID-VAL-002", "يرجى اختيار حساب الدفع قبل إرسال الطلب");
      if (!current.proofAssetId) throw new ValidationError("FID-VAL-002", "يرجى رفع إثبات الدفع قبل إرسال الطلب");
      const submittedAt = now();
      const result = await repository.submitPaymentRequest(paymentRequestId, submittedAt);
      await repository.addLog(paymentRequestId, "SUBMITTED", undefined, undefined, "تم تقديم طلب الدفع للمراجعة");
      await repository.createNotification(result.tenantId, "payment_submitted", "تم تقديم طلب الدفع", "تم تقديم طلب الدفع الخاص بك بنجاح. سيتم مراجعته من قبل فريق الإدارة.", "normal");
      await repository.createNotificationLog("payment_submitted", "طلب دفع جديد", `تم تقديم طلب دفع جديد للعميل ${result.tenantId}`, "billing", undefined, result.tenantId);
      await repository.recordAudit(undefined, result.tenantId, "PAYMENT_REQUEST_SUBMITTED", "PaymentRequest", paymentRequestId, current);
      return result;
    },

    async getCustomerActivePaymentRequest(tenantId: string) {
      return repository.getCustomerActivePaymentRequest(tenantId);
    },

    async approvePayment(input: { paymentRequestId: string; reviewerId: string; adminName?: string; adminNote?: string; durationPreset?: LifecycleDurationPreset; customDays?: number }) {
      const payment = await repository.getPaymentRequestById(input.paymentRequestId);
      assertValidTransition(payment.status as PaymentStatus, "APPROVED", "FID-PAY-001");
      if (!payment.proofAssetId) throw new ValidationError("FID-VAL-002", "لا يمكن قبول طلب بدون إثبات دفع");
      const reviewedAt = now();
      const preset = input.durationPreset && input.durationPreset !== "keep" ? input.durationPreset : "30";
      const periodEnd = getLifecycleEndDate(reviewedAt, preset, input.customDays);
      const approved = await repository.approvePayment(input.paymentRequestId, input.reviewerId, input.adminNote, reviewedAt);
      await repository.activateSubscription(approved.tenantId, approved.subscriptionId, approved.planId, reviewedAt, periodEnd);
      await repository.recordSubscriptionChange(approved.subscriptionId, payment.subscription.planId, approved.planId, payment.subscription.status, "ACTIVE", "ACTIVATE", undefined, `تم التفعيل لمدة ${preset === "forever" ? "دائمة" : "محددة"}`);
      await repository.addLog(input.paymentRequestId, "APPROVED", undefined, input.adminName, input.adminNote || "تم قبول طلب الدفع وتفعيل الاشتراك", { activatedAt: reviewedAt.toISOString(), expiresAt: periodEnd?.toISOString() ?? null, durationPreset: preset, customDays: input.customDays ?? null, adminActorId: input.reviewerId });
      await repository.createNotification(approved.tenantId, "payment_approved", "تم قبول طلب الدفع", periodEnd ? `تم تفعيل اشتراكك حتى ${periodEnd.toLocaleDateString("ar-EG")}.` : "تم تفعيل اشتراكك بشكل دائم.", "high");
      await repository.createNotificationLog("payment_approved", "تم قبول طلب الدفع", `تمت الموافقة على طلب الدفع ${input.paymentRequestId.slice(0, 8)}...`, "billing", undefined, approved.tenantId);
      await repository.recordAudit(undefined, approved.tenantId, "PAYMENT_APPROVED", "PaymentRequest", input.paymentRequestId, { adminNote: input.adminNote, activatedAt: reviewedAt.toISOString(), expiresAt: periodEnd?.toISOString() ?? null, durationPreset: preset, customDays: input.customDays ?? null, adminActorId: input.reviewerId });
      await repository.recordAudit(undefined, approved.tenantId, "SUBSCRIPTION_ACTIVATED", "Subscription", approved.subscriptionId, { planId: approved.planId, expiresAt: periodEnd?.toISOString() ?? null, durationPreset: preset, adminActorId: input.reviewerId });
    },

    async rejectPayment(input: { paymentRequestId: string; reviewerId: string; adminName?: string; reason: string; adminNote?: string }) {
      if (!input.reason?.trim()) throw new ValidationError("FID-VAL-002", "سبب الرفض مطلوب");
      const payment = await repository.getPaymentRequestById(input.paymentRequestId);
      assertValidTransition(payment.status as PaymentStatus, "REJECTED", "FID-PAY-002");
      const reviewedAt = now();
      const rejected = await repository.rejectPayment(input.paymentRequestId, input.reviewerId, input.reason, reviewedAt, input.adminNote);
      await repository.addLog(input.paymentRequestId, "REJECTED", undefined, input.adminName, input.reason, { adminActorId: input.reviewerId });
      await repository.createNotification(rejected.tenantId, "payment_rejected", "تم رفض طلب الدفع", `عذراً، تم رفض طلب الدفع الخاص بك. السبب: ${input.reason}.`, "high");
      await repository.createNotificationLog("payment_rejected", "تم رفض طلب الدفع", `تم رفض طلب الدفع: ${input.reason}`, "billing", undefined, rejected.tenantId);
      await repository.recordAudit(undefined, rejected.tenantId, "PAYMENT_REJECTED", "PaymentRequest", input.paymentRequestId, { reason: input.reason, adminNote: input.adminNote, adminActorId: input.reviewerId });
    },

    async requestReupload(input: { paymentRequestId: string; reviewerId: string; adminName?: string; note: string }) {
      if (!input.note?.trim()) throw new ValidationError("FID-VAL-002", "ملاحظة إعادة الرفع مطلوبة");
      const payment = await repository.getPaymentRequestById(input.paymentRequestId);
      assertValidTransition(payment.status as PaymentStatus, "DRAFT", "FID-PAY-003");
      await repository.requestReupload(input.paymentRequestId, input.reviewerId, input.note);
      await repository.addLog(input.paymentRequestId, "REUPLOAD_REQUESTED", undefined, input.adminName, input.note, { adminActorId: input.reviewerId });
      await repository.createNotification(payment.tenantId, "reupload_requested", "مطلوب إعادة رفع إثبات الدفع", `يرجى إعادة رفع صورة إثبات الدفع. ملاحظة: ${input.note}`, "high");
      await repository.createNotificationLog("reupload_requested", "مطلوب إعادة رفع إثبات الدفع", `طلب إعادة رفع إثبات الدفع: ${input.note}`, "billing", undefined, payment.tenantId);
      await repository.recordAudit(undefined, payment.tenantId, "PAYMENT_REUPLOAD_REQUESTED", "PaymentRequest", input.paymentRequestId, { note: input.note, adminActorId: input.reviewerId });
    },

    async addPaymentNote(input: { paymentRequestId: string; adminId: string; adminName?: string; note: string }) {
      if (!input.note?.trim()) throw new ValidationError("FID-VAL-002", "الملاحظة مطلوبة");
      const payment = await repository.getPaymentRequestById(input.paymentRequestId);
      await repository.addLog(input.paymentRequestId, "ADMIN_NOTE", undefined, input.adminName, input.note, { adminActorId: input.adminId });
      await repository.recordAudit(undefined, payment.tenantId, "PAYMENT_NOTE_ADDED", "PaymentRequest", input.paymentRequestId, { note: input.note, adminActorId: input.adminId });
    },

    async cancelPayment(paymentRequestId: string) {
      const current = await repository.getPaymentRequestById(paymentRequestId);
      assertValidTransition(current.status as PaymentStatus, "CANCELLED", "FID-PAY-004");
      return repository.cancelPaymentRequest(paymentRequestId, now());
    }
  };
}
