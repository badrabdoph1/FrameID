import { Prisma, ProductPublicationStatus, type PrismaClient } from "@prisma/client";

import { parsePublishedCatalogSnapshot, type CatalogRepository, type ProductDraft } from "./catalog-service";
import type { EligibilityContext, EligibilityPolicy } from "./eligibility";
import { buildCatalogReadModel, type CatalogReadProduct } from "./catalog-read-model";

export function createPrismaCatalogRepository(prisma: PrismaClient): CatalogRepository {
  return {
    async getProductDraft(productId) {
      const product = await prisma.productDefinition.findUnique({
        where: { id: productId },
        include: {
          offerings: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: {
              prices: { orderBy: [{ version: "desc" }, { effectiveFrom: "desc" }] },
              capabilities: { include: { capability: { select: { id: true, key: true } } } },
              trialPolicies: { orderBy: { createdAt: "asc" } },
              workflowTemplate: { select: { key: true, version: true } },
              bundleComponents: {
                include: {
                  componentOffering: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      publicationStatus: true,
                      productId: true,
                      product: { select: { code: true, publicationStatus: true } },
                      releaseStage: true,
                      capabilities: { include: { capability: { select: { id: true, key: true } } } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!product) return null;
      return {
        id: product.id,
        code: product.code,
        registryKey: product.registryKey,
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        category: product.category,
        tags: product.tags,
        media: product.media,
        publicationStatus: product.publicationStatus,
        releaseStage: product.releaseStage,
        accessTier: product.accessTier,
        eligibilityPolicy: product.eligibilityPolicy,
        sortOrder: product.sortOrder,
        isFeatured: product.isFeatured,
        schemaVersion: 2,
        offerings: product.offerings.map((offering) => ({
          id: offering.id,
          code: offering.code,
          name: offering.name,
          shortDescription: offering.shortDescription,
          description: offering.description,
          type: offering.type,
          salesMode: offering.salesMode,
          fulfillmentMode: offering.fulfillmentMode,
          activationMode: offering.activationMode,
          publicationStatus: offering.publicationStatus,
          releaseStage: offering.releaseStage,
          accessTier: offering.accessTier,
          requirements: offering.requirements,
          eligibilityPolicy: offering.eligibilityPolicy,
          sortOrder: offering.sortOrder,
          workflowTemplateKey: offering.workflowTemplate?.key ?? null,
          workflowTemplateVersion: offering.workflowTemplate?.version ?? null,
          prices: offering.prices.map((price) => ({
            id: price.id,
            amount: price.amount,
            currency: price.currency,
            marketCode: price.marketCode,
            billingInterval: price.billingInterval,
            effectiveFrom: price.effectiveFrom.toISOString(),
            effectiveTo: price.effectiveTo?.toISOString() ?? null,
            isActive: price.isActive,
          })),
          capabilityKeys: offering.capabilities.map((capability) => capability.capability.key),
          capabilities: offering.capabilities.map((item) => ({ capabilityId: item.capability.id, capabilityKey: item.capability.key, value: item.value })),
          trialPolicies: offering.trialPolicies.map((policy) => ({
            id: policy.id,
            productId: policy.productId,
            offeringId: offering.id,
            name: policy.name,
            durationDays: policy.durationDays,
            usageLimit: policy.usageLimit,
            usageCapabilityKey: policy.usageCapabilityKey,
            oncePerTenant: policy.oncePerTenant,
            requiresPaymentMethod: policy.requiresPaymentMethod,
            graceDays: policy.graceDays,
            eligibilityPolicy: policy.eligibilityPolicy,
            isActive: policy.isActive,
          })),
          bundleComponents: offering.bundleComponents.map(({ componentOffering, quantity, required }) => ({
            offeringId: componentOffering.id,
            offeringCode: componentOffering.code,
            offeringName: componentOffering.name,
            publicationStatus: componentOffering.publicationStatus,
            productId: componentOffering.productId,
            productPublicationStatus: componentOffering.product?.publicationStatus ?? null,
            productCode: componentOffering.product?.code ?? null,
            quantity,
            required,
            capabilities: componentOffering.capabilities.map((item) => ({ capabilityId: item.capability.id, capabilityKey: item.capability.key, value: item.value })),
          })),
        })),
      } satisfies ProductDraft;
    },
    async publishRevision(input) {
      return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "ProductDefinition" WHERE id = ${input.productId} FOR UPDATE`;
        const aggregate = await tx.catalogRevision.aggregate({ where: { productId: input.productId }, _max: { revision: true } });
        const revision = (aggregate._max.revision ?? 0) + 1;
        const saved = await tx.catalogRevision.create({
          data: { productId: input.productId, revision, status: ProductPublicationStatus.PUBLISHED, snapshot: input.snapshot as unknown as Prisma.InputJsonValue, actorId: input.actorId, actorName: input.actorName, changeNote: input.changeNote, publishedAt: input.publishedAt },
          select: { id: true, revision: true },
        });
        await tx.productDefinition.update({ where: { id: input.productId }, data: { publicationStatus: ProductPublicationStatus.PUBLISHED, publishedRevision: revision, publishedAt: input.publishedAt } });
        await tx.catalogOffering.updateMany({ where: { productId: input.productId, publicationStatus: { in: ["DRAFT", "IN_REVIEW", "PAUSED"] }, deletedAt: null }, data: { publicationStatus: ProductPublicationStatus.PUBLISHED, publishedAt: input.publishedAt } });
        await tx.servicesOutboxEvent.upsert({
          where: { deduplicationKey: `catalog:${input.productId}:published:${revision}` }, update: {},
          create: { aggregateType: "ProductDefinition", aggregateId: input.productId, eventName: "services.catalog.published", payload: { productId: input.productId, revision }, deduplicationKey: `catalog:${input.productId}:published:${revision}` },
        });
        return saved;
      });
    },
    async pauseProduct(productId) {
      await prisma.productDefinition.update({ where: { id: productId }, data: { publicationStatus: ProductPublicationStatus.PAUSED } });
    },
    async retireProduct(productId) {
      await prisma.productDefinition.update({ where: { id: productId }, data: { publicationStatus: ProductPublicationStatus.RETIRED } });
    },
  };
}

export async function getCustomerCatalogReadModel(prisma: PrismaClient, input: {
  context: EligibilityContext;
  marketCode: string;
  currency: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const products = await prisma.productDefinition.findMany({
    where: { publicationStatus: ProductPublicationStatus.PUBLISHED, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      revisions: {
        where: { status: ProductPublicationStatus.PUBLISHED },
        orderBy: { revision: "desc" },
        take: 1,
        select: { snapshot: true },
      },
    },
  });

  const mapped: CatalogReadProduct[] = products.flatMap((product) => {
    const snapshot = parsePublishedCatalogSnapshot(product.revisions[0]?.snapshot);
    if (!snapshot) return [];
    return [{
      id: snapshot.id,
      code: snapshot.code,
      name: snapshot.name,
      shortDescription: snapshot.shortDescription,
      description: snapshot.description,
      category: snapshot.category,
      tags: snapshot.tags,
      media: snapshot.media,
      releaseStage: snapshot.releaseStage,
      accessTier: snapshot.accessTier,
      eligibilityPolicy: snapshot.eligibilityPolicy as EligibilityPolicy | null,
      sortOrder: snapshot.sortOrder,
      isFeatured: snapshot.isFeatured,
      offerings: snapshot.offerings
        .filter((offering) => !["PAUSED", "RETIRED"].includes(offering.publicationStatus))
        .map((offering) => ({
          id: offering.id,
          code: offering.code,
          name: offering.name,
          shortDescription: offering.shortDescription,
          description: offering.description,
          type: offering.type ?? "MANAGED_SERVICE",
          salesMode: offering.salesMode,
          releaseStage: offering.releaseStage,
          accessTier: offering.accessTier,
          eligibilityPolicy: offering.eligibilityPolicy as EligibilityPolicy | null,
          sortOrder: offering.sortOrder,
          prices: offering.prices.filter((price) => price.isActive).map((price) => ({
            id: price.id,
            amount: price.amount,
            currency: price.currency,
            marketCode: price.marketCode,
            billingInterval: price.billingInterval,
            effectiveFrom: new Date(price.effectiveFrom),
            effectiveTo: price.effectiveTo ? new Date(price.effectiveTo) : null,
          })),
          capabilityKeys: offering.capabilityKeys,
          capabilities: offering.capabilities,
          bundleComponents: offering.bundleComponents.map((component) => ({
            offeringId: component.offeringId,
            offeringCode: component.offeringCode,
            offeringName: component.offeringName,
            quantity: component.quantity,
            required: component.required,
          })),
          trialPolicies: (offering.trialPolicies ?? []).map((policy) => ({
            id: policy.id,
            durationDays: policy.durationDays,
            usageLimit: policy.usageLimit,
            usageCapabilityKey: policy.usageCapabilityKey,
            graceDays: policy.graceDays,
            requiresPaymentMethod: policy.requiresPaymentMethod,
            isActive: policy.isActive,
          })),
        })),
    }];
  });

  return buildCatalogReadModel({ ...input, products: mapped, now });
}
