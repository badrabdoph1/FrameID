import { AcquisitionStatus, FulfillmentStatus, Prisma, type PrismaClient } from "@prisma/client";

import type { FulfillmentRepository } from "./fulfillment-service";

function objectValue(value: Prisma.JsonValue | null | undefined): Record<string, Prisma.JsonValue> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : null;
}

function snapshotCapabilities(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const item = objectValue(entry);
    if (!item || typeof item.capabilityKey !== "string") return [];
    return [{
      capabilityKey: item.capabilityKey,
      capabilityId: typeof item.capabilityId === "string" ? item.capabilityId : null,
      value: item.value ?? null,
    }];
  });
}

export function createPrismaFulfillmentRepository(prisma: PrismaClient): FulfillmentRepository {
  return {
    getRunAcquisitionId(runId) {
      return prisma.fulfillmentRun.findUnique({ where: { id: runId }, select: { acquisitionId: true, status: true } });
    },
    async getAcquisition(acquisitionId) {
      const acquisition = await prisma.acquisition.findUnique({
        where: { id: acquisitionId },
        include: {
          lines: { orderBy: { createdAt: "asc" }, select: { offeringId: true, billingInterval: true, snapshot: true } },
        },
      });
      if (!acquisition) return null;
      const metadata = acquisition.metadata && typeof acquisition.metadata === "object" && !Array.isArray(acquisition.metadata)
        ? acquisition.metadata as Record<string, Prisma.JsonValue>
        : {};
      const primaryLine = acquisition.lines.find((line) => line.offeringId === acquisition.offeringId) ?? acquisition.lines[0];
      const snapshot = objectValue(primaryLine?.snapshot);
      if (!primaryLine || snapshot?.schemaVersion !== 2) {
        throw new Error(`Acquisition ${acquisition.id} has no immutable fulfillment snapshot.`);
      }
      const workflow = objectValue(snapshot.workflow);
      if (!workflow || typeof workflow.key !== "string" || typeof workflow.version !== "number") {
        throw new Error(`Acquisition ${acquisition.id} has an invalid workflow snapshot.`);
      }
      const productId = typeof snapshot.productId === "string" ? snapshot.productId : null;
      const productCode = typeof snapshot.productCode === "string" ? snapshot.productCode : null;
      const bundles = Array.isArray(snapshot.bundleComponents) ? snapshot.bundleComponents : [];
      return {
        id: acquisition.id,
        tenantId: acquisition.tenantId,
        productId,
        offeringId: acquisition.offeringId,
        workflowKey: workflow.key,
        workflowVersion: workflow.version,
        status: acquisition.status,
        instanceKey: productId && productCode
          ? typeof metadata.instanceKey === "string" ? metadata.instanceKey : `${productCode}:${acquisition.id}`
          : null,
        additionalActivations: bundles.flatMap((entry) => {
          const component = objectValue(entry);
          const componentProductId = component && typeof component.productId === "string" ? component.productId : null;
          const componentProductCode = component && typeof component.productCode === "string" ? component.productCode : null;
          const componentOfferingId = component && typeof component.offeringId === "string" ? component.offeringId : null;
          return componentProductId && componentProductCode && componentOfferingId
            ? [{ productId: componentProductId, instanceKey: `${componentProductCode}:${acquisition.id}:${componentOfferingId}` }]
            : [];
        }),
        billingInterval: primaryLine.billingInterval,
        capabilities: [
          ...snapshotCapabilities(snapshot.capabilities),
          ...bundles.flatMap((entry) => {
            const component = objectValue(entry);
            const quantity = component && typeof component.quantity === "number" ? component.quantity : 1;
            return snapshotCapabilities(component?.capabilities).map((capability) => ({ ...capability, quantity }));
          }),
        ],
      };
    },
    async createRun(input) {
      const run = await prisma.fulfillmentRun.upsert({
        where: { idempotencyKey: input.idempotencyKey },
        update: {},
        create: {
          acquisitionId: input.acquisitionId,
          workflowKey: input.workflowKey,
          workflowVersion: input.workflowVersion,
          idempotencyKey: input.idempotencyKey,
        },
        select: { id: true, status: true, acquisitionId: true, workflowKey: true, workflowVersion: true },
      });
      if (run.acquisitionId !== input.acquisitionId || run.workflowKey !== input.workflowKey || run.workflowVersion !== input.workflowVersion) {
        throw new Error("Fulfillment idempotency key is already bound to another acquisition or workflow.");
      }
      return { id: run.id, status: run.status };
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
      return prisma.$transaction(async (tx) => {
        const updated = await tx.fulfillmentRun.updateMany({
          where: { id: runId, status: FulfillmentStatus.RUNNING, leaseOwner, leaseExpiresAt: { gt: now } },
          data: {
            status: status as FulfillmentStatus,
            checkpoint: checkpoint === null ? Prisma.JsonNull : checkpoint as Prisma.InputJsonValue,
            leaseOwner: null,
            leaseExpiresAt: null,
          },
        });
        if (updated.count !== 1) return false;
        const run = await tx.fulfillmentRun.findUniqueOrThrow({
          where: { id: runId },
          select: { attempts: true, acquisition: { select: { id: true, tenantId: true, correlationId: true } } },
        });
        const eventSuffix = status.toLowerCase();
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: `fulfillment:${runId}:${eventSuffix}:attempt:${run.attempts}` },
          update: {},
          create: {
            aggregateType: "Acquisition",
            aggregateId: run.acquisition.id,
            eventName: `services.acquisition.${eventSuffix}`,
            payload: { acquisitionId: run.acquisition.id, tenantId: run.acquisition.tenantId, runId, status },
            deduplicationKey: `fulfillment:${runId}:${eventSuffix}:attempt:${run.attempts}`,
            correlationId: run.acquisition.correlationId,
          },
        });
        return true;
      });
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
