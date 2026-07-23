import { Prisma, ProductPublicationStatus, type PrismaClient } from "@prisma/client";

import type { CatalogRepository, ProductDraft } from "./catalog-service";
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
              capabilities: { include: { capability: { select: { key: true } } } },
              workflowTemplate: { select: { key: true } },
              bundleComponents: {
                include: {
                  componentOffering: {
                    select: {
                      id: true,
                      code: true,
                      publicationStatus: true,
                      productId: true,
                      product: { select: { publicationStatus: true } },
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
        category: product.category,
        publicationStatus: product.publicationStatus,
        releaseStage: product.releaseStage,
        offerings: product.offerings.map((offering) => ({
          id: offering.id,
          code: offering.code,
          name: offering.name,
          type: offering.type,
          publicationStatus: offering.publicationStatus,
          workflowTemplateKey: offering.workflowTemplate?.key ?? null,
          prices: offering.prices.map((price) => ({
            id: price.id,
            amount: price.amount,
            currency: price.currency,
            billingInterval: price.billingInterval,
            isActive: price.isActive,
          })),
          capabilityKeys: offering.capabilities.map((capability) => capability.capability.key),
          bundleComponents: offering.bundleComponents.map(({ componentOffering }) => ({
            offeringId: componentOffering.id,
            offeringCode: componentOffering.code,
            publicationStatus: componentOffering.publicationStatus,
            productId: componentOffering.productId,
            productPublicationStatus: componentOffering.product?.publicationStatus ?? null,
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
    include: {
      offerings: {
        where: { publicationStatus: ProductPublicationStatus.PUBLISHED, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          prices: { where: { isActive: true }, orderBy: { effectiveFrom: "desc" } },
          capabilities: { include: { capability: { select: { key: true } } } },
        },
      },
    },
  });

  const mapped: CatalogReadProduct[] = products.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    category: product.category,
    tags: product.tags,
    media: product.media,
    releaseStage: product.releaseStage,
    accessTier: product.accessTier,
    eligibilityPolicy: product.eligibilityPolicy as EligibilityPolicy | null,
    sortOrder: product.sortOrder,
    isFeatured: product.isFeatured,
    offerings: product.offerings.map((offering) => ({
      id: offering.id,
      code: offering.code,
      name: offering.name,
      shortDescription: offering.shortDescription,
      description: offering.description,
      type: offering.type,
      salesMode: offering.salesMode,
      releaseStage: offering.releaseStage,
      accessTier: offering.accessTier,
      eligibilityPolicy: offering.eligibilityPolicy as EligibilityPolicy | null,
      sortOrder: offering.sortOrder,
      prices: offering.prices.map((price) => ({
        id: price.id,
        amount: price.amount,
        currency: price.currency,
        marketCode: price.marketCode,
        billingInterval: price.billingInterval,
        effectiveFrom: price.effectiveFrom,
        effectiveTo: price.effectiveTo,
      })),
      capabilityKeys: offering.capabilities.map((capability) => capability.capability.key),
    })),
  }));

  return buildCatalogReadModel({ ...input, products: mapped, now });
}
