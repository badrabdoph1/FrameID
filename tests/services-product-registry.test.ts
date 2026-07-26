import { describe, expect, it, vi } from "vitest";

import {
  ProductRegistryError,
  createProductRegistry,
  type ProductModuleDefinition,
} from "@/modules/services-platform/product-registry";

function product(key: string, productCode = key): ProductModuleDefinition {
  return {
    key,
    productCode,
    displayName: productCode,
    supportedCapabilities: [`${key}.access`],
    provision: vi.fn(async (input) => ({ externalRef: `${key}:${input.instanceKey}` })),
  };
}

describe("services product registry", () => {
  it("resolves a registered product adapter without coupling the core to its implementation", async () => {
    const pricingSite = product("pricing-site");
    const registry = createProductRegistry([pricingSite]);

    expect(registry.get("pricing-site")).toBe(pricingSite);
    await expect(
      registry.get("pricing-site").provision({
        tenantId: "tenant_1",
        productId: "product_1",
        acquisitionId: "acq_1",
        instanceKey: "primary",
        configuration: null,
        idempotencyKey: "activate_1",
      }),
    ).resolves.toEqual({ externalRef: "pricing-site:primary" });
  });

  it("rejects duplicate registry keys and product codes", () => {
    expect(() => createProductRegistry([product("same", "one"), product("same", "two")])).toThrow(ProductRegistryError);
    expect(() => createProductRegistry([product("one", "same"), product("two", "same")])).toThrow(ProductRegistryError);
  });

  it("fails closed for catalog products with no installed adapter", () => {
    const registry = createProductRegistry([]);
    expect(() => registry.get("future-product")).toThrow(/future-product/);
  });
});
