import { describe, expect, it } from "vitest";

import { createPrismaSiteThemeSelectionRepository } from "@/modules/themes/prisma-site-theme-selection-repository";
import { themeRegistry, getTemplateByCode } from "@/modules/themes/theme-registry";

describe("prisma site theme selection repository", () => {
  it("upserts theme and template records, updates site theme, and stores config", async () => {
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
        async update(args: { where: { id: string }; data: { themeId: string } }) {
          calls.push(`site:${args.where.id}:${args.data.themeId}`);
          return {};
        }
      },
      siteThemeConfig: {
        async upsert(args: {
          where: { siteId: string };
          create: { siteId: string; themeId: string };
          update: { themeId: string };
        }) {
          calls.push(
            `config:${args.where.siteId}:${args.create.themeId}:${args.update.themeId}`
          );
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
      "site:site_1:theme_1",
      "config:site_1:theme_1:theme_1"
    ]);
  });
});
