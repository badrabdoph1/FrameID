import type { PrismaClient } from "@prisma/client";
import { createCommunicationCore, createPrismaCommunicationRepository } from "@/modules/communication-core";

import { createAcquisitionService } from "./acquisition-service";
import { createCatalogService } from "./catalog-service";
import { createServicesCommunicationAdapter } from "./communication-adapter";
import { createEntitlementService } from "./entitlement-service";
import { createFulfillmentService, createWorkflowRegistry } from "./fulfillment-service";
import { createServicesPaymentService } from "./payment-integration";
import { createServiceSubscriptionService } from "./subscription-service";
import { createTrialService } from "./trial-service";
import { createUsageService } from "./usage-service";
import { createPrismaAcquisitionRepository } from "./prisma-acquisition-repository";
import { createPrismaCatalogRepository } from "./prisma-catalog-repository";
import { createPrismaEntitlementRepository } from "./prisma-entitlement-repository";
import { createPrismaFulfillmentRepository } from "./prisma-fulfillment-repository";
import { createPrismaServicesPaymentRepository } from "./prisma-payment-repository";
import { createPrismaProductInstanceRepository } from "./prisma-product-instance-repository";
import { createPrismaServiceSubscriptionRepository } from "./prisma-subscription-repository";
import { createPrismaTrialRepository } from "./prisma-trial-repository";
import { createPrismaUsageRepository } from "./prisma-usage-repository";
import { pricingSiteProduct } from "./products/pricing-site";
import { createProductInstanceService } from "./product-instance-service";
import { createProductRegistry, type ProductModuleDefinition } from "./product-registry";
import { defaultWorkflowHandlers } from "./workflows";

export function createServicesPlatformRuntime(
  prisma: PrismaClient,
  productModules: readonly ProductModuleDefinition[] = [pricingSiteProduct],
) {
  const registry = createProductRegistry(productModules);
  const entitlements = createEntitlementService(createPrismaEntitlementRepository(prisma));
  const productInstances = createProductInstanceService(createPrismaProductInstanceRepository(prisma), registry);
  const subscriptions = createServiceSubscriptionService(createPrismaServiceSubscriptionRepository(prisma));
  const communicationCore = createCommunicationCore(createPrismaCommunicationRepository(prisma));
  return {
    registry,
    catalog: createCatalogService(createPrismaCatalogRepository(prisma), registry),
    acquisitions: createAcquisitionService(
      createPrismaAcquisitionRepository(prisma),
      createServicesCommunicationAdapter(communicationCore),
    ),
    payments: createServicesPaymentService(createPrismaServicesPaymentRepository(prisma)),
    subscriptions,
    trials: createTrialService(createPrismaTrialRepository(prisma), undefined, { grantEntitlement: entitlements.grant }),
    usage: createUsageService(createPrismaUsageRepository(prisma)),
    entitlements,
    productInstances,
    fulfillment: createFulfillmentService({
      repository: createPrismaFulfillmentRepository(prisma),
      workflows: createWorkflowRegistry(defaultWorkflowHandlers),
      grantEntitlement: entitlements.grant,
      activateProduct: productInstances.activate,
      createSubscription: subscriptions.create,
    }),
  };
}
