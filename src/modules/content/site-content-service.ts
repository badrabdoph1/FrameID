import type { CurrentSession } from "@/modules/auth/current-session-service";
import {
  isTemplateSectionType,
  normalizeTemplateSections,
  type TemplateSectionType,
} from "@/modules/themes/template-contract";
import { logCustomerDataChange } from "@/modules/backups/customer-data-change-service";

export type EditorSection = {
  type: TemplateSectionType;
  title: string;
  sortOrder: number;
  isVisible: boolean;
  data: Record<string, unknown>;
};

export type SiteContentRepository = {
  findEditorContent(siteId: string): Promise<{
    title: string;
    description: string | null;
    sections: Array<{
      type: string;
      title: string | null;
      sortOrder: number;
      isVisible: boolean;
      data: Record<string, unknown>;
    }>;
  } | null>;
  upsertSection(input: {
    siteId: string;
    type: TemplateSectionType;
    title: string;
    sortOrder: number;
    isVisible: boolean;
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
  async function getEditorContent(input: { session: CurrentSession }) {
    const content = await repository.findEditorContent(input.session.site.id);
    const rawSections = content?.sections ?? [];
    const normalized = normalizeTemplateSections(rawSections);
    const rawByType = new Map(
      rawSections
        .filter((section) => isTemplateSectionType(section.type))
        .map((section) => [section.type as TemplateSectionType, section]),
    );
    const sections: EditorSection[] = normalized.orderedSections.map((section) => {
      const raw = rawByType.get(section.type);
      return {
        type: section.type,
        title: section.title,
        sortOrder: section.sortOrder,
        isVisible: section.isVisible,
        data: {
          ...(raw?.data ?? {}),
          ...(section.description ? { description: section.description } : {}),
          settings: section.settings,
        },
      };
    });
    const heroSection = sections.find((section) => section.type === "hero");
    const contactSection = sections.find((section) => section.type === "contact");

    return {
      title: content?.title ?? input.session.site.title,
      description: content?.description ?? "",
      sections,
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
  }

  async function updateSection(input: {
    session: CurrentSession;
    type: TemplateSectionType;
    title: string;
    sortOrder: number;
    isVisible: boolean;
    data: Record<string, unknown>;
  }): Promise<{ sectionId: string }> {
    if (!isTemplateSectionType(input.type)) {
      throw new Error("Unsupported template section type");
    }
    const title = input.title.trim();
    if (!title) throw new Error("Section title is required");
    if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
      throw new Error("Section sort order must be a non-negative integer");
    }

    const content = await repository.findEditorContent(input.session.site.id);
    const existing = content?.sections.find((section) => section.type === input.type);
    const data = mergeRecords(existing?.data ?? {}, input.data);

    if (input.type === "hero") {
      const headline = readString(data.headline, "").trim();
      if (!headline) throw new Error("Hero headline is required");
      const subheadline = readString(data.subheadline, "").trim();
      await repository.updateSiteBasics({
        siteId: input.session.site.id,
        title: headline,
        description: subheadline || undefined,
      });
    }

    if (input.type === "contact" && !readString(data.callToAction, "").trim()) {
      throw new Error("Contact call to action is required");
    }

    const section = await repository.upsertSection({
      siteId: input.session.site.id,
      type: input.type,
      title,
      sortOrder: input.sortOrder,
      isVisible: input.isVisible,
      data,
    });

    logCustomerDataChange({
      entityType: "SiteSection",
      entityId: section.id,
      tenantId: input.session.tenant.id,
      siteId: input.session.site.id,
      userId: input.session.user.id,
      action: `update_section_${input.type}`,
      before: existing ? { type: existing.type, data: existing.data } : null,
      after: { type: input.type, data },
      changedBy: input.session.user.id,
      changedByName: input.session.user.name ?? null,
    }).catch(() => undefined);

    return { sectionId: section.id };
  }

  return {
    getEditorContent,
    updateSection,
    async updateHero(input: {
      session: CurrentSession;
      headline: string;
      subheadline: string;
      imageUrl?: string;
    }): Promise<{ sectionId: string }> {
      return updateSection({
        session: input.session,
        type: "hero",
        title: "الرئيسية",
        sortOrder: 0,
        isVisible: true,
        data: {
          headline: input.headline.trim(),
          subheadline: input.subheadline.trim(),
          imageUrl: input.imageUrl?.trim() || undefined,
        },
      });
    },
    async updateContact(input: {
      session: CurrentSession;
      callToAction: string;
    }): Promise<{ sectionId: string }> {
      return updateSection({
        session: input.session,
        type: "contact",
        title: "التواصل",
        sortOrder: 4,
        isVisible: true,
        data: { callToAction: input.callToAction.trim() },
      });
    }
  };
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function mergeRecords(
  current: Record<string, unknown>,
  update: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(update)) {
    if (isRecord(value) && isRecord(current[key])) {
      merged[key] = mergeRecords(current[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
