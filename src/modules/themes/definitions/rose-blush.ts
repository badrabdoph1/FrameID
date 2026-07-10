import type { TemplateSummary, ThemeDefinition } from "@/modules/themes/theme-registry";

export const roseBlushTheme: ThemeDefinition = {
  code: "rose-blush",
  name: "أنيق وهادئ",
  version: "1.0.0",
  status: "published",
  supportedSections: ["hero", "gallery", "packages", "extras", "contact"],
  defaultConfig: {
    colorPreset: "rose",
    layoutDensity: "spacious",
    motion: "gentle"
  }
};

export const roseBlushTemplate: TemplateSummary = {
  code: "rose-blush",
  themeCode: "rose-blush",
  name: "أنيق وهادئ",
  status: "published",
  showroomOrder: 2,
  description: "قالب فاتح أنيق بألوان الورد والمريمية، مثالي للمصورين الذين يفضلون التصميم الناعم العصري."
};
