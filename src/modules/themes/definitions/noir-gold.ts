import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";

export const noirGoldTheme: ThemeDefinition = {
  code: "noir-gold",
  name: "Body Studio | تميز",
  version: "1.0.0",
  status: "published",
  supportedSections: ["hero", "gallery", "packages", "extras", "contact"],
  defaultConfig: {
    colorPreset: "champagne",
    layoutDensity: "editorial",
    motion: "quiet"
  }
};

export const noirGoldTemplate: TemplateSummary = {
  code: "noir-gold",
  themeCode: "noir-gold",
  name: "Body Studio | تميز",
  status: "published",
  showroomOrder: 1,
  description: "قالب داكن ذهبي فاخر مثالي لاستعراض خدمات التصوير والباقات، بتصميم أنيق وأجواء سينمائية."
};
