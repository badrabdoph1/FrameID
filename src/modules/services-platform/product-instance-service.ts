import type { ProductRegistry } from "./product-registry";

export type ProductInstanceRecord = {
  id: string;
  status: "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "DEPROVISIONED";
  externalRef: string | null;
};

export interface ProductInstanceRepository {
  getProduct(productId: string): Promise<{ id: string; registryKey: string } | null>;
  getByTenantAndKey(tenantId: string, instanceKey: string): Promise<ProductInstanceRecord | null>;
  createProvisioning(input: {
    tenantId: string;
    productId: string;
    acquisitionId: string | null;
    instanceKey: string;
    configuration: unknown;
  }): Promise<ProductInstanceRecord>;
  activate(input: {
    instanceId: string;
    externalRef: string | null;
    configuration: unknown;
    activatedAt: Date;
  }): Promise<ProductInstanceRecord>;
}

export function createProductInstanceService(
  repository: ProductInstanceRepository,
  registry: ProductRegistry,
  now: () => Date = () => new Date(),
) {
  return {
    async activate(input: {
      tenantId: string;
      productId: string;
      acquisitionId: string | null;
      instanceKey: string;
      configuration: unknown;
      idempotencyKey: string;
    }) {
      const existing = await repository.getByTenantAndKey(input.tenantId, input.instanceKey);
      if (existing?.status === "ACTIVE") return existing;

      const product = await repository.getProduct(input.productId);
      if (!product) throw new Error(`Product not found: ${input.productId}`);
      const adapter = registry.get(product.registryKey);
      const instance = existing ?? await repository.createProvisioning({
        tenantId: input.tenantId,
        productId: input.productId,
        acquisitionId: input.acquisitionId,
        instanceKey: input.instanceKey,
        configuration: input.configuration,
      });
      const provisioned = await adapter.provision(input);
      return repository.activate({
        instanceId: instance.id,
        externalRef: provisioned.externalRef ?? null,
        configuration: provisioned.configuration ?? input.configuration,
        activatedAt: now(),
      });
    },
  };
}
