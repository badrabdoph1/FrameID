import { themeRegistry } from "@/modules/themes/theme-registry";
import type { ProvisionedTemplatePayload } from "@/modules/templates/template-content-source";

type TemplateContentResetTransaction = {
  theme: { upsert(input: unknown): Promise<{ id: string }> };
  template: { upsert(input: unknown): Promise<{ id: string }> };
  site: {
    findUnique(input: unknown): Promise<unknown>;
    update(input: unknown): Promise<unknown>;
  };
  siteContentSnapshot: { create(input: unknown): Promise<{ id: string }> };
  siteThemeConfig: {
    updateMany(input: unknown): Promise<{ count: number }>;
    create(input: unknown): Promise<{ id: string }>;
  };
  siteSection: {
    updateMany(input: unknown): Promise<{ count: number }>;
    createMany(input: unknown): Promise<{ count: number }>;
  };
  contactProfile: { upsert(input: unknown): Promise<{ id: string }> };
  package: {
    updateMany(input: unknown): Promise<{ count: number }>;
    createMany(input: unknown): Promise<{ count: number }>;
  };
  extraService: {
    updateMany(input: unknown): Promise<{ count: number }>;
    createMany(input: unknown): Promise<{ count: number }>;
  };
  galleryAlbum: {
    findMany(input: unknown): Promise<Array<{ id: string }>>;
    updateMany(input: unknown): Promise<{ count: number }>;
    create(input: unknown): Promise<{ id: string }>;
  };
  galleryImage: {
    updateMany(input: unknown): Promise<{ count: number }>;
    create(input: unknown): Promise<{ id: string }>;
  };
  mediaAsset: { create(input: unknown): Promise<{ id: string }> };
  sEOSettings: { upsert(input: unknown): Promise<{ id: string }> };
};

type TemplateContentResetPrismaClient = {
  $transaction<T>(callback: (transaction: TemplateContentResetTransaction) => Promise<T>): Promise<T>;
};

export type TemplateContentResetResult = {
  snapshotId: string;
  templateCode: string;
  templateVersion: string;
};

export async function replaceSiteContentFromTemplate(
  prisma: TemplateContentResetPrismaClient,
  input: {
    siteId: string;
    tenantId: string;
    payload: ProvisionedTemplatePayload;
    reason: string;
  },
): Promise<TemplateContentResetResult> {
  return prisma.$transaction(async (transaction) => {
    const snapshotData = await readCurrentSiteSnapshot(transaction, input.siteId);
    const snapshot = await transaction.siteContentSnapshot.create({
      data: {
        siteId: input.siteId,
        reason: input.reason,
        templateCode: input.payload.templateCode,
        templateVersion: input.payload.templateVersion,
        data: snapshotData,
      },
      select: { id: true },
    });

    const theme = await upsertTheme(transaction, input.payload);
    await upsertTemplate(transaction, input.payload, theme.id);
    await replaceContent(transaction, { ...input, themeId: theme.id });

    return {
      snapshotId: snapshot.id,
      templateCode: input.payload.templateCode,
      templateVersion: input.payload.templateVersion,
    };
  });
}

async function readCurrentSiteSnapshot(
  transaction: TemplateContentResetTransaction,
  siteId: string,
) {
  const site = await transaction.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      title: true,
      description: true,
      templateCode: true,
      templateVersion: true,
      theme: { select: { code: true, name: true, version: true } },
      themeConfigs: { where: { deletedAt: null }, select: { themeId: true, config: true } },
      sections: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      contactProfile: true,
      packages: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      extraServices: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      galleryAlbums: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          images: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: { asset: true },
          },
        },
      },
      seoSettings: true,
    },
  });

  if (!site) {
    throw new Error("Site not found");
  }

  return site;
}

async function upsertTheme(
  transaction: TemplateContentResetTransaction,
  payload: ProvisionedTemplatePayload,
) {
  const themeDefinition = themeRegistry.getTheme(payload.themeCode);
  if (!themeDefinition) throw new Error(`Missing theme definition: ${payload.themeCode}`);

  return transaction.theme.upsert({
    where: { code: themeDefinition.code },
    create: {
      code: themeDefinition.code,
      name: themeDefinition.name,
      status: themeDefinition.status.toUpperCase(),
      version: themeDefinition.version,
      category: "photography",
      defaultConfig: themeDefinition.defaultConfig,
      contentSchema: { supportedSections: themeDefinition.supportedSections },
    },
    update: {
      name: themeDefinition.name,
      status: themeDefinition.status.toUpperCase(),
      version: themeDefinition.version,
      defaultConfig: themeDefinition.defaultConfig,
      contentSchema: { supportedSections: themeDefinition.supportedSections },
    },
    select: { id: true },
  });
}

async function upsertTemplate(
  transaction: TemplateContentResetTransaction,
  payload: ProvisionedTemplatePayload,
  themeId: string,
) {
  const template = themeRegistry.getTemplate(payload.templateCode);
  if (!template) throw new Error(`Missing template definition: ${payload.templateCode}`);

  return transaction.template.upsert({
    where: { code: template.code },
    create: {
      themeId,
      code: template.code,
      name: template.name,
      status: template.status.toUpperCase(),
      version: payload.templateVersion,
      showroomOrder: template.showroomOrder,
      settings: payload.themeConfig,
    },
    update: {
      themeId,
      name: template.name,
      status: template.status.toUpperCase(),
      version: payload.templateVersion,
      showroomOrder: template.showroomOrder,
      settings: payload.themeConfig,
    },
    select: { id: true },
  });
}

