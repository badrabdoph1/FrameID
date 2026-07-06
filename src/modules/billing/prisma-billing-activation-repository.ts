import type { BillingActivationRepository } from "@/modules/billing/billing-activation-service";

type PrismaBillingActivationClient = {
  paymentRequest: {
    create(input: unknown): Promise<unknown>;
    update(input: unknown): Promise<{
      tenantId: string;
      subscriptionId: string;
    }>;
  };
  subscription: {
    update(input: unknown): Promise<unknown>;
  };
  tenant: {
    update(input: unknown): Promise<unknown>;
  };
  site: {
    updateMany(input: unknown): Promise<{ count: number }>;
  };
  auditLog: {
    create(input: unknown): Promise<unknown>;
  };
};

export function createPrismaBillingActivationRepository(
  prisma: PrismaBillingActivationClient
): BillingActivationRepository {
  return {
    async createPaymentRequest(input) {
      const payment = (await prisma.paymentRequest.create({
        data: {
          tenantId: input.tenantId,
          subscriptionId: input.subscriptionId,
          method: input.method,
          amount: input.amount,
          currency: input.currency,
          reference: input.reference,
          proofAssetId: input.proofAssetId,
          status: "PENDING"
        },
        select: {
          id: true,
          status: true
        }
      })) as { id: string; status: "PENDING" };

      return payment;
    },
    async approvePayment(input) {
      return prisma.paymentRequest.update({
        where: {
          id: input.paymentRequestId
        },
        data: {
          status: "APPROVED",
          reviewedById: input.reviewerId,
          reviewedAt: input.reviewedAt,
          adminNote: input.adminNote
        },
        select: {
          tenantId: true,
          subscriptionId: true
        }
      });
    },
    async rejectPayment(input) {
      return prisma.paymentRequest.update({
        where: {
          id: input.paymentRequestId
        },
        data: {
          status: "REJECTED",
          reviewedById: input.reviewerId,
          reviewedAt: input.reviewedAt,
          adminNote: input.adminNote
        },
        select: {
          tenantId: true
        }
      });
    },
    async activateSubscription(input) {
      await prisma.subscription.update({
        where: {
          id: input.subscriptionId
        },
        data: {
          status: "ACTIVE",
          activatedAt: input.activatedAt,
          currentPeriodStart: input.activatedAt,
          currentPeriodEnd: null,
          expiresAt: null
        }
      });

      await prisma.tenant.update({
        where: {
          id: input.tenantId
        },
        data: {
          status: "ACTIVE"
        }
      });

      await prisma.site.updateMany({
        where: {
          tenantId: input.tenantId,
          deletedAt: null
        },
        data: {
          status: "PUBLISHED",
          isPublished: true
        }
      });
    },
    async recordAudit(input) {
      await prisma.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          tenantId: input.tenantId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata
        }
      });
    }
  };
}
