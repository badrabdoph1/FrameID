import type { PublicSiteRecord } from "@/modules/public-sites/public-site-view-model";

type PrismaPublicSiteClient = {
  site: {
    findFirst(input: unknown): Promise<unknown>;
  };
};

type RawPublicSiteRecord = Omit<
  PublicSiteRecord,
  "sections" | "seoSettings" | "packages" | "gallery" | "contactProfile"
> & {
  contact: PublicSiteRecord["contactProfile"];
  sections: Array<{
    type: string;
    title: string | null;
    sortOrder: number;
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
    imageAsset: {
      url: string;
    } | null;
  }>;
  albums: Array<{
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
        ogAsset?: {
          url: string;
        } | null;
      })
    | null;
};

export type PublicSiteRepository = {
  findBySlug(slug: string): Promise<PublicSiteRecord | null>;
};

export function createPrismaPublicSiteRepository(
  prisma: PrismaPublicSiteClient
): PublicSiteRepository {
  return {
    async findBySlug(slug) {
      const site = (await prisma.site.findFirst({
        where: {
          slug,
          deletedAt: null,
          isPublished: true
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          status: true,
          isPublished: true,
          theme: {
            select: {
              code: true,
              name: true
            }
          },
          tenant: {
            select: {
              displayName: true
            }
          },
          contact: {
            select: {
              phone: true,
              whatsapp: true,
              email: true,
              instagram: true,
              facebook: true
            }
          },
          sections: {
            where: {
              deletedAt: null,
              isVisible: true
            },
            orderBy: {
              sortOrder: "asc"
            },
            select: {
              type: true,
              title: true,
              sortOrder: true,
              data: true
            }
          },
          packages: {
            where: {
              deletedAt: null,
              isActive: true
            },
            orderBy: {
              sortOrder: "asc"
            },
            select: {
              id: true,
              name: true,
              subtitle: true,
              priceAmount: true,
              currency: true,
              features: true,
              isHighlighted: true,
              imageAsset: {
                select: {
                  url: true
                }
              }
            }
          },
          extras: {
            where: {
              deletedAt: null,
              isActive: true
            },
            orderBy: {
              sortOrder: "asc"
            },
            select: {
              id: true,
              name: true,
              priceAmount: true,
              currency: true,
              iconKey: true
            }
          },
          albums: {
            where: {
              deletedAt: null,
              isVisible: true
            },
            orderBy: {
              sortOrder: "asc"
            },
            select: {
              images: {
                where: {
                  deletedAt: null,
                  asset: {
                    deletedAt: null
                  }
                },
                orderBy: {
                  sortOrder: "asc"
                },
                take: 24,
                select: {
                  id: true,
                  caption: true,
                  asset: {
                    select: {
                      url: true,
                      alt: true
                    }
                  }
                }
              }
            }
          },
          seoSettings: {
            select: {
              title: true,
              description: true,
              canonicalUrl: true,
              robotsIndex: true,
              structuredDataOverrides: true,
              ogAsset: {
                select: {
                  url: true
                }
              }
            }
          }
        }
      })) as RawPublicSiteRecord | null;

      if (!site) {
        return null;
      }

      return {
        ...site,
        sections: site.sections.map((section) => ({
          ...section,
          data:
            typeof section.data === "object" && section.data !== null
              ? (section.data as Record<string, unknown>)
              : {}
        })),
        packages: site.packages.map((item) => ({
          ...item,
          imageUrl: item.imageAsset?.url ?? null
        })),
        contactProfile: site.contact,
        gallery: site.albums.flatMap((album) =>
          album.images.map((image) => ({
            id: image.id,
            url: image.asset.url,
            alt: image.asset.alt,
            caption: image.caption
          }))
        ),
        seoSettings: site.seoSettings
          ? {
              title: site.seoSettings.title,
              description: site.seoSettings.description,
              canonicalUrl: site.seoSettings.canonicalUrl,
              robotsIndex: site.seoSettings.robotsIndex,
              structuredDataOverrides: site.seoSettings.structuredDataOverrides,
              ogImageUrl: site.seoSettings.ogAsset?.url ?? null
            }
          : null
      };
    }
  };
}
