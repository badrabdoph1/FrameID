import {
  templateDefinitions,
  themeDefinitions
} from "@/modules/themes/definitions";
import type { TemplateStarterContent } from "@/modules/themes/template-starter-content";

export type TemplateStatus = "draft" | "published" | "archived";

export type ThemeStatus = TemplateStatus;

export type ThemeDefinition = {
  code: string;
  name: string;
  version: string;
  status: ThemeStatus;
  supportedSections: string[];
  defaultConfig: Record<string, unknown>;
};

export type TemplateSummary = {
  code: string;
  themeCode: string;
  name: string;
  status: TemplateStatus;
  showroomOrder: number;
  description: string;
  starterContent?: TemplateStarterContent;
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

export function createThemeRegistry(input: ThemeRegistryInput): ThemeRegistry {
  assertUniqueCodes(input.themes, "theme");
  assertUniqueCodes(input.templates, "template");
  assertTemplateThemesExist(input.themes, input.templates);

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
