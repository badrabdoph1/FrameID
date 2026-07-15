import { themeRegistry } from "@/modules/themes/theme-registry";
import type {
  AccountCreationInput,
  ProvisionedAccountResult,
  SignupProvisioningRepository
} from "@/modules/onboarding/signup-provisioning";

type PrismaSignupTransaction = {
  theme: { upsert(input: unknown): Promise<{ id: string }>; };
  template: { upsert(input: unknown): Promise<{ id: string }>; };
  user: { create(input: unknown): Promise<{ id: string }>; };
  tenant: { create(input: unknown): Promise<{ id: string }>; };
  site: { create(input: unknown): Promise<{ id: string; slug: string }>; };
  siteThemeConfig: { create(input: unknown): Promise<{ id: string }>; };
  siteSection: { createMany(input: unknown): Promise<{ count: number }>; };
  contactProfile: { create(input: unknown): Promise<{ id: string }>; };
  mediaAsset: { create(input: unknown): Promise<{ id: string }>; };
  galleryAlbum: { create(input: unknown): Promise<{ id: string }>; };
  galleryImage: { create(input: unknown): Promise<{ id: string }>; };
  sEOSettings: { create(input: unknown): Promise<{ id: string }>; };
  subscription: { create(input: unknown): Promise<{ id: string; status: "TRIAL" }>; };
  package: { createMany(input: unknown): Promise<{ count: number }>; };
  extraService: { createMany(input: unknown): Promise<{ count: number }>; };
};

type PrismaSignupClient = {
  user: { count(input: unknown): Promise<number>; };
  site: { findMany(input: unknown): Promise<Array<{ slug: string }>>; };
  template: { findUnique(input: unknown): Promise<{ status: string; deletedAt: Date | null } | null>; };
  $transaction: unknown;
};

type PrismaTransactionRunner = <T>(callback: (transaction: PrismaSignupTransaction) => Promise<T>) => Promise<T>;

