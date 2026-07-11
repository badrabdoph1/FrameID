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
    updateMany(input: unknown): Promise<{ count: number }>;
    create(input: unknown): Promise<unknown>;
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
          version: input.theme.version,
          showroomOrder: input.template.showroomOrder,
          settings: input.template.starterContent.themeSettings
        },
        update: {
          themeId: theme.id,
          name: input.template.name,
          status: input.template.status.toUpperCase(),
          version: input.theme.version,
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
          themeId: theme.id,
          templateCode: input.template.code,
          templateVersion: input.theme.version
        }
      });

      const updatedConfigs = await prisma.siteThemeConfig.updateMany({
        where: {
          siteId: input.siteId,
          deletedAt: null
        },
        data: {
          themeId: theme.id,
          config: input.template.starterContent.themeSettings
        }
      });

      if (updatedConfigs.count === 0) {
        await prisma.siteThemeConfig.create({
          data: {
            siteId: input.siteId,
            themeId: theme.id,
            config: input.template.starterContent.themeSettings
          }
        });
      }
    }
  };
}
