import { z } from "zod"

export const CtaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
}).passthrough()

export const HeroSchema = z.object({
  badge: z.string().min(1),
  headline: z.string().min(1),
  headlineHighlight: z.string(),
  subheadline: z.string().min(1),
  heroImage: z.string().url(),
  cta: CtaSchema,
  secondaryCta: CtaSchema,
  trustPoints: z.array(z.object({ text: z.string() }).passthrough()),
}).passthrough()

export const BenefitSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
}).passthrough()

export const HowItWorkSchema = z.object({
  step: z.number().int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
}).passthrough()

export const TemplateSectionSchema = z.object({
  badge: z.string(),
  title: z.string(),
  subtitle: z.string(),
}).passthrough()

export const TrustSectionSchema = z.object({
  badge: z.string(),
  title: z.string(),
  message: z.string(),
}).passthrough()

export const FinalCtaSchema = z.object({
  title: z.string(),
  subtext: z.string(),
  cta: CtaSchema,
}).passthrough()

export const MobileStickyCtaSchema = z.object({
  label: z.string(),
  buttonText: z.string(),
  href: z.string(),
}).passthrough()

export const PhotographerTypeSchema = z.object({
  label: z.string().min(1),
}).passthrough()

export const HomepageDataSchema = z.object({
  hero: HeroSchema,
  benefits: z.array(BenefitSchema),
  howItWorks: z.array(HowItWorkSchema),
  templateSection: TemplateSectionSchema,
  trustSection: TrustSectionSchema,
  finalCta: FinalCtaSchema,
  mobileStickyCta: MobileStickyCtaSchema,
  photographerTypes: z.array(PhotographerTypeSchema),
}).passthrough()

export const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
}).passthrough()

export const FaqDataSchema = z.object({
  sectionTitle: z.string(),
  items: z.array(FaqItemSchema),
}).passthrough()

export const NavLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
}).passthrough()

export const NavigationDataSchema = z.object({
  links: z.array(NavLinkSchema),
  cta: CtaSchema,
}).passthrough()

export const FooterDataSchema = z.object({
  description: z.string(),
  quickLinks: z.array(NavLinkSchema),
  cta: z.object({
    title: z.string(),
    subtitle: z.string(),
    label: z.string(),
    href: z.string(),
  }).passthrough(),
  copyright: z.string(),
}).passthrough()

export const MarketingSchemas = {
  "marketing/homepage": HomepageDataSchema,
  "marketing/faq": FaqDataSchema,
  "marketing/navigation": NavigationDataSchema,
  "marketing/footer": FooterDataSchema,
} as const
