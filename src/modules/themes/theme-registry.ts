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

export async function getPublishedTemplatesFromDb(): Promise<TemplateSummary[]> {
  let unifiedContent: Record<string, unknown> | null = null;
  try {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const raw = readFileSync(join(process.cwd(), "content", "templates", "unified-content.json"), "utf-8");
    const parsed = JSON.parse(raw);
    unifiedContent = parsed.data ?? null;
  } catch {
    // file not available, will fall back to definitions
  }

  try {
    const templates = await prisma.template.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        code: { not: TEMPLATE_STARTER_DEFAULTS_CODE },
      },
      orderBy: { showroomOrder: "asc" },
      select: {
        code: true,
        name: true,
        showroomOrder: true,
        previewData: true,
        theme: { select: { code: true } },
      },
    });

    const templateMap = new Map(
      templateDefinitions.map((t) => [t.code, t])
    );

    return templates.map((dbTemplate) => {
      const definition = templateMap.get(dbTemplate.code);
      const previewData = dbTemplate.previewData as Record<string, unknown> | null;
      const description =
        (typeof previewData?.description === "string" && previewData.description) ||
        (typeof unifiedContent?.description === "string" && (unifiedContent.description as string)) ||
        definition?.description ||
        "";

      return {
        code: dbTemplate.code,
        themeCode: dbTemplate.theme?.code || definition?.themeCode || "",
        name: dbTemplate.name || definition?.name || "",
        status: "published" as TemplateStatus,
        showroomOrder: dbTemplate.showroomOrder,
        description,
        starterContent: definition?.starterContent || ({} as TemplateStarterContent),
      };
    });
  } catch {
    return [];
  }
}
