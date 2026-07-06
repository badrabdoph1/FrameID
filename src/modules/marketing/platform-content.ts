import type { TemplateSummary } from "@/modules/themes/theme-registry";

export const platformStats = [
  { label: "دقائق لإنشاء الموقع", value: "7" },
  { label: "ضغطات قبل أول رابط", value: "3" },
  { label: "تجربة مجانية", value: "14 يوم" }
];

export function getTemplatePreviewImage(template: TemplateSummary) {
  if (template.code === "noir-gold") {
    return "https://i.ibb.co/JwBLNkjP/Whats-App-Image-2026-06-04-at-2-30-53-AM-1.jpg";
  }

  return "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85";
}
