import { describe, expect, it, vi } from "vitest";

import { createProductInstanceService, type ProductInstanceRepository } from "@/modules/services-platform/product-instance-service";
import { createProductRegistry } from "@/modules/services-platform/product-registry";

describe("product instance activation", () => {
  it("provisions through the registered product adapter and activates idempotently", async () => {
    const provision = vi.fn(async () => ({ externalRef: "site_42", configuration: { ready: true } }));
    const registry = createProductRegistry([{
      key: "pricing-site",
      productCode: "pricing-site",
      displayName: "Pricing",
      supportedCapabilities: ["pricing_site.access"],
      provision,
    }]);
    const events: string[] = [];
    const repository: ProductInstanceRepository = {
      async getProduct() { return { id: "product_1", registryKey: "pricing-site" }; },
      async createProvisioning(input) { events.push(`create:${input.tenantId}:${input.instanceKey}`); return { id: "instance_1", status: "PROVISIONING", externalRef: null }; },
      async activate(input) { events.push(`activate:${input.instanceId}:${input.externalRef}`); return { id: input.instanceId, status: "ACTIVE", externalRef: input.externalRef }; },
      async getByTenantAndKey() { return null; },
    };
    const service = createProductInstanceService(repository, registry);

    const result = await service.activate({ tenantId: "tenant_1", productId: "product_1", acquisitionId: "acq_1", instanceKey: "primary", configuration: null, idempotencyKey: "activation_1" });

    expect(result).toMatchObject({ id: "instance_1", status: "ACTIVE", externalRef: "site_42" });
    expect(events).toEqual(["create:tenant_1:primary", "activate:instance_1:site_42"]);
    expect(provision).toHaveBeenCalledOnce();
  });

  it("returns an existing active instance without provisioning again", async () => {
    const provision = vi.fn(async () => ({}));
    const registry = createProductRegistry([{ key: "x", productCode: "x", displayName: "X", supportedCapabilities: [], provision }]);
    const repository: ProductInstanceRepository = {
      async getProduct() { return { id: "x", registryKey: "x" }; },
      async getByTenantAndKey() { return { id: "existing", status: "ACTIVE", externalRef: "ref" }; },
      async createProvisioning() { throw new Error("must not create"); },
      async activate() { throw new Error("must not activate"); },
    };
    const service = createProductInstanceService(repository, registry);

    await expect(service.activate({ tenantId: "t", productId: "x", acquisitionId: null, instanceKey: "primary", configuration: null, idempotencyKey: "same" })).resolves.toMatchObject({ id: "existing" });
    expect(provision).not.toHaveBeenCalled();
  });
});
