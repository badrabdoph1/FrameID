import {
  templateDefinitions,
  themeDefinitions
} from "@/modules/themes/definitions";
import type { TemplateStarterContent } from "@/modules/themes/template-starter-content";
import {
  PLATFORM_TEMPLATE_SECTION_TYPES,
  type TemplateSectionType,
} from "@/modules/themes/template-contract";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_STARTER_DEFAULTS_CODE } from "@/modules/themes/template-starter-defaults";

export type TemplateStatus = "draft" | "published" | "archived";

export type ThemeStatus = TemplateStatus;

export type ThemeDefinition = {
  code: string;
  name: string;
  version: string;
  status: ThemeStatus;
  supportedSections: TemplateSectionType[];
  defaultConfig: Record<string, unknown>;
};

export type TemplateSummary = {
  code: string;
  themeCode: string;
  name: string;
  status: TemplateStatus;
  showroomOrder: number;
  description: string;
  starterContent: TemplateStarterContent;
};

export type ThemeRegistryInput = {
  themes: ThemeDefinition[];
  templates: TemplateSummary[];
};

export type ThemeRegistry = {
  getTheme(code: string): ThemeDefinition | undefined;
  getTemplate(code: string): TemplateSummary | undefined;
  getPublishedTemplates(): TemplateSummary[];
};

function assertUniqueCodes<T extends { code: string }>(
  items: T[],
  label: "theme" | "template"
) {
  const seenCodes = new Set<string>();

  for (const item of items) {
    if (seenCodes.has(item.code)) {
      throw new Error(`Duplicate ${label} code: ${item.code}`);
    }

    seenCodes.add(item.code);
  }
}

function assertTemplateThemesExist(
  themeItems: ThemeDefinition[],
  templateItems: TemplateSummary[]
) {
  const themeCodes = new Set(themeItems.map((theme) => theme.code));

  for (const template of templateItems) {
    if (!themeCodes.has(template.themeCode)) {
      throw new Error(
        `Template ${template.code} references missing theme ${template.themeCode}`
      );
    }
  }
}

function assertTemplatesHaveStarterContent(templateItems: TemplateSummary[]) {
  for (const template of templateItems) {
    if (!template.starterContent) {
      throw new Error(`Template ${template.code} is missing starter content`);
    }
  }
}

function assertThemesImplementPlatformContract(themeItems: ThemeDefinition[]) {
  const required = PLATFORM_TEMPLATE_SECTION_TYPES.join(",");
  for (const theme of themeItems) {
    if (theme.supportedSections.join(",") !== required) {
      throw new Error(`Theme ${theme.code} must implement the complete platform template contract`);
    }
  }
}

export function createThemeRegistry(input: ThemeRegistryInput): ThemeRegistry {
  assertUniqueCodes(input.themes, "theme");
  assertUniqueCodes(input.templates, "template");
  assertTemplateThemesExist(input.themes, input.templates);
  assertTemplatesHaveStarterContent(input.templates);
  assertThemesImplementPlatformContract(input.themes);

  const themeMap = new Map(input.themes.map((theme) => [theme.code, theme]));
  const templateMap = new Map(
    input.templates.map((template) => [template.code, template])
  );

  return {
    getTheme(code) {
      return themeMap.get(code);
    },
    getTemplate(code) {
      return templateMap.get(code);
    },
    getPublishedTemplates() {
      return [...input.templates]
        .filter((template) => template.status === "published")
        .sort((a, b) => a.showroomOrder - b.showroomOrder);
    }
  };
}

export const themeRegistry = createThemeRegistry({
  themes: themeDefinitions,
  templates: templateDefinitions
});

export function getPublishedTemplates(): TemplateSummary[] {
  return themeRegistry.getPublishedTemplates();
}

export function getTemplateByCode(code: string): TemplateSummary | undefined {
  return themeRegistry.getTemplate(code);
}

/**
 * Helper: reads unified-content.json directly from disk.
 * This is the SINGLE SOURCE OF TRUTH for shared content.
 */
async function readUnifiedContent(): Promise<Record<string, unknown> | null> {
  try {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const raw = readFileSync(join(process.cwd(), "content", "templates", "unified-content.json"), "utf-8");
    const parsed = JSON.parse(raw);
    return (parsed.data as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

export async function getPublishedTemplatesFromDb(): Promise<TemplateSummary[]> {
  const unifiedContent = await readUnifiedContent();

  const templateMap = new Map(
    templateDefinitions.map((t) => [t.code, t])
  );

  // Read all non-deleted templates from DB
  // We use status: { in: ["PUBLISHED", "DRAFT", "ARCHIVED", "HIDDEN", "COMING_SOON"] }
  // but we only return PUBLISHED ones for the public page
  // Actually, let's just read all and filter
  let dbTemplates: Array<{
    code: string;
    name: string;
    status: string;
    showroomOrder: number;
    previewData: unknown;
    theme: { code: string } | null;
  }> = [];

  try {
    dbTemplates = await prisma.template.findMany({
      where: {
        deletedAt: null,
        code: { not: TEMPLATE_STARTER_DEFAULTS_CODE },
      },
      orderBy: { showroomOrder: "asc" },
      select: {
        code: true,
        name: true,
        status: true,
        showroomOrder: true,
        previewData: true,
        theme: { select: { code: true } },
      },
    });
  } catch {
    // DB not available, fall back to definitions
    dbTemplates = [];
  }

  // Filter to only PUBLISHED templates for public page
  const publishedDb = dbTemplates.filter((t) => t.status === "PUBLISHED");

  // Build the result by merging DB metadata with unified content
  return publishedDb.map((dbTemplate) => {
    const definition = templateMap.get(dbTemplate.code);
    const previewData = dbTemplate.previewData as Record<string, unknown> | null;

    // Description priority:
    // 1. DB previewData.description (template-specific override)
    // 2. unified-content.json description (shared content)
    // 3. definition description (hardcoded fallback)
    const description =
      (typeof previewData?.description === "string" && previewData.description) ||
      (typeof unifiedContent?.description === "string" && (unifiedContent.description as string)) ||
      definition?.description ||
      "";

    // Name priority:
    // 1. DB name
    // 2. unified-content studioName (if name is empty)
    // 3. definition name
    const name =
      dbTemplate.name ||
      (typeof unifiedContent?.studioName === "string" && (unifiedContent.studioName as string)) ||
      definition?.name ||
      "";

    return {
      code: dbTemplate.code,
      themeCode: dbTemplate.theme?.code || definition?.themeCode || "",
      name,
      status: "published" as TemplateStatus,
      showroomOrder: dbTemplate.showroomOrder,
      description,
      starterContent: definition?.starterContent || ({} as TemplateStarterContent),
    };
  });
}

export async function getUnifiedContent(): Promise<Record<string, unknown> | null> {
  return readUnifiedContent();
}
