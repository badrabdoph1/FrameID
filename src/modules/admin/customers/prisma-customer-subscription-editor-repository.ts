import type { PrismaClient } from "@prisma/client";

import type {
  CustomerSubscriptionEditCommand,
  CustomerSubscriptionEditorRepository,
  CustomerSubscriptionSnapshot,
} from "./customer-subscription-editor";

type PrismaTransaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

function tenantStatusFor(status: CustomerSubscriptionEditCommand["status"]) {
  if (status === "ACTIVE") return "ACTIVE" as const;
  if (status === "TRIAL") return "TRIAL" as const;
  if (status === "SUSPENDED") return "SUSPENDED" as const;
  return "EXPIRED" as const;
}

function siteStateFor(status: CustomerSubscriptionEditCommand["status"]) {
  if (status === "ACTIVE" || status === "TRIAL") {
    return { status: "PUBLISHED" as const, isPublished: true };
  }
  if (status === "SUSPENDED") {
    return { status: "SUSPENDED" as const, isPublished: false };
  }
  return { status: "EXPIRED" as const, isPublished: false };
}

export function createPrismaCustomerSubscriptionEditorRepository(
  prisma: PrismaClient,
): CustomerSubscriptionEditorRepository {
  return {
    async listActivePlans() {
      return prisma.plan.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { priceAmount: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          priceAmount: true,
          currency: true,
          billingInterval: true,
          isActive: true,
        },
      });
    },

    async getPlan(planId) {
      return prisma.plan.findUnique({
        where: { id: planId },
        select: {
          id: true,
          code: true,
          name: true,
          priceAmount: true,
          currency: true,
          billingInterval: true,
          isActive: true,
        },
      });
    },

    async getSubscription(tenantId, subscriptionId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          ...(subscriptionId ? { id: subscriptionId } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          tenantId: true,
          planId: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      });
      return subscription as CustomerSubscriptionSnapshot | null;
    },

    async applyEdit(command) {
      return prisma.$transaction(async (tx: PrismaTransaction) => {
        const [tenant, plan] = await Promise.all([
          tx.tenant.findFirst({ where: { id: command.tenantId, deletedAt: null }, select: { id: true } }),
          tx.plan.findFirst({ where: { id: command.planId, isActive: true }, select: { id: true } }),
        ]);
        if (!tenant) throw new Error("العميل غير موجود أو مؤرشف");
        if (!plan) throw new Error("الباقة المختارة غير متاحة حاليًا");

        const subscription = command.subscriptionId
          ? await tx.subscription.update({
              where: { id: command.subscriptionId, tenantId: command.tenantId },
              data: {
                planId: command.planId,
                status: command.status,
                activatedAt: command.status === "ACTIVE" ? command.periodStart : null,
                currentPeriodStart: command.periodStart,
                currentPeriodEnd: command.periodEnd,
                expiresAt: command.expiresAt,
                cancelledAt: command.status === "CANCELLED" ? new Date() : null,
                deletedAt: null,
              },
              select: { id: true },
            })
          : await tx.subscription.create({
              data: {
                tenantId: command.tenantId,
                planId: command.planId,
                status: command.status,
                activatedAt: command.status === "ACTIVE" ? command.periodStart : null,
                currentPeriodStart: command.periodStart,
                currentPeriodEnd: command.periodEnd,
                expiresAt: command.expiresAt,
                cancelledAt: command.status === "CANCELLED" ? new Date() : null,
              },
              select: { id: true },
            });

        await tx.tenant.update({
          where: { id: command.tenantId },
          data: {
            status: tenantStatusFor(command.status),
            trialEndsAt: command.status === "TRIAL" ? command.periodEnd : undefined,
            gracePeriodEndsAt: command.status === "ACTIVE" ? null : undefined,
          },
        });
        await tx.site.updateMany({
          where: { tenantId: command.tenantId, deletedAt: null },
          data: siteStateFor(command.status),
        });

        await tx.subscriptionChange.create({
          data: {
            tenantId: command.tenantId,
            subscriptionId: subscription.id,
            fromPlanId: command.previousPlanId,
            toPlanId: command.planId,
            fromStatus: command.previousStatus,
            toStatus: command.status,
            changeType: command.subscriptionId ? "ADMIN_EDIT" : "ADMIN_CREATE",
            initiatedById: command.actor.id,
            reason: command.note,
          },
        });

        let paymentId: string | null = null;
        if (command.payment) {
          paymentId = command.payment.id;
          await tx.paymentRequest.create({
            data: {
              id: command.payment.id,
              tenantId: command.tenantId,
              subscriptionId: subscription.id,
              planId: command.planId,
              amount: command.payment.amount,
              currency: command.payment.currency,
              method: command.payment.method,
              status: "APPROVED",
              reference: command.payment.reference,
              submittedAt: command.periodStart,
              adminNote: command.note ?? "دفعة سجلها المشرف من ملف العميل",
              reviewedByUserId: command.actor.id,
              reviewedAt: command.periodStart,
              updatedAt: command.periodStart,
            },
          });
          await tx.paymentRequestLog.create({
            data: {
              paymentRequestId: command.payment.id,
              fromStatus: null,
              toStatus: "APPROVED",
              action: "MANUAL_PAYMENT_APPROVED",
              actorUserId: command.actor.id,
              actorName: command.actor.name,
              note: command.note ?? "تم تسجيل دفعة معتمدة يدويًا من ملف العميل",
              metadata: { source: "admin_customer_subscription_editor" },
            },
          });
        }

        await tx.auditLog.create({
          data: {
            actorId: command.actor.id,
            tenantId: command.tenantId,
            action: command.subscriptionId ? "CUSTOMER_SUBSCRIPTION_EDITED" : "CUSTOMER_SUBSCRIPTION_CREATED",
            entityType: "Subscription",
            entityId: subscription.id,
            metadata: {
              fromPlanId: command.previousPlanId,
              toPlanId: command.planId,
              fromStatus: command.previousStatus,
              toStatus: command.status,
              periodEnd: command.periodEnd.toISOString(),
              expiresAt: command.expiresAt?.toISOString() ?? null,
              paymentId,
              note: command.note,
            },
          },
        });

        return { subscriptionId: subscription.id, paymentId };
      });
    },
  };
}
