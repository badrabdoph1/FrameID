import { describe, expect, it } from "vitest";

import { createPrismaSiteThemeSelectionRepository } from "@/modules/themes/prisma-site-theme-selection-repository";
import { themeRegistry, getTemplateByCode } from "@/modules/themes/theme-registry";

describe("prisma site theme selection repository", () => {
  it("upserts theme/template records and updates design settings without touching content", async () => {
    const calls: string[] = [];
    const prisma = {
      theme: {
        async upsert(args: { where: { code: string }; create: { code: string } }) {
          calls.push(`theme:${args.where.code}:${args.create.code}`);
          return { id: "theme_1" };
        }
      },
      template: {
        async upsert(args: { where: { code: string }; create: { code: string } }) {
          calls.push(`template:${args.where.code}:${args.create.code}`);
          return { id: "template_1" };
        }
      },
      site: {
        async update(args: { where: { id: string }; data: { themeId: string; templateCode: string; templateVersion: string } }) {
          calls.push(`site:${args.where.id}:${args.data.themeId}:${args.data.templateCode}:${args.data.templateVersion}`);
          return {};
        }
      },
      siteThemeConfig: {
        async updateMany(args: {
          where: { siteId: string; deletedAt: null };
          data: { themeId: string; config: unknown };
        }) {
          calls.push(`config-update:${args.where.siteId}:${args.data.themeId}`);
          return { count: 1 };
        },
        async create(args: {
          data: { siteId: string; themeId: string; config: unknown };
        }) {
          calls.push(`config-create:${args.data.siteId}:${args.data.themeId}`);
          return {};
        }
      }
    };
    const repository = createPrismaSiteThemeSelectionRepository(prisma);
    const theme = themeRegistry.getTheme("noir-gold");
    const template = getTemplateByCode("noir-gold");

    if (!theme || !template) {
      throw new Error("Missing test theme");
    }

    await repository.applyTemplate({
      siteId: "site_1",
      theme,
      template
    });

    expect(calls).toEqual([
      "theme:noir-gold:noir-gold",
      "template:noir-gold:noir-gold",
      "site:site_1:theme_1:noir-gold:1.0.0",
      "config-update:site_1:theme_1"
    ]);
  });
});
