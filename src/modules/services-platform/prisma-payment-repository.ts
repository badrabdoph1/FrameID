import { AcquisitionStatus, PaymentStatus, Prisma, type PrismaClient } from "@prisma/client";

import type { ServicesPaymentRepository } from "./payment-integration";

async function assertTerminalReplay(
  tx: Prisma.TransactionClient,
  input: { idempotencyKey: string; eventName: string; paymentRequestId: string; acquisitionId: string },
) {
  const event = await tx.servicesOutboxEvent.findUnique({
    where: { deduplicationKey: input.idempotencyKey },
    select: { eventName: true, aggregateId: true, payload: true },
  });
  const payload = event?.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
    ? event.payload as Record<string, unknown>
    : null;
  if (!event || event.eventName !== input.eventName || event.aggregateId !== input.acquisitionId || payload?.paymentRequestId !== input.paymentRequestId) {
    throw new Error("Idempotency key does not match the completed payment command.");
  }
}

export function createPrismaServicesPaymentRepository(prisma: PrismaClient): ServicesPaymentRepository {
  return {
    getPayableAcquisition(acquisitionId) {
      return prisma.acquisition.findUnique({
        where: { id: acquisitionId },
        select: { id: true, tenantId: true, status: true, acceptedTotal: true, acceptedCurrency: true },
      });
    },
    async createDraft(input) {
      return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Acquisition" WHERE id = ${input.acquisitionId} FOR UPDATE`;
        const acquisition = await tx.acquisition.findUniqueOrThrow({
          where: { id: input.acquisitionId },
          select: { tenantId: true, status: true, acceptedTotal: true, acceptedCurrency: true },
        });
        if (acquisition.tenantId !== input.tenantId || acquisition.status !== AcquisitionStatus.AWAITING_PAYMENT) {
          throw new Error("Acquisition is no longer payable by this tenant.");
        }
        if (acquisition.acceptedTotal !== input.amount || acquisition.acceptedCurrency !== input.currency) {
          throw new Error("Payment draft no longer matches the immutable acquisition snapshot.");
        }
        const existing = await tx.paymentRequest.findFirst({
          where: { acquisitionId: input.acquisitionId, status: { in: [PaymentStatus.DRAFT, PaymentStatus.SUBMITTED, PaymentStatus.UNDER_REVIEW] }, deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true },
        });
        if (existing && existing.status !== PaymentStatus.DRAFT) throw new Error("A payment request is already under review for this acquisition.");
        if (existing) return { id: existing.id, status: "DRAFT" as const };
        const created = await tx.paymentRequest.create({
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
      });
    },
    async submit(input) {
      return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "PaymentRequest" WHERE id = ${input.paymentRequestId} FOR UPDATE`;
        const payment = await tx.paymentRequest.findFirst({
          where: { id: input.paymentRequestId, tenantId: input.tenantId, acquisitionId: { not: null }, deletedAt: null },
        });
        if (!payment?.acquisitionId) throw new Error("Services payment request was not found for this tenant.");
        if (payment.status === PaymentStatus.SUBMITTED || payment.status === PaymentStatus.UNDER_REVIEW) {
          return { id: payment.id, status: "SUBMITTED" as const, acquisitionId: payment.acquisitionId };
        }
        if (payment.status !== PaymentStatus.DRAFT) throw new Error(`Payment cannot be submitted from status ${payment.status}`);
        await tx.paymentRequest.update({
          where: { id: payment.id },
          data: { proofAssetId: input.proofAssetId, submittedAt: input.submittedAt, status: PaymentStatus.SUBMITTED },
        });
        await tx.paymentRequestLog.create({
          data: { paymentRequestId: payment.id, fromStatus: PaymentStatus.DRAFT, toStatus: PaymentStatus.SUBMITTED, action: "SERVICES_PAYMENT_SUBMITTED" },
        });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: input.idempotencyKey }, update: {},
          create: { aggregateType: "Acquisition", aggregateId: payment.acquisitionId, eventName: "services.payment.submitted", payload: { acquisitionId: payment.acquisitionId, paymentRequestId: payment.id, tenantId: payment.tenantId }, deduplicationKey: input.idempotencyKey },
        });
        return { id: payment.id, status: "SUBMITTED" as const, acquisitionId: payment.acquisitionId };
      });
    },
    async approve(input) {
      return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "PaymentRequest" WHERE id = ${input.paymentRequestId} FOR UPDATE`;
        const payment = await tx.paymentRequest.findUniqueOrThrow({ where: { id: input.paymentRequestId } });
        if (!payment.acquisitionId) throw new Error("Payment request is not linked to a services acquisition.");
        if (payment.status === PaymentStatus.APPROVED) {
          return { acquisitionId: payment.acquisitionId, tenantId: payment.tenantId };
        }
        const approvableStatuses: PaymentStatus[] = [PaymentStatus.SUBMITTED, PaymentStatus.UNDER_REVIEW, PaymentStatus.DRAFT];
        if (!approvableStatuses.includes(payment.status)) {
          throw new Error(`Payment cannot be approved from status ${payment.status}`);
        }
        await tx.$queryRaw`SELECT id FROM "Acquisition" WHERE id = ${payment.acquisitionId} FOR UPDATE`;
        const acquisition = await tx.acquisition.findUniqueOrThrow({ where: { id: payment.acquisitionId } });
        if (acquisition.status !== AcquisitionStatus.AWAITING_PAYMENT) {
          throw new Error(`Acquisition cannot be paid from status ${acquisition.status}`);
        }
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
        await tx.$queryRaw`SELECT id FROM "PaymentRequest" WHERE id = ${input.paymentRequestId} FOR UPDATE`;
        const payment = await tx.paymentRequest.findUniqueOrThrow({ where: { id: input.paymentRequestId } });
        if (!payment.acquisitionId) throw new Error("Payment request is not linked to a services acquisition.");
        if (payment.status === PaymentStatus.REJECTED) {
          await assertTerminalReplay(tx, { idempotencyKey: input.idempotencyKey, eventName: "services.payment.rejected", paymentRequestId: payment.id, acquisitionId: payment.acquisitionId });
          return { acquisitionId: payment.acquisitionId, tenantId: payment.tenantId };
        }
        if (payment.status !== PaymentStatus.DRAFT && payment.status !== PaymentStatus.SUBMITTED && payment.status !== PaymentStatus.UNDER_REVIEW) {
          throw new Error(`Payment cannot be rejected from status ${payment.status}`);
        }
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
        await tx.$queryRaw`SELECT id FROM "PaymentRequest" WHERE id = ${input.paymentRequestId} FOR UPDATE`;
        const payment = await tx.paymentRequest.findUniqueOrThrow({ where: { id: input.paymentRequestId } });
        if (!payment.acquisitionId) throw new Error("Only approved services payments can be refunded.");
        if (payment.status === PaymentStatus.REFUNDED) {
          await assertTerminalReplay(tx, { idempotencyKey: input.idempotencyKey, eventName: "services.payment.refunded", paymentRequestId: payment.id, acquisitionId: payment.acquisitionId });
          return { acquisitionId: payment.acquisitionId, tenantId: payment.tenantId };
        }
        if (payment.status !== PaymentStatus.APPROVED) throw new Error("Only approved services payments can be refunded.");
        await tx.$queryRaw`SELECT id FROM "Acquisition" WHERE id = ${payment.acquisitionId} FOR UPDATE`;
        const acquisition = await tx.acquisition.findUniqueOrThrow({ where: { id: payment.acquisitionId }, select: { status: true } });
        if (acquisition.status !== AcquisitionStatus.PAID && acquisition.status !== AcquisitionStatus.FULFILLED) {
          throw new Error(`Acquisition cannot be refunded safely from status ${acquisition.status}`);
        }
        await tx.paymentRequest.update({ where: { id: payment.id }, data: { status: PaymentStatus.REFUNDED, reviewedByUserId: input.reviewerId, reviewedAt: input.refundedAt, adminNote: input.reason } });
        await tx.acquisition.update({ where: { id: payment.acquisitionId }, data: { status: AcquisitionStatus.REFUNDED } });
        await tx.paymentRequestLog.create({
          data: { paymentRequestId: payment.id, fromStatus: payment.status, toStatus: PaymentStatus.REFUNDED, action: "SERVICES_PAYMENT_REFUNDED", actorUserId: input.reviewerId, note: input.reason },
        });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: input.idempotencyKey }, update: {},
          create: { aggregateType: "Acquisition", aggregateId: payment.acquisitionId, eventName: "services.payment.refunded", payload: { acquisitionId: payment.acquisitionId, paymentRequestId: payment.id, tenantId: payment.tenantId, reason: input.reason, revokeEntitlements: true }, deduplicationKey: input.idempotencyKey },
        });
        return { acquisitionId: payment.acquisitionId, tenantId: payment.tenantId };
      });
    },
  };
}
