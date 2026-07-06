import type { SiteThemeSelectionRepository } from "@/modules/themes/site-theme-selection-service";

type PrismaSiteThemeSelectionClient = {
  theme: {
    upsert(input: unknown): Promise<{ id: string }>;
  };
  template: {
    upsert(input: unknown): Promise<{ id: string }>;
  };
  site: {
    update(input: unknown): Promise<unknown>;
  };
  siteThemeConfig: {
    upsert(input: unknown): Promise<unknown>;
  };
};

export function createPrismaSiteThemeSelectionRepository(
  prisma: PrismaSiteThemeSelectionClient
): SiteThemeSelectionRepository {
  return {
    async applyTemplate(input) {
      const theme = await prisma.theme.upsert({
        where: {
          code: input.theme.code
        },
        create: {
          code: input.theme.code,
          name: input.theme.name,
          status: input.theme.status.toUpperCase(),
          version: input.theme.version,
          category: "photography",
          defaultConfig: input.theme.defaultConfig,
          contentSchema: {
            supportedSections: input.theme.supportedSections
          }
        },
        update: {
          name: input.theme.name,
          status: input.theme.status.toUpperCase(),
          version: input.theme.version,
          defaultConfig: input.theme.defaultConfig,
          contentSchema: {
            supportedSections: input.theme.supportedSections
          }
        },
        select: {
          id: true
        }
      });

      await prisma.template.upsert({
        where: {
          code: input.template.code
        },
        create: {
          themeId: theme.id,
          code: input.template.code,
          name: input.template.name,
          status: input.template.status.toUpperCase(),
          showroomOrder: input.template.showroomOrder,
          previewData: {},
          settings: {}
        },
        update: {
          themeId: theme.id,
          name: input.template.name,
          status: input.template.status.toUpperCase(),
          showroomOrder: input.template.showroomOrder
        },
        select: {
          id: true
        }
      });

      await prisma.site.update({
        where: {
          id: input.siteId
        },
        data: {
          themeId: theme.id
        }
      });

      await prisma.siteThemeConfig.upsert({
        where: {
          siteId: input.siteId
        },
        create: {
          siteId: input.siteId,
          themeId: theme.id,
          config: input.theme.defaultConfig
        },
        update: {
          themeId: theme.id,
          config: input.theme.defaultConfig
        }
      });
    }
  };
}
