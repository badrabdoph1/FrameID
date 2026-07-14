import { z } from "zod";

import type { PlatformPageSection } from "@/modules/platform-pages/page-document";

const CtaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1).refine((value) => !value.trim().toLowerCase().startsWith("javascript:"), "رابط الزر غير آمن"),
  icon: z.enum(["arrow", "external", "none"]).optional(),
  style: z.enum(["primary", "secondary", "quiet"]).optional(),
});

export const HomeImageReferenceSchema = z.union([
  z.string().url(),
  z.object({
    assetId: z.string().min(1),
    url: z.string().min(1),
    alt: z.string().optional(),
    focusX: z.number().min(0).max(1),
    focusY: z.number().min(0).max(1),
    zoom: z.number().min(1).max(3),
  }),
]);

export const HomeHeroContentSchema = z.object({
  badge: z.string(),
  headline: z.string().min(1),
  headlineHighlight: z.string(),
  subheadline: z.string().min(1),
  heroImage: HomeImageReferenceSchema,
  cta: CtaSchema,
  secondaryCta: CtaSchema,
  trustPoints: z.array(z.object({ text: z.string() })),
});

export const HomeTemplatesContentSchema = z.object({
  badge: z.string(),
  title: z.string().min(1),
  subtitle: z.string(),
});

export const HomeBenefitsContentSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string(),
  items: z.array(z.object({ title: z.string().min(1), body: z.string().min(1) })),
});

export const HomeJourneyContentSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string(),
  items: z.array(
    z.object({
      step: z.number().int().positive().optional(),
      title: z.string().min(1),
      body: z.string().min(1),
      href: z.string().min(1).optional(),
      icon: z.enum(["arrow", "external", "none"]).optional(),
      style: z.enum(["primary", "secondary", "quiet"]).optional(),
    }),
  ),
});

export const HomeFaqContentSchema = z.object({
  badge: z.string(),
  title: z.string().min(1),
  message: z.string().optional(),
  sectionTitle: z.string().optional(),
  items: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
});

export const HomeFinalCtaContentSchema = z.object({
  title: z.string().min(1),
  subtext: z.string(),
  cta: CtaSchema,
  mobile: z.object({
    label: z.string(),
    buttonText: z.string(),
    href: z.string().min(1),
  }),
});

export type HomeHeroContent = z.infer<typeof HomeHeroContentSchema>;
export type HomeImageReference = z.infer<typeof HomeImageReferenceSchema>;
export type HomeTemplatesContent = z.infer<typeof HomeTemplatesContentSchema>;
export type HomeBenefitsContent = z.infer<typeof HomeBenefitsContentSchema>;
export type HomeJourneyContent = z.infer<typeof HomeJourneyContentSchema>;
export type HomeFaqContent = z.infer<typeof HomeFaqContentSchema>;
export type HomeFinalCtaContent = z.infer<typeof HomeFinalCtaContentSchema>;

export function parseHomeSectionContent(section: PlatformPageSection) {
  switch (section.type) {
    case "home.hero":
      return { type: section.type, content: HomeHeroContentSchema.parse(section.content) } as const;
    case "home.templates":
      return { type: section.type, content: HomeTemplatesContentSchema.parse(section.content) } as const;
    case "home.benefits":
      return { type: section.type, content: HomeBenefitsContentSchema.parse(section.content) } as const;
    case "home.journey":
      return { type: section.type, content: HomeJourneyContentSchema.parse(section.content) } as const;
    case "home.faq":
      return { type: section.type, content: HomeFaqContentSchema.parse(section.content) } as const;
    case "home.final-cta":
      return { type: section.type, content: HomeFinalCtaContentSchema.parse(section.content) } as const;
    default:
      throw new Error(`قسم رئيسي غير مدعوم: ${section.type}`);
  }
}
