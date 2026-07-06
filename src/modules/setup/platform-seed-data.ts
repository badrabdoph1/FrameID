import { templateDefinitions, themeDefinitions } from "@/modules/themes/definitions";

export function getPlatformSeedData() {
  return {
    themes: themeDefinitions.map((theme) => ({
      code: theme.code,
      name: theme.name,
      status: theme.status.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      version: theme.version,
      category: "photography",
      defaultConfig: theme.defaultConfig,
      contentSchema: {
        supportedSections: theme.supportedSections
      }
    })),
    templates: templateDefinitions.map((template) => ({
      code: template.code,
      themeCode: template.themeCode,
      name: template.name,
      status: template.status.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      showroomOrder: template.showroomOrder,
      previewData: {},
      settings: {}
    })),
    plans: [
      {
        code: "starter",
        name: "FrameID Starter",
        priceAmount: 120000,
        currency: "EGP",
        billingInterval: "monthly",
        features: {
          publicSite: true,
          dashboard: true,
          themes: 1,
          galleryImages: 250,
          manualActivation: true
        },
        isActive: true
      }
    ],
    backupSettings: [
      {
        type: "DATABASE" as const,
        enabled: true,
        schedule: "0 2 * * *",
        retentionCount: 14,
        compression: "zstd",
        encryption: true,
        githubBranch: "platform-backups"
      },
      {
        type: "UPLOADS" as const,
        enabled: true,
        schedule: "0 3 * * *",
        retentionCount: 14,
        compression: "zstd",
        encryption: true,
        githubBranch: "platform-backups"
      },
      {
        type: "FULL" as const,
        enabled: true,
        schedule: "0 4 * * 0",
        retentionCount: 8,
        compression: "zstd",
        encryption: true,
        githubBranch: "platform-backups"
      }
    ]
  };
}
