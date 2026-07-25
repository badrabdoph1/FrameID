import { AcquisitionStatus, PaymentStatus } from "@prisma/client";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { clientProductAnalyticsEventNames } from "@/modules/services-platform/prisma-analytics";
import { buildPrismaEligibilityContext } from "@/modules/services-platform/prisma-eligibility-context";
import { createPrismaServicesPaymentRepository } from "@/modules/services-platform/prisma-payment-repository";
import { createPrismaFulfillmentRepository } from "@/modules/services-platform/prisma-fulfillment-repository";
import { createPrismaAcquisitionRepository } from "@/modules/services-platform/prisma-acquisition-repository";
import { getCustomerCatalogReadModel } from "@/modules/services-platform/prisma-catalog-repository";
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
      communicationConversation: { findUnique: vi.fn().mockResolvedValue({ tenantId: "tenant" }) },
      servicesOutboxEvent: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };
    const repository = createPrismaAcquisitionRepository(prisma as never);

    await expect(repository.attachConversation({ acquisitionId: "acquisition", conversationId: "conversation", requestedAt: new Date() })).rejects.toThrow(/CANCELLED/);
    expect(transaction.acquisition.updateMany).not.toHaveBeenCalled();
    expect(transaction.servicesOutboxEvent.upsert).not.toHaveBeenCalled();
  });

  it("refuses attaching a services acquisition to another tenant conversation", async () => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      acquisition: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "acquisition", tenantId: "tenant-a", status: AcquisitionStatus.DRAFT, conversationId: null }),
        updateMany: vi.fn(),
      },
      communicationConversation: { findUnique: vi.fn().mockResolvedValue({ tenantId: "tenant-b" }) },
      servicesOutboxEvent: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };

    await expect(createPrismaAcquisitionRepository(prisma as never).attachConversation({
      acquisitionId: "acquisition",
      conversationId: "foreign-conversation",
      requestedAt: new Date(),
    })).rejects.toThrow(/same tenant/i);
    expect(transaction.acquisition.updateMany).not.toHaveBeenCalled();
  });

  it("rejects acquisition idempotency replay for a different offering before catalog lookup", async () => {
    const prisma = {
      acquisition: {
        findUnique: vi.fn().mockResolvedValue({
          id: "existing",
          tenantId: "tenant",
          offeringId: "offering-a",
          status: AcquisitionStatus.DRAFT,
          correlationId: "correlation",
          conversationId: null,
          metadata: { requestedByUserId: "user" },
          offering: { name: "A" },
        }),
      },
      catalogOffering: { findUnique: vi.fn() },
    };

    await expect(createPrismaAcquisitionRepository(prisma as never).createFromCatalog({
      tenantId: "tenant",
      userId: "user",
      offeringId: "offering-b",
      idempotencyKey: "same-key",
    })).rejects.toThrow(/request identity/i);
    expect(prisma.catalogOffering.findUnique).not.toHaveBeenCalled();
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
      servicesOutboxEvent: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
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
    expect(transaction.$queryRaw).toHaveBeenCalledTimes(3);
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
      servicesOutboxEvent: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
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

  it.each([
    { operation: "reject" as const, status: PaymentStatus.REJECTED, eventName: "services.payment.rejected", idempotencyKey: "reject-once" },
    { operation: "refund" as const, status: PaymentStatus.REFUNDED, eventName: "services.payment.refunded", idempotencyKey: "refund-once" },
  ])("replays a completed $operation payment command only with its original idempotency key", async ({ operation, status, eventName, idempotencyKey }) => {
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      paymentRequest: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "payment", acquisitionId: "acquisition", tenantId: "tenant", status }) },
      servicesOutboxEvent: {
        findUnique: vi.fn().mockResolvedValue({ eventName, aggregateId: "acquisition", payload: { paymentRequestId: "payment" } }),
      },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };
    const repository = createPrismaServicesPaymentRepository(prisma as never);
    const command = { paymentRequestId: "payment", reviewerId: "admin", reason: "reason", idempotencyKey, rejectedAt: new Date(), refundedAt: new Date() };

    await expect(operation === "reject" ? repository.reject(command) : repository.refund(command)).resolves.toEqual({ acquisitionId: "acquisition", tenantId: "tenant" });
    expect(transaction.servicesOutboxEvent.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { deduplicationKey: idempotencyKey } }));
  });

  it("rejects a payment idempotency collision before mutating payment state", async () => {
    const update = vi.fn();
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      paymentRequest: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "payment", acquisitionId: "acquisition", tenantId: "tenant", status: PaymentStatus.SUBMITTED }) , update },
      servicesOutboxEvent: { findUnique: vi.fn().mockResolvedValue({ eventName: "services.payment.refunded", aggregateId: "other-acquisition", payload: { paymentRequestId: "other-payment" } }) },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };

    await expect(createPrismaServicesPaymentRepository(prisma as never).reject({
      paymentRequestId: "payment",
      reviewerId: "admin",
      reason: "invalid",
      idempotencyKey: "already-used",
      rejectedAt: new Date(),
    })).rejects.toThrow(/idempotency key/i);
    expect(update).not.toHaveBeenCalled();
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

  it("builds fulfillment exclusively from the immutable acquisition line snapshot", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "acquisition",
      tenantId: "tenant",
      offeringId: "offering",
      status: AcquisitionStatus.PAID,
      metadata: {},
      lines: [{
        offeringId: "offering",
        billingInterval: "YEARLY",
        snapshot: {
          schemaVersion: 2,
          productId: "product",
          productCode: "pricing-site",
          workflow: { key: "payment_then_auto", version: 4 },
          capabilities: [{ capabilityId: "capability", capabilityKey: "pricing_site.access", value: true }],
          bundleComponents: [],
        },
      }],
    });
    const repository = createPrismaFulfillmentRepository({ acquisition: { findUnique } } as never);

    await expect(repository.getAcquisition("acquisition")).resolves.toMatchObject({
      productId: "product",
      workflowKey: "payment_then_auto",
      workflowVersion: 4,
      capabilities: [{ capabilityKey: "pricing_site.access", capabilityId: "capability", value: true }],
    });
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({
      include: { lines: expect.any(Object) },
    }));
    expect(findUnique.mock.calls[0][0].include).not.toHaveProperty("offering");
  });

  it("emits a transactional lifecycle event when fulfillment waits for the customer", async () => {
    const transaction = {
      fulfillmentRun: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ attempts: 2, acquisition: { id: "acquisition", tenantId: "tenant", correlationId: "correlation" } }),
      },
      servicesOutboxEvent: { upsert: vi.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => callback(transaction) };

    await expect(createPrismaFulfillmentRepository(prisma as never).markWaiting("run", "lease", "WAITING_CUSTOMER", { field: "logo" })).resolves.toBe(true);
    expect(transaction.servicesOutboxEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ eventName: "services.acquisition.waiting_customer", aggregateId: "acquisition" }),
    }));
  });

  it("serves the last published catalog revision instead of edited live draft rows", async () => {
    const snapshot = {
      id: "product",
      code: "pricing-site",
      registryKey: "pricing-site",
      name: "Published name",
      shortDescription: "Published description",
      description: null,
      category: "websites",
      tags: [],
      media: [],
      publicationStatus: "PUBLISHED",
      releaseStage: "GA",
      accessTier: "STANDARD",
      eligibilityPolicy: null,
      sortOrder: 1,
      isFeatured: true,
      schemaVersion: 2,
      offerings: [],
    };
    const findMany = vi.fn().mockResolvedValue([{ id: "product", name: "Unpublished edit", revisions: [{ snapshot }] }]);

    const catalog = await getCustomerCatalogReadModel({ productDefinition: { findMany } } as never, {
      context: { tenantId: "tenant" },
      marketCode: "EG",
      currency: "EGP",
      now: new Date("2026-07-22T00:00:00.000Z"),
    });

    expect(catalog.products[0].name).toBe("Published name");
    expect(findMany.mock.calls[0][0]).toHaveProperty("select.revisions");
    expect(findMany.mock.calls[0][0]).not.toHaveProperty("include.offerings");
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
