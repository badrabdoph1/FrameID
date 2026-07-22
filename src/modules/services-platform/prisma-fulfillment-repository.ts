import { AcquisitionStatus, FulfillmentStatus, Prisma, type PrismaClient } from "@prisma/client";

import type { FulfillmentRepository } from "./fulfillment-service";

export function createPrismaFulfillmentRepository(prisma: PrismaClient): FulfillmentRepository {
  return {
    async getAcquisition(acquisitionId) {
      const acquisition = await prisma.acquisition.findUnique({
        where: { id: acquisitionId },
        include: {
          offering: {
            include: {
              product: { select: { id: true, code: true } },
              workflowTemplate: { select: { key: true, version: true } },
              capabilities: { include: { capability: { select: { id: true, key: true } } } },
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
        capabilities: acquisition.offering.capabilities.map((item) => ({
          capabilityKey: item.capability.key,
          capabilityId: item.capability.id,
          value: item.value,
        })),
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
    async markRunning(runId) {
      await prisma.fulfillmentRun.update({
        where: { id: runId },
        data: { status: FulfillmentStatus.RUNNING, startedAt: new Date(), attempts: { increment: 1 } },
      });
    },
    async markSucceeded(runId, result, finishedAt) {
      await prisma.fulfillmentRun.update({
        where: { id: runId },
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
    },
    async markWaiting(runId, status, checkpoint) {
      await prisma.fulfillmentRun.update({
        where: { id: runId },
        data: {
          status: status as FulfillmentStatus,
          checkpoint: checkpoint === null ? Prisma.JsonNull : checkpoint as Prisma.InputJsonValue,
        },
      });
    },
    async markFailed(runId, error, finishedAt) {
      await prisma.fulfillmentRun.update({
        where: { id: runId },
        data: { status: FulfillmentStatus.FAILED, lastError: error, finishedAt, leaseOwner: null, leaseExpiresAt: null },
      });
    },
    async transitionAcquisition(acquisitionId, status) {
      await prisma.acquisition.update({
        where: { id: acquisitionId },
        data: { status: status as AcquisitionStatus, ...(status === "FULFILLED" ? { fulfilledAt: new Date() } : {}) },
      });
    },
  };
}