export function createPrismaSignupProvisioningRepository(prisma: PrismaSignupClient): SignupProvisioningRepository {
  return {
    async identifierExists({ email, phone }) {
      const count = await prisma.user.count({
        where: {
          deletedAt: null,
          OR: [
            { email },
            ...(phone ? [{ phone }] : [])
          ]
        }
      });

      return count > 0;
    },
    async identifierExistsInTrash({ email, phone }) {
      const count = await prisma.user.count({
        where: {
          deletedAt: { not: null },
          OR: [
            { email },
            ...(phone ? [{ phone }] : [])
          ]
        }
      });

      return count > 0;
    },
    async getUnavailableSlugs() {
      const sites = await prisma.site.findMany({ select: { slug: true } });
      return new Set(sites.map((site) => site.slug));
    },
    async isTemplateAvailable(templateCode) {
      const registryTemplate = themeRegistry.getTemplate(templateCode);
      if (!registryTemplate || registryTemplate.status !== "published") return false;

      const row = await prisma.template.findUnique({
        where: { code: templateCode },
        select: { status: true, deletedAt: true }
      });

      if (row?.deletedAt) return false;
      if (row && row.status !== "PUBLISHED") return false;
      return true;
    },
    async createAccountWithSite(input) {
      return (prisma.$transaction as PrismaTransactionRunner)(async (transaction) => {
        const theme = await upsertTheme(transaction, input);
        await upsertTemplate(transaction, input, theme.id);
        const user = await transaction.user.create({
          data: {
            email: input.user.email,
            phone: input.user.phone,
            name: input.user.name,
            passwordHash: input.user.passwordHash,
            role: "USER"
          },
          select: { id: true }
        });
        const tenant = await transaction.tenant.create({
          data: {
            ownerUserId: user.id,
            displayName: input.tenant.displayName,
            status: input.tenant.status,
            trialStartedAt: input.tenant.trialStartedAt,
            trialEndsAt: input.tenant.trialEndsAt
          },
          select: { id: true }
        });
        const site = await transaction.site.create({
          data: {
            tenantId: tenant.id,
            themeId: theme.id,
            slug: input.site.slug,
            title: input.site.title,
            description: input.site.description,
            status: "PUBLISHED",
            isPublished: true,
            templateCode: input.site.templateCode,
            templateVersion: input.site.templateVersion
          },
          select: { id: true, slug: true }
        });

        await transaction.siteThemeConfig.create({ data: { siteId: site.id, themeId: theme.id, config: input.defaultContent.themeConfig } });

        await transaction.siteSection.createMany({
          data: input.defaultContent.sections.map((section) => ({
            siteId: site.id,
            type: section.type,
            title: section.title,
            sortOrder: section.sortOrder,
            data: section.data,
            isVisible: section.isVisible
          }))
        });

        await transaction.contactProfile.create({
          data: {
            siteId: site.id,
            studioName: input.defaultContent.contact.studioName,
            bio: input.defaultContent.contact.bio,
            longDescription: input.defaultContent.contact.longDescription,
            phone: input.defaultContent.contact.phone,
            whatsapp: input.defaultContent.contact.whatsapp,
            email: input.defaultContent.contact.email,
            instagram: input.defaultContent.contact.instagram,
            facebook: input.defaultContent.contact.facebook,
            tiktok: input.defaultContent.contact.tiktok,
            workLocation: input.defaultContent.contact.workLocation,
            bookingMessageTemplate: input.defaultContent.contact.callToAction
          }
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
            description: item.description,
            priceAmount: item.priceAmount,
            currency: item.currency,
            iconKey: item.iconKey,
            sortOrder: item.sortOrder,
            isActive: true
          }))
        });

        await copyGallery(transaction, {
          tenantId: tenant.id,
          siteId: site.id,
          templateCode: input.site.templateCode,
          templateVersion: input.site.templateVersion,
          album: input.defaultContent.gallery.album,
          images: input.defaultContent.gallery.images,
        });

        await transaction.sEOSettings.create({
          data: {
            siteId: site.id,
            title: input.defaultContent.seo.title,
            description: input.defaultContent.seo.description,
            canonicalUrl: input.defaultContent.seo.canonicalUrl,
            robotsIndex: input.defaultContent.seo.robotsIndex,
            structuredDataOverrides: input.defaultContent.seo.structuredDataOverrides
          }
        });

        const subscription = await transaction.subscription.create({
          data: {
            tenantId: tenant.id,
            status: input.subscription.status,
            currentPeriodStart: input.subscription.trialStartedAt,
            currentPeriodEnd: input.subscription.trialEndsAt,
            expiresAt: input.subscription.trialEndsAt
          },
          select: { id: true, status: true }
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

async function copyGallery(
  transaction: PrismaSignupTransaction,
  input: {
    tenantId: string;
    siteId: string;
    templateCode: string;
    templateVersion: string;
    album: AccountCreationInput["defaultContent"]["gallery"]["album"];
    images: AccountCreationInput["defaultContent"]["gallery"]["images"];
  }
) {
  const album = await transaction.galleryAlbum.create({
    data: {
      siteId: input.siteId,
      title: input.album.title,
      slug: "main-gallery",
      description: input.album.description,
      isVisible: true,
      sortOrder: input.album.sortOrder
    },
    select: { id: true }
  });

  for (const image of input.images) {
    const asset = await transaction.mediaAsset.create({
      data: {
        tenantId: input.tenantId,
        kind: "image",
        url: image.url,
        storageKey: `template-content-source/${input.templateCode}/${input.templateVersion}/${input.siteId}/${image.sortOrder}-${image.id}`,
        mimeType: "image/jpeg",
        sizeBytes: 0,
        alt: image.alt,
        metadata: {
          source: "template-content-source",
          templateCode: input.templateCode,
          templateVersion: input.templateVersion,
          templateImageId: image.id
        }
      },
      select: { id: true }
    });

    await transaction.galleryImage.create({
      data: {
        albumId: album.id,
        assetId: asset.id,
        caption: image.caption,
        alt: image.alt,
        sortOrder: image.sortOrder,
        isFeatured: image.isFeatured
      },
      select: { id: true }
    });
  }
}

async function upsertTheme(transaction: PrismaSignupTransaction, input: AccountCreationInput) {
  const themeDefinition = themeRegistry.getTheme(input.site.themeCode);
  if (!themeDefinition) throw new Error(`Missing theme definition: ${input.site.themeCode}`);

  return transaction.theme.upsert({
    where: { code: themeDefinition.code },
    create: {
      code: themeDefinition.code,
      name: themeDefinition.name,
      status: themeDefinition.status.toUpperCase(),
      version: themeDefinition.version,
      category: "photography",
      defaultConfig: themeDefinition.defaultConfig,
      contentSchema: { supportedSections: themeDefinition.supportedSections }
    },
    update: {
      name: themeDefinition.name,
      status: themeDefinition.status.toUpperCase(),
      version: themeDefinition.version,
      defaultConfig: themeDefinition.defaultConfig,
      contentSchema: { supportedSections: themeDefinition.supportedSections }
    },
    select: { id: true }
  });
}

async function upsertTemplate(transaction: PrismaSignupTransaction, input: AccountCreationInput, themeId: string) {
  const template = themeRegistry.getTemplate(input.site.templateCode);
  if (!template) throw new Error(`Missing template definition: ${input.site.templateCode}`);

  return transaction.template.upsert({
    where: { code: template.code },
    create: {
      themeId,
      code: template.code,
      name: template.name,
      status: template.status.toUpperCase(),
      version: input.site.templateVersion,
      showroomOrder: template.showroomOrder,
      settings: input.defaultContent.themeConfig
    },
    update: {
      themeId,
      name: template.name,
      status: template.status.toUpperCase(),
      version: input.site.templateVersion,
      showroomOrder: template.showroomOrder
    },
    select: { id: true }
  });
}
