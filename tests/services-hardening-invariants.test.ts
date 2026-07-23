import { AcquisitionStatus, PaymentStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { clientProductAnalyticsEventNames } from "@/modules/services-platform/prisma-analytics";
import { buildPrismaEligibilityContext } from "@/modules/services-platform/prisma-eligibility-context";
import { createPrismaServicesPaymentRepository } from "@/modules/services-platform/prisma-payment-repository";
import { createPrismaUsageRepository } from "@/modules/services-platform/prisma-usage-repository";
import { resolveCommerceMarket } from "@/modules/services-platform/commerce-market";

describe("services platform hardening invariants", () => {
  it("does not accept authoritative lifecycle events from the client analytics endpoint", () => {
    expect(clientProductAnalyticsEventNames).not.toContain("payment.approved");
    expect(clientProductAnalyticsEventNames).not.toContain("acquisition.fulfilled");
    expect(clientProductAnalyticsEventNames).not.toContain("acquisition.requested");
  });

  it("creates the first payment draft after revalidating the locked acquisition", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      acquisition: { findUniqueOrThrow: vi.fn().mockResolvedValue({ tenantId: "tenant", status: AcquisitionStatus.AWAITING_PAYMENT, acceptedTotal: 49000, acceptedCurrency: "EGP" }) },
      paymentRequest: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "payment" }),
      },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };
    const repository = createPrismaServicesPaymentRepository(prisma as never);

    await expect(repository.createDraft({ acquisitionId: "acquisition", tenantId: "tenant", method: "INSTAPAY", amount: 49000, currency: "EGP" })).resolves.toEqual({ id: "payment", status: "DRAFT" });
    expect(transaction.paymentRequest.create).toHaveBeenCalledOnce();
  });

  it("refuses payment approval when the acquisition is no longer awaiting payment", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      paymentRequest: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "payment",
          acquisitionId: "acquisition",
          tenantId: "tenant",
          status: PaymentStatus.SUBMITTED,
          amount: 49000,
          currency: "EGP",
        }),
        update: vi.fn(),
      },
      acquisition: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "acquisition",
          status: AcquisitionStatus.CANCELLED,
          acceptedTotal: 49000,
          acceptedCurrency: "EGP",
          correlationId: "correlation",
        }),
        update: vi.fn(),
      },
      paymentRequestLog: { create: vi.fn() },
      servicesOutboxEvent: { upsert: vi.fn() },
    };
    const prisma = {
      $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction),
    };

    const repository = createPrismaServicesPaymentRepository(prisma as never);
    await expect(repository.approve({
      paymentRequestId: "payment",
      reviewerId: "admin",
      idempotencyKey: "approve",
      approvedAt: new Date("2026-07-22T00:00:00.000Z"),
    })).rejects.toThrow(/cannot be paid/i);
    expect(transaction.paymentRequest.update).not.toHaveBeenCalled();
    expect(transaction.acquisition.update).not.toHaveBeenCalled();
    expect(transaction.servicesOutboxEvent.upsert).not.toHaveBeenCalled();
    expect(transaction.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it("defers refunds while fulfillment is running so compensation cannot race activation", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      paymentRequest: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "payment", acquisitionId: "acquisition", tenantId: "tenant", status: PaymentStatus.APPROVED }),
        update: vi.fn(),
      },
      acquisition: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ status: AcquisitionStatus.FULFILLING }),
        update: vi.fn(),
      },
      paymentRequestLog: { create: vi.fn() },
      servicesOutboxEvent: { upsert: vi.fn() },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };
    const repository = createPrismaServicesPaymentRepository(prisma as never);

    await expect(repository.refund({
      paymentRequestId: "payment",
      reviewerId: "admin",
      reason: "requested",
      idempotencyKey: "refund",
      refundedAt: new Date("2026-07-22T00:00:00.000Z"),
    })).rejects.toThrow(/cannot be refunded safely/i);
    expect(transaction.paymentRequest.update).not.toHaveBeenCalled();
    expect(transaction.acquisition.update).not.toHaveBeenCalled();
  });

  it("uses one market and currency selector for catalog and acquisition", () => {
    expect(resolveCommerceMarket({ country: "sa" })).toEqual({ marketCode: "SA", currency: "SAR" });
    expect(resolveCommerceMarket({ country: "AE" })).toEqual({ marketCode: "AE", currency: "AED" });
    expect(resolveCommerceMarket({ country: "XX" })).toEqual({ marketCode: "XX", currency: "USD" });
  });

  it("builds one authoritative targeting context from tenant state and entitlements", async () => {
    const prisma = {
      tenant: { findFirst: vi.fn().mockResolvedValue({ createdAt: new Date("2026-07-01T00:00:00.000Z"), status: "ACTIVE" }) },
      site: { count: vi.fn().mockResolvedValue(2) },
      productInstance: { findMany: vi.fn().mockResolvedValue([{ product: { code: "pricing-site" } }]) },
      subscription: { findMany: vi.fn().mockResolvedValue([{ plan: { code: "PRO" } }]) },
      entitlement: { findMany: vi.fn().mockResolvedValue([{ capabilityKey: "platform.access_tier", value: ["PREMIUM"] }]) },
      contactProfile: { findFirst: vi.fn().mockResolvedValue({ country: "sa" }) },
    };

    await expect(buildPrismaEligibilityContext(prisma as never, "tenant", new Date("2026-07-22T00:00:00.000Z"))).resolves.toMatchObject({
      tenantId: "tenant",
      planCodes: ["PRO"],
      country: "SA",
      siteCount: 2,
      activeProductCodes: ["pricing-site"],
      accessTiers: ["STANDARD", "PREMIUM"],
      customerAgeDays: 21,
      attributes: { tenantStatus: "ACTIVE" },
    });
  });

  it("resets metered usage aggregation when a subscription enters a new period", async () => {
    const create = vi.fn().mockResolvedValue({});
    const transaction = {
      usageLedger: {
        findUnique: vi.fn().mockResolvedValue(null),
        aggregate: vi.fn().mockResolvedValue({ _sum: { delta: 3 } }),
        create,
      },
      entitlement: { findMany: vi.fn().mockResolvedValue([{ id: "entitlement", sourceType: "ACQUISITION", sourceId: "acquisition", value: 10, quantity: 10, capability: { aggregationPolicy: "REPLACE" } }]) },
      serviceSubscription: { findFirst: vi.fn().mockResolvedValue({ id: "subscription", currentPeriodStart: new Date("2026-08-01T00:00:00.000Z") }) },
      trialGrant: { findFirst: vi.fn() },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };
    const repository = createPrismaUsageRepository(prisma as never);

    await expect(repository.consume({ tenantId: "tenant", capabilityKey: "ai.credits", amount: 2, idempotencyKey: "request" })).resolves.toEqual({ consumed: 5, limit: 10, duplicate: false });
    expect(transaction.usageLedger.aggregate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ periodKey: "subscription:subscription:2026-08-01T00:00:00.000Z" }),
    }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ periodKey: "subscription:subscription:2026-08-01T00:00:00.000Z" }) }));
  });
});
