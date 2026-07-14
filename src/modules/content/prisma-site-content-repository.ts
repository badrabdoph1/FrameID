import type { SiteContentRepository } from "@/modules/content/site-content-service";

type PrismaSiteContentClient = {
  site: {
    findUnique(input: unknown): Promise<unknown>;
    update(input: unknown): Promise<unknown>;
  };
  siteSection: {
    findFirst(input: unknown): Promise<{ id: string } | null>;
    update(input: unknown): Promise<{ id: string }>;
    create(input: unknown): Promise<{ id: string }>;
  };
};

export function createPrismaSiteContentRepository(
  prisma: PrismaSiteContentClient
): SiteContentRepository {
  return {
    async findEditorContent(siteId) {
      const site = await prisma.site.findUnique({
        where: {
          id: siteId
        },
        select: {
          title: true,
          description: true,
          sections: {
            where: {
              type: {
                in: ["hero", "gallery", "packages", "extras", "contact"]
              },
              deletedAt: null
            },
            select: {
              type: true,
              title: true,
              sortOrder: true,
              isVisible: true,
              data: true
            }
          }
        }
      });

      if (!isEditorContentRecord(site)) {
        return null;
      }

      return site;
    },
    async updateSiteBasics(input) {
      await prisma.site.update({
        where: {
          id: input.siteId
        },
        data: {
          title: input.title,
          description: input.description
        }
      });
    },
    async upsertSection(input) {
      const existing = await prisma.siteSection.findFirst({
        where: {
          siteId: input.siteId,
          type: input.type,
          deletedAt: null
        },
        select: {
          id: true
        }
      });

      if (existing) {
        return prisma.siteSection.update({
          where: {
            id: existing.id
          },
          data: {
            type: input.type,
            title: input.title,
            sortOrder: input.sortOrder,
            data: input.data,
            isVisible: input.isVisible
          },
          select: {
            id: true
          }
        });
      }

      return prisma.siteSection.create({
        data: {
          siteId: input.siteId,
          type: input.type,
          title: input.title,
          sortOrder: input.sortOrder,
          data: input.data,
          isVisible: input.isVisible
        },
        select: {
          id: true
        }
      });
    }
  };
}

function isEditorContentRecord(value: unknown): value is {
  title: string;
  description: string | null;
  sections: Array<{
    type: string;
    title: string | null;
    sortOrder: number;
    isVisible: boolean;
    data: Record<string, unknown>;
  }>;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as {
    title?: unknown;
    description?: unknown;
    sections?: unknown;
  };

  return (
    typeof record.title === "string" &&
    (record.description === null || typeof record.description === "string") &&
    Array.isArray(record.sections) &&
    record.sections.every(
      (section) =>
        section &&
        typeof section === "object" &&
        typeof (section as { type?: unknown }).type === "string" &&
        ((section as { title?: unknown }).title === null ||
          typeof (section as { title?: unknown }).title === "string") &&
        typeof (section as { sortOrder?: unknown }).sortOrder === "number" &&
        typeof (section as { isVisible?: unknown }).isVisible === "boolean" &&
        isRecord((section as { data?: unknown }).data)
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
