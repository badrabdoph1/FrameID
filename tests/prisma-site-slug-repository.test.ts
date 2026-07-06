import { describe, expect, it } from "vitest";

import { createPrismaSiteSlugRepository } from "@/modules/sites/prisma-site-slug-repository";

describe("prisma site slug repository", () => {
  it("checks slug conflicts outside the current site and updates slug once", async () => {
    const calls: string[] = [];
    const prisma = {
      site: {
        async count(args: {
          where: {
            slug: string;
            deletedAt: null;
            id: { not: string };
          };
        }) {
          calls.push(`count:${args.where.id.not}:${args.where.slug}`);
          return args.where.slug === "taken-slug" ? 1 : 0;
        },
        async updateMany(args: {
          where: {
            id: string;
            slugChangeUsed: false;
            deletedAt: null;
          };
          data: {
            slug: string;
            slugChangeUsed: true;
          };
        }) {
          calls.push(`update:${args.where.id}:${args.data.slug}`);
          return { count: 1 };
        }
      }
    };
    const repository = createPrismaSiteSlugRepository(prisma);

    await expect(repository.isSlugUnavailable("taken-slug", "site_1")).resolves.toBe(
      true
    );
    await expect(repository.isSlugUnavailable("free-slug", "site_1")).resolves.toBe(
      false
    );
    await expect(
      repository.updateSiteSlug({
        siteId: "site_1",
        slug: "free-slug"
      })
    ).resolves.toBe(true);
    expect(calls).toEqual([
      "count:site_1:taken-slug",
      "count:site_1:free-slug",
      "update:site_1:free-slug"
    ]);
  });
});
