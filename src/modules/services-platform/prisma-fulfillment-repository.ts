import { AcquisitionStatus, FulfillmentStatus, Prisma, type PrismaClient } from "@prisma/client";

import type { FulfillmentRepository } from "./fulfillment-service";

export function createPrismaFulfillmentRepository(prisma: PrismaClient): FulfillmentRepository {
  return {
    getRunAcquisitionId(runId) {
      return prisma.fulfillmentRun.findUnique({ where: { id: runId }, select: { acquisitionId: true, status: true } });
    },
    async getAcquisition(acquisitionId) {
      const acquisition = await prisma.acquisition.findUnique({
        where: { id: acquisitionId },
        include: {
          lines: { orderBy: { createdAt: "asc" }, take: 1, select: { billingInterval: true } },
          offering: {
            include: {
              product: { select: { id: true, code: true } },
              workflowTemplate: { select: { key: true, version: true } },
              capabilities: { include: { capability: { select: { id: true, key: true } } } },
              bundleComponents: {
                orderBy: { sortOrder: "asc" },
                include: {
                  componentOffering: {
                    include: {
                      product: { select: { id: true, code: true } },
                      capabilities: { include: { capability: { select: { id: true, key: true } } } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!acquisition) return null;
      const metadata = acquisition.metadata && typeof acquisition.metadata === "object" && !Array.isArray(acquisition.metadata)
        ? acquisition.metadata as Record<string, Prisma.JsonValue>
        : {};
      const workflow = acquisition.offering.workflowTemplate;
      if (!workflow) throw new Error(`Offering has no workflow template: ${acquisition.offering.code}`);
      return {
        id: acquisition.id,
        tenantId: acquisition.tenantId,
        productId: acquisition.offering.product?.id ?? null,
        offeringId: acquisition.offering.id,
        workflowKey: workflow.key,
        workflowVersion: workflow.version,
        status: acquisition.status,
        instanceKey: acquisition.offering.product
          ? typeof metadata.instanceKey === "string" ? metadata.instanceKey : `${acquisition.offering.product.code}:${acquisition.id}`
          : null,
        additionalActivations: acquisition.offering.bundleComponents.flatMap((component) => {
          const product = component.componentOffering.product;
          return product ? [{ productId: product.id, instanceKey: `${product.code}:${acquisition.id}:${component.componentOffering.id}` }] : [];
        }),
        billingInterval: acquisition.lines[0]?.billingInterval ?? "ONE_TIME",
        capabilities: [
          ...acquisition.offering.capabilities.map((item) => ({ capabilityKey: item.capability.key, capabilityId: item.capability.id, value: item.value })),
          ...acquisition.offering.bundleComponents.flatMap((component) => component.componentOffering.capabilities.map((item) => ({
            capabilityKey: item.capability.key,
            capabilityId: item.capability.id,
            value: item.value,
            quantity: component.quantity,
          }))),
        ],
      };
    },
    createRun(input) {
      return prisma.fulfillmentRun.upsert({
        where: { idempotencyKey: input.idempotencyKey },
        update: {},
        create: {
          acquisitionId: input.acquisitionId,
          workflowKey: input.workflowKey,
          workflowVersion: input.workflowVersion,
          idempotencyKey: input.idempotencyKey,
        },
        select: { id: true, status: true },
      });
    },
    async markRunning(runId, leaseOwner, allowedStatuses = ["PENDING", "FAILED"]) {
      const now = new Date();
      const updated = await prisma.fulfillmentRun.updateMany({
        where: { id: runId, status: { in: allowedStatuses as FulfillmentStatus[] } },
        data: { status: FulfillmentStatus.RUNNING, startedAt: now, attempts: { increment: 1 }, leaseOwner, leaseExpiresAt: new Date(now.getTime() + 15 * 60_000), finishedAt: null, lastError: null },
      });
      return updated.count === 1;
    },
    async renewLease(runId, leaseOwner) {
      const now = new Date();
      const updated = await prisma.fulfillmentRun.updateMany({
        where: { id: runId, status: FulfillmentStatus.RUNNING, leaseOwner, leaseExpiresAt: { gt: now } },
        data: { leaseExpiresAt: new Date(now.getTime() + 15 * 60_000) },
      });
      return updated.count === 1;
    },
    async markSucceeded(runId, leaseOwner, result, finishedAt) {
      const updated = await prisma.fulfillmentRun.updateMany({
        where: { id: runId, status: FulfillmentStatus.RUNNING, leaseOwner, leaseExpiresAt: { gt: finishedAt } },
        data: {
          status: FulfillmentStatus.SUCCEEDED,
          result: result === null ? Prisma.JsonNull : result as Prisma.InputJsonValue,
          readyAt: finishedAt,
          finishedAt,
          leaseOwner: null,
          leaseExpiresAt: null,
          lastError: null,
        },
      });
      return updated.count === 1;
    },
    async markWaiting(runId, leaseOwner, status, checkpoint) {
      const now = new Date();
      const updated = await prisma.fulfillmentRun.updateMany({
        where: { id: runId, status: FulfillmentStatus.RUNNING, leaseOwner, leaseExpiresAt: { gt: now } },
        data: {
          status: status as FulfillmentStatus,
          checkpoint: checkpoint === null ? Prisma.JsonNull : checkpoint as Prisma.InputJsonValue,
          leaseOwner: null,
          leaseExpiresAt: null,
        },
      });
      return updated.count === 1;
    },
    async markFailed(runId, leaseOwner, error, finishedAt) {
      const updated = await prisma.fulfillmentRun.updateMany({
        where: leaseOwner
          ? { id: runId, status: FulfillmentStatus.RUNNING, leaseOwner, leaseExpiresAt: { gt: finishedAt } }
          : { id: runId, status: FulfillmentStatus.PENDING },
        data: { status: FulfillmentStatus.FAILED, lastError: error, finishedAt, leaseOwner: null, leaseExpiresAt: null },
      });
      return updated.count === 1;
    },
    async transitionAcquisition(acquisitionId, status) {
      await prisma.$transaction(async (tx) => {
        const expectedStatuses = status === "FULFILLING"
          ? [AcquisitionStatus.PAID, AcquisitionStatus.ACCEPTED]
          : [AcquisitionStatus.FULFILLING];
        const updated = await tx.acquisition.updateMany({
          where: { id: acquisitionId, status: { in: expectedStatuses } },
          data: { status: status as AcquisitionStatus, ...(status === "FULFILLED" ? { fulfilledAt: new Date() } : {}) },
        });
        const acquisition = await tx.acquisition.findUniqueOrThrow({ where: { id: acquisitionId }, select: { correlationId: true, tenantId: true, status: true } });
        if (updated.count !== 1 && acquisition.status !== status) throw new Error(`Acquisition cannot transition to ${status} from ${acquisition.status}.`);
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: `fulfillment:${acquisitionId}:acquisition:${status}` },
          update: {},
          create: { aggregateType: "Acquisition", aggregateId: acquisitionId, eventName: `services.acquisition.${status.toLowerCase()}`, payload: { acquisitionId, tenantId: acquisition.tenantId, status }, deduplicationKey: `fulfillment:${acquisitionId}:acquisition:${status}`, correlationId: acquisition.correlationId },
        });
      });
    },
  };
}
