import type { CurrentSession } from "@/modules/auth/current-session-service";

export type SiteContentRepository = {
  findEditorContent(siteId: string): Promise<{
    title: string;
    description: string | null;
    sections: Array<{
      type: string;
      data: Record<string, unknown>;
    }>;
  } | null>;
  upsertSection(input: {
    siteId: string;
    type: "hero" | "contact";
    title: string;
    sortOrder: number;
    data: Record<string, unknown>;
  }): Promise<{ id: string }>;
  updateSiteBasics(input: {
    siteId: string;
    title: string;
    description?: string;
  }): Promise<void>;
};

export function createSiteContentService({
  repository
}: {
  repository: SiteContentRepository;
}) {
  return {
    async getEditorContent(input: { session: CurrentSession }): Promise<{
      hero: {
        headline: string;
        subheadline: string;
        imageUrl: string;
      };
      contact: {
        callToAction: string;
      };
    }> {
      const content = await repository.findEditorContent(input.session.site.id);
      const heroSection = content?.sections.find((section) => section.type === "hero");
      const contactSection = content?.sections.find(
        (section) => section.type === "contact"
      );

      return {
        hero: {
          headline: readString(
            heroSection?.data.headline,
            content?.title ?? input.session.site.title
          ),
          subheadline: readString(heroSection?.data.subheadline, content?.description ?? ""),
          imageUrl: readString(heroSection?.data.imageUrl, "")
        },
        contact: {
          callToAction: readString(
            contactSection?.data.callToAction,
            "احجز جلستك الآن"
          )
        }
      };
    },
    async updateHero(input: {
      session: CurrentSession;
      headline: string;
      subheadline: string;
      imageUrl?: string;
    }): Promise<{ sectionId: string }> {
      const headline = input.headline.trim();
      const subheadline = input.subheadline.trim();

      if (!headline) {
        throw new Error("Hero headline is required");
      }

      await repository.updateSiteBasics({
        siteId: input.session.site.id,
        title: headline,
        description: subheadline || undefined
      });

      const section = await repository.upsertSection({
        siteId: input.session.site.id,
        type: "hero",
        title: "الرئيسية",
        sortOrder: 0,
        data: {
          headline,
          subheadline,
          imageUrl: input.imageUrl?.trim() || undefined
        }
      });

      return {
        sectionId: section.id
      };
    },
    async updateContact(input: {
      session: CurrentSession;
      callToAction: string;
    }): Promise<{ sectionId: string }> {
      const callToAction = input.callToAction.trim();

      if (!callToAction) {
        throw new Error("Contact call to action is required");
      }

      const section = await repository.upsertSection({
        siteId: input.session.site.id,
        type: "contact",
        title: "التواصل",
        sortOrder: 10,
        data: {
          callToAction
        }
      });

      return {
        sectionId: section.id
      };
    }
  };
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}
