import { describe, expect, it } from "vitest";

import { createPrismaAdminPaymentReviewRepository } from "@/modules/admin/prisma-admin-payment-review-repository";

describe("admin payment review repository", () => {
  it("loads pending payment requests with customer context", async () => {
    const prisma = {
      paymentRequest: {
        async findMany(args: { where: { status: "PENDING" }; take: number }) {
          expect(args.where.status).toBe("PENDING");
          expect(args.take).toBe(50);

          return [
            {
              id: "payment_1",
              method: "INSTAPAY",
              amount: 120000,
              currency: "EGP",
              reference: "ref",
              createdAt: new Date("2026-07-06T12:00:00.000Z"),
              tenant: { displayName: "Ali Studio" },
              proofAsset: { url: "/uploads/tenant_1/proof.jpg" },
              subscriptionId: "subscription_1"
            }
          ];
        }
      }
    };
    const repository = createPrismaAdminPaymentReviewRepository(prisma);

    await expect(repository.listPending()).resolves.toEqual([
      {
        id: "payment_1",
        customerName: "Ali Studio",
        method: "INSTAPAY",
        amount: "120,000 EGP",
        reference: "ref",
        proofUrl: "/uploads/tenant_1/proof.jpg",
        createdAt: "2026-07-06T12:00:00.000Z"
      }
    ]);
  });
});
