import type { AdminOverviewMetrics } from "@/modules/admin/admin-overview-view-model";

type PrismaAdminOverviewClient = {
  user: {
    count(input: unknown): Promise<number>;
  };
  tenant: {
    count(input: unknown): Promise<number>;
  };
  paymentRequest: {
    count(input: unknown): Promise<number>;
    aggregate(input: unknown): Promise<unknown>;
  };
  site: {
    count(input: unknown): Promise<number>;
  };
};

export function createPrismaAdminOverviewRepository(
  prisma: PrismaAdminOverviewClient
) {
  return {
    async getMetrics(now: Date): Promise<AdminOverviewMetrics> {
      const startOfDay = new Date(now);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setUTCDate(sevenDaysFromNow.getUTCDate() + 7);
      const startOfMonth = new Date(now);
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);

      const [
        newUsersToday,
        activeTrials,
        expiringTrials,
        pendingPayments,
        activeSites,
        revenue
      ] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: startOfDay
            },
            deletedAt: null
          }
        }),
        prisma.tenant.count({
          where: {
            status: "TRIAL",
            deletedAt: null
          }
        }),
        prisma.tenant.count({
          where: {
            status: "TRIAL",
            trialEndsAt: {
              gte: now,
              lte: sevenDaysFromNow
            },
            deletedAt: null
          }
        }),
        prisma.paymentRequest.count({
          where: {
            status: "PENDING",
            deletedAt: null
          }
        }),
        prisma.site.count({
          where: {
            isPublished: true,
            deletedAt: null
          }
        }),
        prisma.paymentRequest.aggregate({
          _sum: {
            amount: true
          },
          where: {
            status: "APPROVED",
            reviewedAt: {
              gte: startOfMonth
            },
            deletedAt: null
          }
        })
      ]);

      const monthlyRevenue = readMonthlyRevenue(revenue);

      return {
        newUsersToday,
        activeTrials,
        expiringTrials,
        pendingPayments,
        activeSites,
        monthlyRevenue,
        currency: "EGP"
      };
    }
  };
}

function readMonthlyRevenue(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "_sum" in value &&
    typeof value._sum === "object" &&
    value._sum !== null &&
    "amount" in value._sum &&
    typeof value._sum.amount === "number"
  ) {
    return value._sum.amount;
  }

  return 0;
}
