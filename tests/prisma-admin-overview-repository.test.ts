import { describe, expect, it } from "vitest";

import { createPrismaAdminOverviewRepository } from "@/modules/admin/prisma-admin-overview-repository";

describe("prisma admin overview repository", () => {
  it("loads platform metrics for the admin command center", async () => {
    const calls: string[] = [];
    const prisma = {
      user: {
        async count() {
          calls.push("users");
          return 12;
        }
      },
      tenant: {
        async count(args: { where: { status?: string; trialEndsAt?: unknown } }) {
          const kind = args.where.trialEndsAt ? "expiring" : args.where.status;
          calls.push(`tenants:${kind}`);
          return args.where.trialEndsAt ? 9 : 80;
        }
      },
      paymentRequest: {
        async count() {
          calls.push("payments");
          return 5;
        },
        async aggregate() {
          calls.push("revenue");
          return { _sum: { amount: 450000 } };
        }
      },
      site: {
        async count() {
          calls.push("sites");
          return 120;
        }
      }
    };
    const repository = createPrismaAdminOverviewRepository(prisma);

    await expect(
      repository.getMetrics(new Date("2026-07-06T12:00:00.000Z"))
    ).resolves.toEqual({
      newUsersToday: 12,
      activeTrials: 80,
      expiringTrials: 9,
      pendingPayments: 5,
      activeSites: 120,
      monthlyRevenue: 450000,
      currency: "EGP"
    });
    expect(calls).toEqual([
      "users",
      "tenants:TRIAL",
      "tenants:expiring",
      "payments",
      "sites",
      "revenue"
    ]);
  });
});
