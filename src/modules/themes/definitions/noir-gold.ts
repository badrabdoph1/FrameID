import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";
import { PLATFORM_TEMPLATE_SECTION_TYPES } from "@/modules/themes/template-contract";
import { unifiedTemplateStarterContent } from "@/modules/themes/definitions/unified-starter-content";

export const noirGoldTheme: ThemeDefinition = {
  code: "noir-gold",
  name: "كلاسك",
  version: "1.0.0",
  status: "published",
  supportedSections: [...PLATFORM_TEMPLATE_SECTION_TYPES],
  defaultConfig: { colorPreset: "champagne", layoutDensity: "editorial", motion: "quiet" }
};

export const noirGoldTemplate: TemplateSummary = {
  code: "noir-gold",
  themeCode: "noir-gold",
  name: "كلاسك",
  status: "published",
  showroomOrder: 1,
  description: "قالب كلاسيكي داكن بلمسة ذهبية، مناسب للمصورين الذين يريدون موقعًا فاخرًا وواضحًا للباقات والحجز.",
  starterContent: {
    ...unifiedTemplateStarterContent,
    themeSettings: { colorPreset: "champagne", layoutDensity: "editorial", motion: "quiet" }
  }
};
