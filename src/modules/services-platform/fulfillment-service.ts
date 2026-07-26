import { randomUUID } from "node:crypto";

import type { AcquisitionLifecycleStatus } from "./acquisition-state-machine";

export type FulfillmentExecutionResult =
  | { status: "COMPLETED"; result?: unknown }
  | { status: "WAITING_CUSTOMER" | "WAITING_INTERNAL" | "READY"; checkpoint?: unknown };

export type FulfillmentContext = {
  acquisitionId: string;
  tenantId: string;
  offeringId: string;
  productId: string | null;
  runId: string;
  heartbeat(): Promise<void>;
};

export type WorkflowHandler = {
  key: string;
  execute(context: FulfillmentContext): Promise<FulfillmentExecutionResult>;
};

export function createWorkflowRegistry(handlers: readonly WorkflowHandler[]) {
  const registry = new Map<string, WorkflowHandler>();
  for (const handler of handlers) {
    if (registry.has(handler.key)) throw new Error(`Duplicate workflow handler: ${handler.key}`);
    registry.set(handler.key, handler);
  }
  return {
    get(key: string) {
      const handler = registry.get(key);
      if (!handler) throw new Error(`Workflow handler is not registered: ${key}`);
      return handler;
    },
  };
}

export type FulfillmentAcquisition = {
  id: string;
  tenantId: string;
  productId: string | null;
  offeringId: string;
  workflowKey: string;
  workflowVersion: number;
  status: AcquisitionLifecycleStatus;
  instanceKey: string | null;
  additionalActivations: Array<{ productId: string; instanceKey: string }>;
  billingInterval: "ONE_TIME" | "MONTHLY" | "YEARLY";
  capabilities: Array<{ capabilityKey: string; capabilityId: string | null; value: unknown; quantity?: number | null }>;
};

export interface FulfillmentRepository {
  getAcquisition(acquisitionId: string): Promise<FulfillmentAcquisition | null>;
  getRunAcquisitionId?(runId: string): Promise<{ acquisitionId: string; status: "PENDING" | "RUNNING" | "WAITING_CUSTOMER" | "WAITING_INTERNAL" | "READY" | "SUCCEEDED" | "FAILED" | "CANCELLED" } | null>;
  createRun(input: { acquisitionId: string; workflowKey: string; workflowVersion: number; idempotencyKey: string }): Promise<{ id: string; status: "PENDING" | "RUNNING" | "WAITING_CUSTOMER" | "WAITING_INTERNAL" | "READY" | "SUCCEEDED" | "FAILED" | "CANCELLED" }>;
  markRunning(runId: string, leaseOwner: string, allowedStatuses?: Array<"PENDING" | "FAILED" | "WAITING_CUSTOMER" | "WAITING_INTERNAL" | "READY">): Promise<boolean>;
  renewLease(runId: string, leaseOwner: string): Promise<boolean>;
  markSucceeded(runId: string, leaseOwner: string, result: unknown, finishedAt: Date): Promise<boolean>;
  markWaiting(runId: string, leaseOwner: string, status: "WAITING_CUSTOMER" | "WAITING_INTERNAL" | "READY", checkpoint: unknown): Promise<boolean>;
  markFailed(runId: string, leaseOwner: string | null, error: string, finishedAt: Date): Promise<boolean>;
  transitionAcquisition(acquisitionId: string, status: "FULFILLING" | "FULFILLED"): Promise<void>;
}

