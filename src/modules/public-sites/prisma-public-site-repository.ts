import type { PublicSiteRecord } from "@/modules/public-sites/public-site-view-model";

type PrismaPublicSiteClient = {
  site: {
    findFirst(input: unknown): Promise<unknown>;
  };
};

type RawPublicSiteRecord = Omit<
  PublicSiteRecord,
  "sections" | "seoSettings" | "packages" | "gallery" | "extras" | "contactProfile"
> & {
  contactProfile:
    | (Omit<NonNullable<PublicSiteRecord["contactProfile"]>, "avatarUrl" | "coverUrl"> & {
        avatarAsset?: { url: string } | null;
        coverAsset?: { url: string } | null;
      })
    | null;
  sections: Array<{
    type: string;
    title: string | null;
    sortOrder: number;
    isVisible: boolean;
    data: unknown;
  }>;
  packages: Array<{
    id: string;
    name: string;
    subtitle: string | null;
    priceAmount: number;
    currency: string;
    features: unknown;
    isHighlighted: boolean;
  }>;
  extraServices: Array<{
    id: string;
    name: string;
    description: string | null;
    priceAmount: number;
    currency: string;
    iconKey: string | null;
  }>;
  galleryAlbums: Array<{
    images: Array<{
      id: string;
      caption: string | null;
      asset: {
        url: string;
        alt: string | null;
      };
    }>;
  }>;
  seoSettings:
    | (Omit<NonNullable<PublicSiteRecord["seoSettings"]>, "ogImageUrl"> & {
        ogAsset?: { url: string } | null;
      })
    | null;
};

export type PublicSiteRepository = {
  findBySlug(slug: string): Promise<PublicSiteRecord | null>;
};

export function createPrismaPublicSiteRepository(
  prisma: PrismaPublicSiteClient,
): PublicSiteRepository {
  return {
    async findBySlug(slug) {
      const site = (await prisma.site.findFirst({
        where: {
          slug,
          deletedAt: null,
          isPublished: true,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          status: true,
          isPublished: true,
          theme: { select: { code: true, name: true } },
          tenant: { select: { displayName: true } },
          contactProfile: {
            select: {
              studioName: true,
              bio: true,
              longDescription: true,
              phone: true,
              whatsapp: true,
              email: true,
              instagram: true,
              facebook: true,
              avatarAsset: { select: { url: true } },
              coverAsset: { select: { url: true } },
            },
          },
          sections: {
            where: { deletedAt: null, isVisible: true },
            orderBy: { sortOrder: "asc" },
            select: {
              type: true,
              title: true,
              sortOrder: true,
              isVisible: true,
              data: true,
            },
          },
          packages: {
            where: { deletedAt: null, isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              subtitle: true,
              priceAmount: true,
              currency: true,
              features: true,
              isHighlighted: true,
            },
          },
          extraServices: {
            where: { deletedAt: null, isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              priceAmount: true,
              currency: true,
              iconKey: true,
            },
          },
          galleryAlbums: {
            where: { deletedAt: null, isVisible: true },
            orderBy: { sortOrder: "asc" },
            select: {
              images: {
                where: { deletedAt: null, asset: { deletedAt: null } },
                orderBy: { sortOrder: "asc" },
                take: 24,
                select: {
                  id: true,
                  caption: true,
                  asset: { select: { url: true, alt: true } },
                },
              },
            },
          },
          seoSettings: {
            select: {
              title: true,
              description: true,
              canonicalUrl: true,
              robotsIndex: true,
              structuredDataOverrides: true,
              ogAsset: { select: { url: true } },
            },
          },
        },
      })) as RawPublicSiteRecord | null;

      if (!site) return null;

      return {
        ...site,
        sections: site.sections.map((section) => ({
          ...section,
          data:
            typeof section.data === "object" && section.data !== null
              ? (section.data as Record<string, unknown>)
              : {},
        })),
        packages: site.packages.map((item) => ({ ...item, imageUrl: null })),
        extras: site.extraServices,
        contactProfile: site.contactProfile
          ? {
              studioName: site.contactProfile.studioName,
              bio: site.contactProfile.bio,
              longDescription: site.contactProfile.longDescription,
              phone: site.contactProfile.phone,
              whatsapp: site.contactProfile.whatsapp,
              email: site.contactProfile.email,
              instagram: site.contactProfile.instagram,
              facebook: site.contactProfile.facebook,
              avatarUrl: site.contactProfile.avatarAsset?.url ?? null,
              coverUrl: site.contactProfile.coverAsset?.url ?? null,
            }
          : null,
        gallery: site.galleryAlbums.flatMap((album) =>
          album.images.map((image) => ({
            id: image.id,
            url: image.asset.url,
            alt: image.asset.alt,
            caption: image.caption,
          })),
        ),
        seoSettings: site.seoSettings
          ? {
              title: site.seoSettings.title,
              description: site.seoSettings.description,
              canonicalUrl: site.seoSettings.canonicalUrl,
              robotsIndex: site.seoSettings.robotsIndex,
              structuredDataOverrides: site.seoSettings.structuredDataOverrides,
              ogImageUrl: site.seoSettings.ogAsset?.url ?? null,
            }
          : null,
      };
    },
  };
}
