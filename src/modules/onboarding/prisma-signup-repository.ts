import { themeRegistry } from "@/modules/themes/theme-registry";
import type {
  AccountCreationInput,
  ProvisionedAccountResult,
  SignupProvisioningRepository
} from "@/modules/onboarding/signup-provisioning";

type PrismaSignupTransaction = {
  theme: {
    upsert(input: unknown): Promise<{ id: string }>;
  };
  template: {
    upsert(input: unknown): Promise<{ id: string }>;
  };
  user: {
    create(input: unknown): Promise<{ id: string }>;
  };
  tenant: {
    create(input: unknown): Promise<{ id: string }>;
  };
  site: {
    create(input: unknown): Promise<{ id: string; slug: string }>;
  };
  siteThemeConfig: {
    create(input: unknown): Promise<{ id: string }>;
  };
  siteSection: {
    createMany(input: unknown): Promise<{ count: number }>;
  };
  subscription: {
    create(input: unknown): Promise<{ id: string; status: "TRIAL" }>;
  };
  package: {
    createMany(input: unknown): Promise<{ count: number }>;
  };
  extraService: {
    createMany(input: unknown): Promise<{ count: number }>;
  };
};

type PrismaSignupClient = {
  user: {
    count(input: unknown): Promise<number>;
  };
  site: {
    findMany(input: unknown): Promise<Array<{ slug: string }>>;
  };
  $transaction: unknown;
};

type PrismaTransactionRunner = <T>(
  callback: (transaction: PrismaSignupTransaction) => Promise<T>
) => Promise<T>;

export function createPrismaSignupProvisioningRepository(
  prisma: PrismaSignupClient
): SignupProvisioningRepository {
  return {
    async emailExists(email) {
      const count = await prisma.user.count({
        where: {
          email,
          deletedAt: null
        }
      });

      return count > 0;
    },
    async getUnavailableSlugs() {
      const sites = await prisma.site.findMany({
        select: {
          slug: true
        },
        where: {
          deletedAt: null
        }
      });

      return new Set(sites.map((site) => site.slug));
    },
    async createAccountWithSite(input) {
      return (prisma.$transaction as PrismaTransactionRunner)(async (transaction) => {
        const theme = await upsertTheme(transaction, input);
        await upsertTemplate(transaction, input, theme.id);
        const user = await transaction.user.create({
          data: {
            email: input.user.email,
            name: input.user.name,
            passwordHash: input.user.passwordHash,
            role: "USER"
          },
          select: {
            id: true
          }
        });
        const tenant = await transaction.tenant.create({
          data: {
            ownerUserId: user.id,
            displayName: input.tenant.displayName,
            status: input.tenant.status,
            trialStartedAt: input.tenant.trialStartedAt,
            trialEndsAt: input.tenant.trialEndsAt
          },
          select: {
            id: true
          }
        });
        const site = await transaction.site.create({
          data: {
            tenantId: tenant.id,
            themeId: theme.id,
            slug: input.site.slug,
            title: input.site.title,
            description: input.site.description,
            status: "PUBLISHED",
            isPublished: true
          },
          select: {
            id: true,
            slug: true
          }
        });

        await transaction.siteThemeConfig.create({
          data: {
            siteId: site.id,
            themeId: theme.id,
            config: themeRegistry.getTheme(input.site.themeCode)?.defaultConfig ?? {}
          }
        });

        await transaction.siteSection.createMany({
          data: input.defaultContent.sections.map((section) => ({
            siteId: site.id,
            type: section.type,
            title: section.title,
            sortOrder: section.sortOrder,
            data: section.data,
            isVisible: true
          }))
        });

        await transaction.package.createMany({
          data: input.defaultContent.packages.map((item) => ({
            siteId: site.id,
            name: item.name,
            subtitle: item.subtitle,
            priceAmount: item.priceAmount,
            currency: item.currency,
            features: item.features,
            isHighlighted: item.isHighlighted,
            sortOrder: item.sortOrder,
            isActive: true
          }))
        });

        await transaction.extraService.createMany({
          data: input.defaultContent.extras.map((item) => ({
            siteId: site.id,
            name: item.name,
            priceAmount: item.priceAmount,
            currency: item.currency,
            iconKey: item.iconKey,
            sortOrder: item.sortOrder,
            isActive: true
          }))
        });

        const subscription = await transaction.subscription.create({
          data: {
            tenantId: tenant.id,
            status: input.subscription.status,
            currentPeriodStart: input.subscription.trialStartedAt,
            currentPeriodEnd: input.subscription.trialEndsAt,
            expiresAt: input.subscription.trialEndsAt
          },
          select: {
            id: true,
            status: true
          }
        });

        return {
          userId: user.id,
          tenantId: tenant.id,
          siteId: site.id,
          slug: site.slug,
          subscriptionStatus: subscription.status
        } satisfies ProvisionedAccountResult;
      });
    }
  };
}

async function upsertTheme(
  transaction: PrismaSignupTransaction,
  input: AccountCreationInput
) {
  const themeDefinition = themeRegistry.getTheme(input.site.themeCode);

  if (!themeDefinition) {
    throw new Error(`Missing theme definition: ${input.site.themeCode}`);
  }

  return transaction.theme.upsert({
    where: {
      code: themeDefinition.code
    },
    create: {
      code: themeDefinition.code,
      name: themeDefinition.name,
      status: themeDefinition.status.toUpperCase(),
      version: themeDefinition.version,
      category: "photography",
      defaultConfig: themeDefinition.defaultConfig,
      contentSchema: {
        supportedSections: themeDefinition.supportedSections
      }
    },
    update: {
      name: themeDefinition.name,
      status: themeDefinition.status.toUpperCase(),
      version: themeDefinition.version,
      defaultConfig: themeDefinition.defaultConfig,
      contentSchema: {
        supportedSections: themeDefinition.supportedSections
      }
    },
    select: {
      id: true
    }
  });
}

async function upsertTemplate(
  transaction: PrismaSignupTransaction,
  input: AccountCreationInput,
  themeId: string
) {
  const template = themeRegistry.getTemplate(input.site.templateCode);

  if (!template) {
    throw new Error(`Missing template definition: ${input.site.templateCode}`);
  }

  return transaction.template.upsert({
    where: {
      code: template.code
    },
    create: {
      themeId,
      code: template.code,
      name: template.name,
      status: template.status.toUpperCase(),
      showroomOrder: template.showroomOrder,
      previewData: {},
      settings: {}
    },
    update: {
      themeId,
      name: template.name,
      status: template.status.toUpperCase(),
      showroomOrder: template.showroomOrder
    },
    select: {
      id: true
    }
  });
}
