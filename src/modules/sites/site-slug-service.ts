import type { CurrentSession } from "@/modules/auth/current-session-service";
import {
  getSlugAvailabilityState,
  type SlugAvailabilityState
} from "@/modules/sites/slug-policy";

export type SiteSlugRepository = {
  isSlugUnavailable(slug: string, currentSiteId: string): Promise<boolean>;
  updateSiteSlug(input: {
    siteId: string;
    slug: string;
  }): Promise<boolean>;
};

export function createSiteSlugService({
  repository
}: {
  repository: SiteSlugRepository;
}) {
  return {
    async checkAvailability(
      input: string,
      currentSiteId: string
    ): Promise<SlugAvailabilityState> {
      const unavailableSlugs = new Set<string>();
      const preliminaryState = getSlugAvailabilityState(input, unavailableSlugs);

      if (!preliminaryState.ok) {
        return preliminaryState;
      }

      if (
        await repository.isSlugUnavailable(
          preliminaryState.normalizedSlug,
          currentSiteId
        )
      ) {
        return {
          ok: false,
          normalizedSlug: preliminaryState.normalizedSlug,
          reason: "taken"
        };
      }

      return preliminaryState;
    },
    async changeSlug({
      session,
      requestedSlug
    }: {
      session: CurrentSession;
      requestedSlug: string;
    }): Promise<{ slug: string }> {
      if (session.site.slugChangeUsed) {
        throw new Error("Site slug change was already used");
      }

      const availability = await this.checkAvailability(
        requestedSlug,
        session.site.id
      );

      if (!availability.ok) {
        throw new Error(`Site slug is not available: ${availability.reason}`);
      }

      const updated = await repository.updateSiteSlug({
        siteId: session.site.id,
        slug: availability.normalizedSlug
      });

      if (!updated) {
        throw new Error("Site slug change failed");
      }

      return {
        slug: availability.normalizedSlug
      };
    }
  };
}
