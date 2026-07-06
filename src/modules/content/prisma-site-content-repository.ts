import type { SiteContentRepository } from "@/modules/content/site-content-service";

type PrismaSiteContentClient = {
  site: {
    update(input: unknown): Promise<unknown>;
  };
  siteSection: {
    findFirst(input: unknown): Promise<{ id: string } | null>;
    update(input: unknown): Promise<{ id: string }>;
    create(input: unknown): Promise<{ id: string }>;
  };
};

export function createPrismaSiteContentRepository(
  prisma: PrismaSiteContentClient
): SiteContentRepository {
  return {
    async updateSiteBasics(input) {
      await prisma.site.update({
        where: {
          id: input.siteId
        },
        data: {
          title: input.title,
          description: input.description
        }
      });
    },
    async upsertSection(input) {
      const existing = await prisma.siteSection.findFirst({
        where: {
          siteId: input.siteId,
          type: input.type,
          deletedAt: null
        },
        select: {
          id: true
        }
      });

      if (existing) {
        return prisma.siteSection.update({
          where: {
            id: existing.id
          },
          data: {
            type: input.type,
            title: input.title,
            sortOrder: input.sortOrder,
            data: input.data,
            isVisible: true
          },
          select: {
            id: true
          }
        });
      }

      return prisma.siteSection.create({
        data: {
          siteId: input.siteId,
          type: input.type,
          title: input.title,
          sortOrder: input.sortOrder,
          data: input.data,
          isVisible: true
        },
        select: {
          id: true
        }
      });
    }
  };
}
