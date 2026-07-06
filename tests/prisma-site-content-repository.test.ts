import { describe, expect, it } from "vitest";

import { createPrismaSiteContentRepository } from "@/modules/content/prisma-site-content-repository";

describe("prisma site content repository", () => {
  it("updates existing sections and site basics", async () => {
    const calls: string[] = [];
    const prisma = {
      site: {
        async update(args: { where: { id: string }; data: { title: string } }) {
          calls.push(`site:${args.where.id}:${args.data.title}`);
          return {};
        }
      },
      siteSection: {
        async findFirst() {
          calls.push("find-section");
          return { id: "section_1" };
        },
        async update(args: { where: { id: string }; data: { type: string } }) {
          calls.push(`update-section:${args.where.id}:${args.data.type}`);
          return { id: args.where.id };
        },
        async create() {
          throw new Error("should not create when section exists");
        }
      }
    };
    const repository = createPrismaSiteContentRepository(prisma);

    await repository.updateSiteBasics({ siteId: "site_1", title: "New title" });
    await expect(
      repository.upsertSection({
        siteId: "site_1",
        type: "hero",
        title: "الرئيسية",
        sortOrder: 0,
        data: { headline: "New title" }
      })
    ).resolves.toEqual({ id: "section_1" });

    expect(calls).toEqual([
      "site:site_1:New title",
      "find-section",
      "update-section:section_1:hero"
    ]);
  });
});