async function replaceContent(
  transaction: TemplateContentResetTransaction,
  input: {
    siteId: string;
    tenantId: string;
    themeId: string;
    payload: ProvisionedTemplatePayload;
  },
) {
  const now = new Date();
  const { payload } = input;

  await transaction.site.update({
    where: { id: input.siteId },
    data: {
      themeId: input.themeId,
      title: payload.site.title,
      description: payload.site.description,
      templateCode: payload.templateCode,
      templateVersion: payload.templateVersion,
    },
  });

  const updatedConfigs = await transaction.siteThemeConfig.updateMany({
    where: { siteId: input.siteId, deletedAt: null },
    data: { themeId: input.themeId, config: payload.themeConfig },
  });

  if (updatedConfigs.count === 0) {
    await transaction.siteThemeConfig.create({
      data: { siteId: input.siteId, themeId: input.themeId, config: payload.themeConfig },
      select: { id: true },
    });
  }

  await transaction.siteSection.updateMany({
    where: { siteId: input.siteId, deletedAt: null },
    data: { deletedAt: now },
  });
  await transaction.siteSection.createMany({
    data: payload.sections.map((section) => ({
      siteId: input.siteId,
      type: section.type,
      title: section.title,
      sortOrder: section.sortOrder,
      data: section.data,
      isVisible: section.isVisible,
    })),
  });

  await transaction.contactProfile.upsert({
    where: { siteId: input.siteId },
    create: {
      siteId: input.siteId,
      studioName: payload.contact.studioName,
      bio: payload.contact.bio,
      longDescription: payload.contact.longDescription,
      phone: payload.contact.phone,
      whatsapp: payload.contact.whatsapp,
      email: payload.contact.email,
      instagram: payload.contact.instagram,
      facebook: payload.contact.facebook,
      bookingMessageTemplate: payload.contact.callToAction,
      avatarAssetId: null,
      coverAssetId: null,
      deletedAt: null,
    },
    update: {
      studioName: payload.contact.studioName,
      bio: payload.contact.bio,
      longDescription: payload.contact.longDescription,
      phone: payload.contact.phone,
      whatsapp: payload.contact.whatsapp,
      email: payload.contact.email,
      instagram: payload.contact.instagram,
      facebook: payload.contact.facebook,
      bookingMessageTemplate: payload.contact.callToAction,
      avatarAssetId: null,
      coverAssetId: null,
      deletedAt: null,
    },
    select: { id: true },
  });

  await transaction.package.updateMany({
    where: { siteId: input.siteId, deletedAt: null },
    data: { deletedAt: now },
  });
  await transaction.package.createMany({
    data: payload.packages.map((item) => ({
      siteId: input.siteId,
      name: item.name,
      subtitle: item.subtitle,
      priceAmount: item.priceAmount,
      currency: item.currency,
      features: item.features,
      imageUrl: item.imageUrl,
      isHighlighted: item.isHighlighted,
      sortOrder: item.sortOrder,
      isActive: true,
    })),
  });

  await transaction.extraService.updateMany({
    where: { siteId: input.siteId, deletedAt: null },
    data: { deletedAt: now },
  });
  await transaction.extraService.createMany({
    data: payload.extras.map((item) => ({
      siteId: input.siteId,
      name: item.name,
      description: item.description,
      priceAmount: item.priceAmount,
      currency: item.currency,
      iconKey: item.iconKey,
      sortOrder: item.sortOrder,
      isActive: true,
    })),
  });

  const albums = await transaction.galleryAlbum.findMany({
    where: { siteId: input.siteId, deletedAt: null },
    select: { id: true },
  });

  for (const album of albums) {
    await transaction.galleryImage.updateMany({
      where: { albumId: album.id, deletedAt: null },
      data: { deletedAt: now },
    });
  }

  await transaction.galleryAlbum.updateMany({
    where: { siteId: input.siteId, deletedAt: null },
    data: { deletedAt: now },
  });

  const album = await transaction.galleryAlbum.create({
    data: {
      siteId: input.siteId,
      title: payload.gallery.album.title,
      slug: "main-gallery",
      description: payload.gallery.album.description,
      isVisible: true,
      sortOrder: payload.gallery.album.sortOrder,
    },
    select: { id: true },
  });

  for (const image of payload.gallery.images) {
    const asset = await transaction.mediaAsset.create({
      data: {
        tenantId: input.tenantId,
        kind: "image",
        url: image.url,
        storageKey: `template-content-source/${payload.templateCode}/${payload.templateVersion}/${input.siteId}/${image.sortOrder}-${image.id}`,
        mimeType: "image/jpeg",
        sizeBytes: 0,
        alt: image.alt,
        metadata: {
          source: "template-content-source",
          templateCode: payload.templateCode,
          templateVersion: payload.templateVersion,
          templateImageId: image.id,
        },
      },
      select: { id: true },
    });

    await transaction.galleryImage.create({
      data: {
        albumId: album.id,
        assetId: asset.id,
        caption: image.caption,
        alt: image.alt,
        sortOrder: image.sortOrder,
        isFeatured: image.isFeatured,
      },
      select: { id: true },
    });
  }

  await transaction.sEOSettings.upsert({
    where: { siteId: input.siteId },
    create: {
      siteId: input.siteId,
      title: payload.seo.title,
      description: payload.seo.description,
      canonicalUrl: payload.seo.canonicalUrl,
      robotsIndex: payload.seo.robotsIndex,
      structuredDataOverrides: payload.seo.structuredDataOverrides,
    },
    update: {
      title: payload.seo.title,
      description: payload.seo.description,
      canonicalUrl: payload.seo.canonicalUrl,
      robotsIndex: payload.seo.robotsIndex,
      structuredDataOverrides: payload.seo.structuredDataOverrides,
      ogAssetId: null,
      deletedAt: null,
    },
    select: { id: true },
  });
}