export function createFulfillmentService(input: {
  repository: FulfillmentRepository;
  workflows: ReturnType<typeof createWorkflowRegistry>;
  grantEntitlement(input: { tenantId: string; productId: string | null; offeringId: string; capabilityId: string | null; capabilityKey: string; value: unknown; quantity?: number | null; sourceType: "ACQUISITION"; sourceId: string }): Promise<unknown>;
  activateProduct(input: { tenantId: string; productId: string; acquisitionId: string; instanceKey: string; configuration: unknown; idempotencyKey: string }): Promise<{ id: string }>;
  createSubscription(input: { tenantId: string; offeringId: string; acquisitionId: string | null; billingInterval: "MONTHLY" | "YEARLY"; idempotencyKey: string }): Promise<{ id: string }>;
  now?: () => Date;
}) {
  const now = input.now ?? (() => new Date());

  async function finalize(acquisition: FulfillmentAcquisition, runId: string, leaseOwner: string, result: unknown) {
    const sideEffectKey = `fulfillment:${runId}`;
    const capabilityGrants = new Map<string, FulfillmentAcquisition["capabilities"][number]>();
    for (const capability of acquisition.capabilities) {
      const existing = capabilityGrants.get(capability.capabilityKey);
      capabilityGrants.set(capability.capabilityKey, existing
        ? { ...capability, quantity: (existing.quantity ?? 0) + (capability.quantity ?? 0) || null }
        : capability);
    }
    for (const capability of capabilityGrants.values()) {
      await input.grantEntitlement({
        tenantId: acquisition.tenantId,
        productId: acquisition.productId,
        offeringId: acquisition.offeringId,
        capabilityId: capability.capabilityId,
        capabilityKey: capability.capabilityKey,
        value: capability.value,
        quantity: capability.quantity,
        sourceType: "ACQUISITION",
        sourceId: acquisition.id,
      });
    }
    const productInstance = acquisition.productId && acquisition.instanceKey
      ? await input.activateProduct({
          tenantId: acquisition.tenantId,
          productId: acquisition.productId,
          acquisitionId: acquisition.id,
          instanceKey: acquisition.instanceKey,
          configuration: result,
          idempotencyKey: `${sideEffectKey}:activation`,
        })
      : null;
    const additionalInstances = [];
    for (const activation of acquisition.additionalActivations) {
      additionalInstances.push(await input.activateProduct({
        tenantId: acquisition.tenantId,
        productId: activation.productId,
        acquisitionId: acquisition.id,
        instanceKey: activation.instanceKey,
        configuration: result,
        idempotencyKey: `${sideEffectKey}:activation:${activation.productId}`,
      }));
    }
    const subscription = acquisition.billingInterval === "MONTHLY" || acquisition.billingInterval === "YEARLY"
      ? await input.createSubscription({
          tenantId: acquisition.tenantId,
          offeringId: acquisition.offeringId,
          acquisitionId: acquisition.id,
          billingInterval: acquisition.billingInterval,
          idempotencyKey: `${sideEffectKey}:subscription`,
        })
      : null;
    const completed = await input.repository.markSucceeded(runId, leaseOwner, result, now());
    if (!completed) throw new Error("Fulfillment lease was lost before completion.");
    await input.repository.transitionAcquisition(acquisition.id, "FULFILLED");
    return {
      status: "SUCCEEDED" as const,
      runId,
      productInstanceId: productInstance?.id ?? additionalInstances[0]?.id ?? null,
      productInstanceIds: [productInstance?.id, ...additionalInstances.map((item) => item.id)].filter((id): id is string => Boolean(id)),
      subscriptionId: subscription?.id ?? null,
    };
  }

  async function execute(acquisition: FulfillmentAcquisition, runId: string) {
    const leaseOwner = `fulfillment:${runId}:${randomUUID()}`;
    const claimed = await input.repository.markRunning(runId, leaseOwner);
    if (!claimed) return { status: "RUNNING" as const, runId };
    try {
      const result = await input.workflows.get(acquisition.workflowKey).execute({
        acquisitionId: acquisition.id,
        tenantId: acquisition.tenantId,
        offeringId: acquisition.offeringId,
        productId: acquisition.productId,
        runId,
        async heartbeat() {
          if (!await input.repository.renewLease(runId, leaseOwner)) throw new Error("Fulfillment lease was lost.");
        },
      });
      if (result.status !== "COMPLETED") {
        if (!await input.repository.markWaiting(runId, leaseOwner, result.status, result.checkpoint ?? null)) throw new Error("Fulfillment lease was lost before checkpointing.");
        return { status: result.status, runId };
      }
      return await finalize(acquisition, runId, leaseOwner, result.result ?? null);
    } catch (error) {
      await input.repository.markFailed(runId, leaseOwner, error instanceof Error ? error.message : "Unknown fulfillment error", now());
      throw error;
    }
  }

  return {
    async start(command: { acquisitionId: string; idempotencyKey: string }) {
      const acquisition = await input.repository.getAcquisition(command.acquisitionId);
      if (!acquisition) throw new Error(`Acquisition not found: ${command.acquisitionId}`);
      if (!(["PAID", "ACCEPTED"] as AcquisitionLifecycleStatus[]).includes(acquisition.status)) {
        throw new Error(`Acquisition is not fulfillable from status ${acquisition.status}`);
      }
      const run = await input.repository.createRun({
        acquisitionId: acquisition.id,
        workflowKey: acquisition.workflowKey,
        workflowVersion: acquisition.workflowVersion,
        idempotencyKey: command.idempotencyKey,
      });
      if (run.status === "SUCCEEDED") return { status: "SUCCEEDED" as const, runId: run.id };

      try {
        await input.repository.transitionAcquisition(acquisition.id, "FULFILLING");
      } catch (error) {
        await input.repository.markFailed(run.id, null, error instanceof Error ? error.message : "Acquisition transition failed", now());
        throw error;
      }
      return execute(acquisition, run.id);
    },
    async retry(command: { runId: string; idempotencyKey: string }) {
      if (!input.repository.getRunAcquisitionId) throw new Error("Fulfillment retry is not supported by this repository.");
      const run = await input.repository.getRunAcquisitionId(command.runId);
      if (!run) throw new Error(`Fulfillment run not found: ${command.runId}`);
      if (run.status !== "FAILED") throw new Error(`Only failed fulfillment runs can be retried, received ${run.status}.`);
      const acquisition = await input.repository.getAcquisition(run.acquisitionId);
      if (!acquisition || acquisition.status !== "FULFILLING") throw new Error("Fulfillment acquisition is not active.");
      return execute(acquisition, command.runId);
    },
    async completeManual(command: { runId: string; result: unknown; idempotencyKey: string }) {
      if (!input.repository.getRunAcquisitionId) throw new Error("Manual completion is not supported by this repository.");
      const run = await input.repository.getRunAcquisitionId(command.runId);
      if (!run) throw new Error(`Fulfillment run not found: ${command.runId}`);
      if (run.status === "SUCCEEDED") return { status: "SUCCEEDED" as const, runId: command.runId, productInstanceId: null };
      if (!["WAITING_CUSTOMER", "WAITING_INTERNAL", "READY"].includes(run.status)) {
        throw new Error(`Fulfillment run cannot be completed from ${run.status}`);
      }
      const acquisition = await input.repository.getAcquisition(run.acquisitionId);
      if (!acquisition || acquisition.status !== "FULFILLING") throw new Error("Fulfillment acquisition is not active.");
      const leaseOwner = `fulfillment:${command.runId}:${randomUUID()}`;
      const claimed = await input.repository.markRunning(command.runId, leaseOwner, ["WAITING_CUSTOMER", "WAITING_INTERNAL", "READY"]);
      if (!claimed) return { status: "RUNNING" as const, runId: command.runId, productInstanceId: null };
      try {
        return await finalize(acquisition, command.runId, leaseOwner, command.result);
      } catch (error) {
        await input.repository.markFailed(command.runId, leaseOwner, error instanceof Error ? error.message : "Unknown fulfillment error", now());
        throw error;
      }
    },
  };
}
