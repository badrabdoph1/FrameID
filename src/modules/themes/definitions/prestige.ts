import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";
import { PLATFORM_TEMPLATE_SECTION_TYPES } from "@/modules/themes/template-contract";
import { unifiedTemplateStarterContent } from "@/modules/themes/definitions/unified-starter-content";

export const prestigeTheme: ThemeDefinition = {
  code: "prestige",
  name: "الرّاقى",
  version: "1.0.0",
  status: "published",
  supportedSections: [...PLATFORM_TEMPLATE_SECTION_TYPES],
  defaultConfig: { colorPreset: "prestige", layoutDensity: "luxury", motion: "smooth" }
};

export const prestigeTemplate: TemplateSummary = {
  code: "prestige",
  themeCode: "prestige",
  name: "الرّاقى",
  status: "published",
  showroomOrder: 0,
  description: "قالب فاخر بتأثيرات بصرية مبهرة وتجربة مستخدم استثنائية. مثالي للمصورين المحترفين اللي عايزين موقع يعكس الفخامة والاحترافية.",
  starterContent: {
    ...unifiedTemplateStarterContent,
    themeSettings: { colorPreset: "prestige", layoutDensity: "luxury", motion: "smooth" }
  }
};
