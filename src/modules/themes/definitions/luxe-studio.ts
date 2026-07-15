import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";
import { PLATFORM_TEMPLATE_SECTION_TYPES } from "@/modules/themes/template-contract";
import { unifiedTemplateStarterContent } from "@/modules/themes/definitions/unified-starter-content";

export const luxeStudioTheme: ThemeDefinition = {
  code: "luxe-studio",
  name: "استوديو فاخر",
  version: "1.0.0",
  status: "published",
  supportedSections: [...PLATFORM_TEMPLATE_SECTION_TYPES],
  defaultConfig: { colorPreset: "charcoal", layoutDensity: "editorial", motion: "refined" }
};

export const luxeStudioTemplate: TemplateSummary = {
  code: "luxe-studio",
  themeCode: "luxe-studio",
  name: "استوديو فاخر",
  status: "published",
  showroomOrder: 3,
  description: "قالب عصري فاخر بخلفية داكنة ولمسات نيون أنيقة، مثالي للمصورين الذين يريدون موقعًا سينمائيًا مع تجربة حجز سلسة.",
  starterContent: {
    ...unifiedTemplateStarterContent,
    themeSettings: { colorPreset: "charcoal", layoutDensity: "editorial", motion: "refined" }
  }
};
