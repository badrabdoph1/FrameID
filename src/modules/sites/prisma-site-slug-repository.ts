import type { SiteSlugRepository } from "@/modules/sites/site-slug-service";

type PrismaSiteSlugClient = {
  site: {
    count(input: unknown): Promise<number>;
    updateMany(input: unknown): Promise<{ count: number }>;
  };
};

export function createPrismaSiteSlugRepository(
  prisma: PrismaSiteSlugClient
): SiteSlugRepository {
  return {
    async isSlugUnavailable(slug, currentSiteId) {
      const count = await prisma.site.count({
        where: {
          slug,
          deletedAt: null,
          id: {
            not: currentSiteId
          }
        }
      });

      return count > 0;
    },
    async updateSiteSlug(input) {
      const result = await prisma.site.updateMany({
        where: {
          id: input.siteId,
          slugChangeUsed: false,
          deletedAt: null
        },
        data: {
          slug: input.slug,
          slugChangeUsed: true
        }
      });

      return result.count === 1;
    }
  };
}
