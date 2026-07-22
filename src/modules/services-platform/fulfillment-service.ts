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
  capabilities: Array<{ capabilityKey: string; capabilityId: string | null; value: unknown; quantity?: number | null }>;
};

export interface FulfillmentRepository {
  getAcquisition(acquisitionId: string): Promise<FulfillmentAcquisition | null>;
  createRun(input: { acquisitionId: string; workflowKey: string; workflowVersion: number; idempotencyKey: string }): Promise<{ id: string; status: "PENDING" | "RUNNING" | "WAITING_CUSTOMER" | "WAITING_INTERNAL" | "READY" | "SUCCEEDED" | "FAILED" | "CANCELLED" }>;
  markRunning(runId: string): Promise<void>;
  markSucceeded(runId: string, result: unknown, finishedAt: Date): Promise<void>;
  markWaiting(runId: string, status: "WAITING_CUSTOMER" | "WAITING_INTERNAL" | "READY", checkpoint: unknown): Promise<void>;
  markFailed(runId: string, error: string, finishedAt: Date): Promise<void>;
  transitionAcquisition(acquisitionId: string, status: "FULFILLING" | "FULFILLED"): Promise<void>;
}

export function createFulfillmentService(input: {
  repository: FulfillmentRepository;
  workflows: ReturnType<typeof createWorkflowRegistry>;
  grantEntitlement(input: { tenantId: string; productId: string | null; offeringId: string; capabilityId: string | null; capabilityKey: string; value: unknown; quantity?: number | null; sourceType: "ACQUISITION"; sourceId: string }): Promise<unknown>;
  activateProduct(input: { tenantId: string; productId: string; acquisitionId: string; instanceKey: string; configuration: unknown; idempotencyKey: string }): Promise<{ id: string }>;
  now?: () => Date;
}) {
  const now = input.now ?? (() => new Date());
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

      await input.repository.transitionAcquisition(acquisition.id, "FULFILLING");
      await input.repository.markRunning(run.id);
      try {
        const result = await input.workflows.get(acquisition.workflowKey).execute({
          acquisitionId: acquisition.id,
          tenantId: acquisition.tenantId,
          offeringId: acquisition.offeringId,
          productId: acquisition.productId,
          runId: run.id,
        });
        if (result.status !== "COMPLETED") {
          await input.repository.markWaiting(run.id, result.status, result.checkpoint ?? null);
          return { status: result.status, runId: run.id };
        }

        for (const capability of acquisition.capabilities) {
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
              configuration: result.result ?? null,
              idempotencyKey: `${command.idempotencyKey}:activation`,
            })
          : null;
        await input.repository.markSucceeded(run.id, result.result ?? null, now());
        await input.repository.transitionAcquisition(acquisition.id, "FULFILLED");
        return { status: "SUCCEEDED" as const, runId: run.id, productInstanceId: productInstance?.id ?? null };
      } catch (error) {
        await input.repository.markFailed(run.id, error instanceof Error ? error.message : "Unknown fulfillment error", now());
        throw error;
      }
    },
  };
}
