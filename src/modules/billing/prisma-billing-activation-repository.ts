import type { BillingActivationRepository } from "@/modules/billing/billing-activation-service";

type PrismaBillingActivationClient = {
  paymentRequest: {
    create(input: unknown): Promise<unknown>;
    update(input: unknown): Promise<unknown>;
    findFirst(input: unknown): Promise<unknown>;
  };
  subscription: {
    update(input: unknown): Promise<unknown>;
  };
  tenant: {
    update(input: unknown): Promise<unknown>;
    findUnique(input: unknown): Promise<unknown>;
  };
  site: {
    updateMany(input: unknown): Promise<{ count: number }>;
  };
  paymentRequestLog: {
    create(input: unknown): Promise<unknown>;
    findMany(input: unknown): Promise<unknown>;
  };
  notification: {
    create(input: unknown): Promise<unknown>;
  };
  notificationLog: {
    create(input: unknown): Promise<unknown>;
  };
  auditLog: {
    create(input: unknown): Promise<unknown>;
  };
  subscriptionChange: {
    create(input: unknown): Promise<unknown>;
  };
  plan: {
    findUnique(input: unknown): Promise<unknown | null>;
  };
};

type PaymentRequestUpdateResult = {
  tenantId: string;
  subscriptionId: string;
  planId: string | null;
};

