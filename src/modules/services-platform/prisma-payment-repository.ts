import { AcquisitionStatus, PaymentStatus, Prisma, type PrismaClient } from "@prisma/client";

import type { ServicesPaymentRepository } from "./payment-integration";

export function createPrismaServicesPaymentRepository(prisma: PrismaClient): ServicesPaymentRepository {
  return {
    getPayableAcquisition(acquisitionId) {
      return prisma.acquisition.findUnique({
        where: { id: acquisitionId },
        select: { id: true, tenantId: true, status: true, acceptedTotal: true, acceptedCurrency: true },
      });
    },
    async createDraft(input) {
      const existing = await prisma.paymentRequest.findFirst({
        where: { acquisitionId: input.acquisitionId, status: { in: [PaymentStatus.DRAFT, PaymentStatus.SUBMITTED, PaymentStatus.UNDER_REVIEW] }, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true },
      });
      if (existing) return { id: existing.id, status: "DRAFT" as const };
      const created = await prisma.paymentRequest.create({
        data: {
          acquisitionId: input.acquisitionId,
          tenantId: input.tenantId,
          method: input.method,
          paymentAccountId: input.paymentAccountId,
          reference: input.reference,
          amount: input.amount,
          currency: input.currency,
        },
        select: { id: true },
      });
      return { id: created.id, status: "DRAFT" as const };
    },
    async approve(input) {
      return prisma.$transaction(async (tx) => {
        const payment = await tx.paymentRequest.findUniqueOrThrow({ where: { id: input.paymentRequestId } });
        if (!payment.acquisitionId) throw new Error("Payment request is not linked to a services acquisition.");
        if (payment.status === PaymentStatus.APPROVED) {
          return { acquisitionId: payment.acquisitionId, tenantId: payment.tenantId };
        }
        const approvableStatuses: PaymentStatus[] = [PaymentStatus.SUBMITTED, PaymentStatus.UNDER_REVIEW, PaymentStatus.DRAFT];
        if (!approvableStatuses.includes(payment.status)) {
          throw new Error(`Payment cannot be approved from status ${payment.status}`);
        }
        const acquisition = await tx.acquisition.findUniqueOrThrow({ where: { id: payment.acquisitionId } });
        if (acquisition.acceptedTotal !== payment.amount || acquisition.acceptedCurrency !== payment.currency) {
          throw new Error("Payment amount no longer matches the immutable acquisition snapshot.");
        }
        await tx.paymentRequest.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.APPROVED, reviewedByUserId: input.reviewerId, reviewedAt: input.approvedAt },
        });
        await tx.acquisition.update({
          where: { id: acquisition.id },
          data: { status: AcquisitionStatus.PAID, paidAt: input.approvedAt },
        });
        await tx.paymentRequestLog.create({
          data: { paymentRequestId: payment.id, fromStatus: payment.status, toStatus: PaymentStatus.APPROVED, action: "SERVICES_PAYMENT_APPROVED", actorUserId: input.reviewerId },
        });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: input.idempotencyKey },
          update: {},
          create: {
            aggregateType: "Acquisition",
            aggregateId: acquisition.id,
            eventName: "services.payment.approved",
            payload: { acquisitionId: acquisition.id, paymentRequestId: payment.id, tenantId: payment.tenantId },
            deduplicationKey: input.idempotencyKey,
            correlationId: acquisition.correlationId,
          },
        });
        return { acquisitionId: acquisition.id, tenantId: payment.tenantId };
      });
    },
    async reject(input) {
      return prisma.$transaction(async (tx) => {
        const payment = await tx.paymentRequest.findUniqueOrThrow({ where: { id: input.paymentRequestId } });
        if (!payment.acquisitionId) throw new Error("Payment request is not linked to a services acquisition.");
        await tx.paymentRequest.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REJECTED, reviewedByUserId: input.reviewerId, reviewedAt: input.rejectedAt, rejectionReason: input.reason },
        });
        await tx.paymentRequestLog.create({ data: { paymentRequestId: payment.id, fromStatus: payment.status, toStatus: PaymentStatus.REJECTED, action: "SERVICES_PAYMENT_REJECTED", actorUserId: input.reviewerId, note: input.reason } });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: input.idempotencyKey }, update: {},
          create: { aggregateType: "Acquisition", aggregateId: payment.acquisitionId, eventName: "services.payment.rejected", payload: { acquisitionId: payment.acquisitionId, paymentRequestId: payment.id, reason: input.reason }, deduplicationKey: input.idempotencyKey },
        });
        return { acquisitionId: payment.acquisitionId, tenantId: payment.tenantId };
      });
    },
    async refund(input) {
      return prisma.$transaction(async (tx) => {
        const payment = await tx.paymentRequest.findUniqueOrThrow({ where: { id: input.paymentRequestId } });
        if (!payment.acquisitionId || payment.status !== PaymentStatus.APPROVED) throw new Error("Only approved services payments can be refunded.");
        await tx.paymentRequest.update({ where: { id: payment.id }, data: { status: PaymentStatus.REFUNDED, reviewedByUserId: input.reviewerId, reviewedAt: input.refundedAt, adminNote: input.reason } });
        await tx.acquisition.update({ where: { id: payment.acquisitionId }, data: { status: AcquisitionStatus.REFUNDED } });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: input.idempotencyKey }, update: {},
          create: { aggregateType: "Acquisition", aggregateId: payment.acquisitionId, eventName: "services.payment.refunded", payload: { acquisitionId: payment.acquisitionId, paymentRequestId: payment.id, reason: input.reason, revokeEntitlements: true }, deduplicationKey: input.idempotencyKey },
        });
        return { acquisitionId: payment.acquisitionId, tenantId: payment.tenantId };
      });
    },
  };
}
