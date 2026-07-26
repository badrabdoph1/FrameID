import { Prisma, ProductInstanceStatus, type PrismaClient } from "@prisma/client";

import type { ProductInstanceRepository } from "./product-instance-service";

export function createPrismaProductInstanceRepository(prisma: PrismaClient): ProductInstanceRepository {
  return {
    getProduct(productId) {
      return prisma.productDefinition.findUnique({ where: { id: productId }, select: { id: true, registryKey: true } });
    },
    getByTenantAndKey(tenantId, instanceKey) {
      return prisma.productInstance.findUnique({
        where: { tenantId_instanceKey: { tenantId, instanceKey } },
        select: { id: true, status: true, externalRef: true },
      });
    },
    createProvisioning(input) {
      return prisma.productInstance.upsert({
        where: { tenantId_instanceKey: { tenantId: input.tenantId, instanceKey: input.instanceKey } },
        update: {},
        create: {
          tenantId: input.tenantId,
          productId: input.productId,
          acquisitionId: input.acquisitionId,
          instanceKey: input.instanceKey,
          configuration: input.configuration === null ? Prisma.JsonNull : input.configuration as Prisma.InputJsonValue,
          status: ProductInstanceStatus.PROVISIONING,
        },
        select: { id: true, status: true, externalRef: true },
      });
    },
    activate(input) {
      return prisma.productInstance.update({
        where: { id: input.instanceId },
        data: {
          status: ProductInstanceStatus.ACTIVE,
          externalRef: input.externalRef,
          configuration: input.configuration === null ? Prisma.JsonNull : input.configuration as Prisma.InputJsonValue,
          activatedAt: input.activatedAt,
          suspendedAt: null,
        },
        select: { id: true, status: true, externalRef: true },
      });
    },
  };
}
