import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";

export const noirGoldTheme: ThemeDefinition = {
  code: "noir-gold",
  name: "كلاسك",
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
  name: "كلاسك",
  status: "published",
  showroomOrder: 1,
  description: "قالب كلاسيكي داكن بلمسة ذهبية، مناسب للمصورين الذين يريدون موقعًا فاخرًا وواضحًا للباقات والحجز."
};