export function createPrismaBillingActivationRepository(
  prisma: PrismaBillingActivationClient
): BillingActivationRepository {
  return {
    async createDraftPaymentRequest(input) {
      const payment = (await prisma.paymentRequest.create({
        data: {
          tenantId: input.tenantId,
          subscriptionId: input.subscriptionId,
          planId: input.planId,
          method: input.method,
          amount: input.amount,
          currency: input.currency ?? "EGP",
          status: "DRAFT"
        },
        select: {
          id: true,
          status: true
        }
      })) as { id: string; status: "DRAFT" };

      return payment;
    },

    async updatePaymentRequest(id, data) {
      await prisma.paymentRequest.update({
        where: { id },
        data
      });
    },

    async uploadProof(id, proofAssetId) {
      await prisma.paymentRequest.update({
        where: { id },
        data: { proofAssetId }
      });
    },

    async removeProof(id) {
      await prisma.paymentRequest.update({
        where: { id },
        data: { proofAssetId: null }
      });
    },

    async submitPaymentRequest(id, submittedAt) {
      const result = (await prisma.paymentRequest.update({
        where: { id },
        data: {
          status: "SUBMITTED",
          submittedAt
        },
        select: {
          tenantId: true,
          subscriptionId: true
        }
      })) as { tenantId: string; subscriptionId: string };

      return result;
    },

    async getPaymentRequestById(id) {
      const result = (await prisma.paymentRequest.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          status: true,
          tenantId: true,
          subscriptionId: true,
          method: true,
          amount: true,
          planId: true,
          reference: true,
          proofAssetId: true,
          submittedAt: true,
          adminNote: true,
          rejectionReason: true,
          tenant: { select: { id: true, status: true } },
          plan: { select: { id: true, name: true } },
          paymentAccount: { select: { id: true, accountName: true } },
          proofAsset: { select: { id: true, url: true } }
        }
      })) as {
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
      } | null;

      if (!result) {
        throw new Error("Payment request not found");
      }

      return result;
    },

    async getCustomerActivePaymentRequest(tenantId) {
      const result = (await prisma.paymentRequest.findFirst({
        where: {
          tenantId,
          status: {
            in: ["DRAFT", "SUBMITTED", "PENDING", "UNDER_REVIEW"]
          },
          deletedAt: null
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          method: true,
          amount: true,
          reference: true,
          proofAssetId: true,
          planId: true,
          submittedAt: true,
          rejectionReason: true
        }
      })) as {
        id: string;
        status: string;
        method: string;
        amount: number;
        reference: string | null;
        proofAssetId: string | null;
        planId: string | null;
        submittedAt: Date | null;
        rejectionReason: string | null;
      } | null;

      return result;
    },

    async approvePayment(paymentRequestId, reviewerId, adminNote, reviewedAt) {
      const result = (await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: "APPROVED",
          reviewedById: reviewerId,
          adminNote,
          reviewedAt: reviewedAt ?? new Date()
        },
        select: {
          tenantId: true,
          subscriptionId: true,
          planId: true
        }
      })) as PaymentRequestUpdateResult;

      return result;
    },

    async rejectPayment(paymentRequestId, reviewerId, reason, reviewedAt, adminNote) {
      const result = (await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: "REJECTED",
          reviewedById: reviewerId,
          rejectionReason: reason,
          adminNote: adminNote ?? null,
          reviewedAt: reviewedAt ?? new Date()
        },
        select: {
          tenantId: true
        }
      })) as { tenantId: string };

      return result;
    },

    async requestReupload(paymentRequestId, reviewerId, _note) {
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: "DRAFT",
          proofAssetId: null,
          reviewedById: reviewerId
        }
      });
    },

    async getPlan(planId: string) {
      const plan = (await prisma.plan.findUnique({
        where: { id: planId },
        select: { id: true, billingInterval: true, priceAmount: true },
      })) as { id: string; billingInterval: string; priceAmount: number } | null;

      return plan;
    },

    async activateSubscription(tenantId, subscriptionId, planId, activatedAt, currentPeriodEnd) {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          planId: planId ?? undefined,
          activatedAt,
          currentPeriodStart: activatedAt,
          currentPeriodEnd: currentPeriodEnd ?? null,
          expiresAt: currentPeriodEnd ?? null
        }
      });

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: "ACTIVE"
        }
      });

      await prisma.site.updateMany({
        where: {
          tenantId,
          deletedAt: null
        },
        data: {
          status: "PUBLISHED",
          isPublished: true
        }
      });
    },

    async cancelSubscription(subscriptionId) {
      const sub = (await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "CANCELLED",
          endsAt: new Date()
        },
        select: {
          tenantId: true
        }
      })) as { tenantId: string };

      await prisma.tenant.update({
        where: { id: sub.tenantId },
        data: {
          status: "EXPIRED"
        }
      });

      await prisma.site.updateMany({
        where: { tenantId: sub.tenantId, deletedAt: null },
        data: {
          isActive: false
        }
      });
    },

    async cancelPaymentRequest(id, cancelledAt) {
      const result = (await prisma.paymentRequest.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt
        },
        select: {
          tenantId: true,
          subscriptionId: true
        }
      })) as { tenantId: string; subscriptionId: string };

      return result;
    },

    async extendTrial(tenantId, days) {
      const tenant = (await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          trialEndsAt: { increment: days * 24 * 60 * 60 * 1000 }
        },
        select: {
          trialEndsAt: true
        }
      })) as { trialEndsAt: Date };

      return { newEndDate: tenant.trialEndsAt };
    },

    async endTrial(tenantId) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          trialEndsAt: new Date(0)
        }
      });
    },

    async addLog(paymentRequestId, action, actorUserId, actorName, note, metadata) {
      await prisma.paymentRequestLog.create({
        data: {
          paymentRequestId,
          action,
          actorUserId,
          actorName,
          note,
          metadata
        }
      });
    },

    async getLogs(paymentRequestId) {
      const logs = (await prisma.paymentRequestLog.findMany({
        where: { paymentRequestId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          action: true,
          actorName: true,
          note: true,
          createdAt: true
        }
      })) as Array<{
        id: string;
        action: string;
        actorName: string | null;
        note: string | null;
        createdAt: Date;
      }>;

      return logs;
    },

    async createNotification(tenantId, type, title, body, priority) {
      await prisma.notification.create({
        data: {
          tenantId,
          type,
          title,
          body,
          priority: priority ?? "info"
        }
      });
    },

    async createNotificationLog(type, title, body, category, userId, tenantId) {
      await prisma.notificationLog.create({
        data: {
          type,
          title,
          body,
          category,
          userId,
          tenantId
        }
      });
    },

    async recordAudit(actorUserId, tenantId, action, entityType, entityId, metadata) {
      await prisma.auditLog.create({
        data: {
          actorUserId,
          tenantId,
          action: action ?? "UNKNOWN",
          entityType: entityType ?? "Unknown",
          entityId,
          metadata
        }
      });
    },

    async recordSubscriptionChange(
      subscriptionId,
      fromPlanId,
      toPlanId,
      fromStatus,
      toStatus,
      changeType,
      initiatedById,
      reason
    ) {
      await prisma.subscriptionChange.create({
        data: {
          subscriptionId,
          fromPlanId,
          toPlanId,
          fromStatus,
          toStatus,
          changeType,
          initiatedById,
          reason
        }
      });
    },

    async getTrialInfo(tenantId) {
      const tenant = (await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          trialStartedAt: true,
          trialEndsAt: true,
          trialDays: true,
          gracePeriodEndsAt: true
        }
      })) as {
        trialStartedAt: Date;
        trialEndsAt: Date;
        trialDays: number;
        gracePeriodEndsAt: Date | null;
      } | null;

      return tenant;
    },

    daysRemaining(trialEndsAt) {
      const now = new Date();
      const diff = trialEndsAt.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
  };
}
