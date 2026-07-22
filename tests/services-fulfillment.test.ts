import { describe, expect, it } from "vitest";

import { createFulfillmentService, createWorkflowRegistry, type FulfillmentRepository } from "@/modules/services-platform/fulfillment-service";

describe("services fulfillment", () => {
  it("runs an automatic workflow idempotently through entitlements and activation", async () => {
    const events: string[] = [];
    const repository: FulfillmentRepository = {
      async getAcquisition() { return { id: "acq_1", tenantId: "tenant_1", productId: "product_1", offeringId: "offering_1", workflowKey: "payment_then_auto", workflowVersion: 1, status: "PAID", instanceKey: "pricing-primary", capabilities: [{ capabilityKey: "pricing_site.access", capabilityId: "cap_1", value: true }] }; },
      async createRun(input) { events.push(`run:${input.idempotencyKey}`); return { id: "run_1", status: "PENDING" }; },
      async markRunning() { events.push("running"); },
      async markSucceeded() { events.push("succeeded"); },
      async markWaiting() { throw new Error("unused"); },
      async markFailed() { throw new Error("unused"); },
      async transitionAcquisition(_id, status) { events.push(`acquisition:${status}`); },
    };
    const workflows = createWorkflowRegistry([{ key: "payment_then_auto", async execute() { events.push("workflow"); return { status: "COMPLETED", result: { ready: true } }; } }]);
    const service = createFulfillmentService({
      repository,
      workflows,
      async grantEntitlement(input) { events.push(`grant:${input.capabilityKey}`); },
      async activateProduct(input) { events.push(`activate:${input.instanceKey}`); return { id: "instance_1" }; },
    });

    await expect(service.start({ acquisitionId: "acq_1", idempotencyKey: "fulfill_1" })).resolves.toMatchObject({ status: "SUCCEEDED", productInstanceId: "instance_1" });
    expect(events).toEqual(["run:fulfill_1", "acquisition:FULFILLING", "running", "workflow", "grant:pricing_site.access", "activate:pricing-primary", "succeeded", "acquisition:FULFILLED"]);
  });

  it("keeps manual work in WAITING_CUSTOMER without granting or activating", async () => {
    const events: string[] = [];
    const repository: FulfillmentRepository = {
      async getAcquisition() { return { id: "acq", tenantId: "t", productId: null, offeringId: "o", workflowKey: "manual_service", workflowVersion: 1, status: "ACCEPTED", instanceKey: null, capabilities: [] }; },
      async createRun() { return { id: "run", status: "PENDING" }; },
      async markRunning() {}, async markSucceeded() { throw new Error("unused"); },
      async markWaiting(_id, status) { events.push(status); }, async markFailed() {},
      async transitionAcquisition(_id, status) { events.push(status); },
    };
    const workflows = createWorkflowRegistry([{ key: "manual_service", async execute() { return { status: "WAITING_CUSTOMER", checkpoint: { question: "assets" } }; } }]);
    const service = createFulfillmentService({ repository, workflows, async grantEntitlement() { throw new Error("unused"); }, async activateProduct() { throw new Error("unused"); } });

    await expect(service.start({ acquisitionId: "acq", idempotencyKey: "manual_1" })).resolves.toEqual({ status: "WAITING_CUSTOMER", runId: "run" });
    expect(events).toEqual(["FULFILLING", "WAITING_CUSTOMER"]);
  });
});
