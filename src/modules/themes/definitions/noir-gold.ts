import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";

export const noirGoldTheme: ThemeDefinition = {
  code: "noir-gold",
  name: "قالب علي أحمد الفاخر",
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
  name: "قالب علي أحمد الفاخر",
  status: "published",
  showroomOrder: 1,
  description: "قالب داكن ذهبي مستوحى من باقات تصوير علي أحمد، جاهز للباقات والحجز."
};
