import type { CurrentSession } from "@/modules/auth/current-session-service";

export type SiteContentRepository = {
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
