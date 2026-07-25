import { AcquisitionStatus, PaymentStatus } from "@prisma/client";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { clientProductAnalyticsEventNames } from "@/modules/services-platform/prisma-analytics";
import { buildPrismaEligibilityContext } from "@/modules/services-platform/prisma-eligibility-context";
import { createPrismaServicesPaymentRepository } from "@/modules/services-platform/prisma-payment-repository";
import { createPrismaFulfillmentRepository } from "@/modules/services-platform/prisma-fulfillment-repository";
import { createPrismaAcquisitionRepository } from "@/modules/services-platform/prisma-acquisition-repository";
import { createPrismaServiceSubscriptionRepository } from "@/modules/services-platform/prisma-subscription-repository";
import { createPrismaUsageRepository } from "@/modules/services-platform/prisma-usage-repository";
import { resolveCommerceMarket } from "@/modules/services-platform/commerce-market";

describe("services platform hardening invariants", () => {
  it("does not accept authoritative lifecycle events from the client analytics endpoint", () => {
    expect(clientProductAnalyticsEventNames).not.toContain("payment.approved");
    expect(clientProductAnalyticsEventNames).not.toContain("acquisition.fulfilled");
    expect(clientProductAnalyticsEventNames).not.toContain("acquisition.requested");
  });

  it("never revives a cancelled acquisition while attaching a conversation", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      acquisition: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "acquisition", tenantId: "tenant", status: AcquisitionStatus.CANCELLED, conversationId: null }),
        updateMany: vi.fn(),
      },
      servicesOutboxEvent: { upsert: vi.fn() },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };
    const repository = createPrismaAcquisitionRepository(prisma as never);

    await expect(repository.attachConversation({ acquisitionId: "acquisition", conversationId: "conversation", requestedAt: new Date() })).rejects.toThrow(/CANCELLED/);
    expect(transaction.acquisition.updateMany).not.toHaveBeenCalled();
    expect(transaction.servicesOutboxEvent.upsert).not.toHaveBeenCalled();
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

  it("fences fulfillment completion by the current running lease owner", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const repository = createPrismaFulfillmentRepository({ fulfillmentRun: { updateMany } } as never);
    const finishedAt = new Date("2026-07-22T00:00:00.000Z");

    await expect(repository.markSucceeded("run", "lease-attempt-2", { ready: true }, finishedAt)).resolves.toBe(true);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "run", status: "RUNNING", leaseOwner: "lease-attempt-2", leaseExpiresAt: { gt: finishedAt } },
    }));
  });

  it("rejects a stale active-to-active subscription update after a newer period wins", async () => {
    const update = vi.fn();
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      servicesOutboxEvent: { findUnique: vi.fn().mockResolvedValue(null) },
      serviceSubscription: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "subscription", status: "ACTIVE", currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z") }),
        update,
      },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };
    const repository = createPrismaServiceSubscriptionRepository(prisma as never);

    await expect(repository.update({
      id: "subscription",
      expectedStatus: "ACTIVE",
      expectedPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-09-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z"),
      idempotencyKey: "renew-september",
    })).rejects.toThrow(/billing period changed concurrently/i);
    expect(transaction.$queryRaw).toHaveBeenCalledTimes(2);
    expect(update).not.toHaveBeenCalled();
  });

  it("cancels superseded active fulfillment rows before creating the unique index", () => {
    const migration = readFileSync("prisma/migrations/20260723011000_services_platform_hardening/migration.sql", "utf8");
    expect(migration).toMatch(/active_rank > 1/);
    expect(migration).toMatch(/"status" = 'CANCELLED'/);
    expect(migration).not.toMatch(/"status" = 'FAILED'[\s\S]*active_rank > 1/);
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
