export type ProductProvisionInput = {
  tenantId: string;
  productId: string;
  acquisitionId: string | null;
  instanceKey: string;
  configuration: unknown;
  idempotencyKey: string;
};

export type ProductProvisionResult = {
  externalRef?: string;
  configuration?: unknown;
};

export type ProductModuleDefinition = {
  key: string;
  productCode: string;
  displayName: string;
  supportedCapabilities: readonly string[];
  provision(input: ProductProvisionInput): Promise<ProductProvisionResult>;
  suspend?(input: { tenantId: string; instanceKey: string; reason: string; idempotencyKey: string }): Promise<void>;
  resume?(input: { tenantId: string; instanceKey: string; idempotencyKey: string }): Promise<void>;
  deprovision?(input: { tenantId: string; instanceKey: string; reason: string; idempotencyKey: string }): Promise<void>;
};

export class ProductRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductRegistryError";
  }
}

export type ProductRegistry = ReturnType<typeof createProductRegistry>;

export function createProductRegistry(definitions: readonly ProductModuleDefinition[]) {
  const byKey = new Map<string, ProductModuleDefinition>();
  const byProductCode = new Map<string, ProductModuleDefinition>();

  for (const definition of definitions) {
    if (!definition.key.trim() || !definition.productCode.trim()) {
      throw new ProductRegistryError("Product registry keys and product codes are required.");
    }
    if (byKey.has(definition.key)) {
      throw new ProductRegistryError(`Duplicate product registry key: ${definition.key}`);
    }
    if (byProductCode.has(definition.productCode)) {
      throw new ProductRegistryError(`Duplicate product code: ${definition.productCode}`);
    }
    byKey.set(definition.key, definition);
    byProductCode.set(definition.productCode, definition);
  }

  return Object.freeze({
    get(key: string) {
      const definition = byKey.get(key);
      if (!definition) {
        throw new ProductRegistryError(`No product adapter is registered for: ${key}`);
      }
      return definition;
    },
    getByProductCode(productCode: string) {
      const definition = byProductCode.get(productCode);
      if (!definition) {
        throw new ProductRegistryError(`No product adapter is registered for product: ${productCode}`);
      }
      return definition;
    },
    has(key: string) {
      return byKey.has(key);
    },
    list() {
      return [...byKey.values()];
    },
  });
}
