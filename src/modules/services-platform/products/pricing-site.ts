import type { ProductModuleDefinition } from "../product-registry";

export const pricingSiteProduct: ProductModuleDefinition = {
  key: "pricing-site",
  productCode: "pricing-site",
  displayName: "موقع صفحات الأسعار",
  supportedCapabilities: ["pricing_site.access", "pricing_site.sites", "storage.gb"],
  async provision(input) {
    return {
      externalRef: `pricing-site:${input.tenantId}:${input.instanceKey}`,
      configuration: input.configuration,
    };
  },
};
