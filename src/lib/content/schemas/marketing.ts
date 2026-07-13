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

// Templates page schema
export const FilterCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
}).passthrough()

export const TemplateItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  previewImage: z.string().url(),
  tags: z.array(z.string()),
}).passthrough()

export const TemplatesGridSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  templates: z.array(TemplateItemSchema),
}).passthrough()

export const TemplatesPageSchema = z.object({
  hero: HeroSchema,
  filters: z.object({
    title: z.string(),
    categories: z.array(FilterCategorySchema),
  }),
  templatesGrid: TemplatesGridSchema,
  finalCta: FinalCtaSchema,
}).passthrough()

// Pricing page schema
export const PlanFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  period: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  highlighted: z.boolean(),
  cta: CtaSchema,
}).passthrough()

export const PricingFaqSchema = z.object({
  title: z.string(),
  items: z.array(FaqItemSchema),
}).passthrough()

export const PricingPageSchema = z.object({
  hero: HeroSchema,
  plans: z.array(PlanFeatureSchema),
  faq: PricingFaqSchema,
  finalCta: FinalCtaSchema,
}).passthrough()

// Auth pages schema
export const AuthFormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "email", "password", "tel", "url"]),
  placeholder: z.string().optional(),
  required: z.boolean(),
  validation: z.string().optional(),
}).passthrough()

export const AuthPageSchema = z.object({
  hero: z.object({
    badge: z.string(),
    headline: z.string(),
    subheadline: z.string(),
    heroImage: z.string().url(),
    illustration: z.string().url().optional(),
  }),
  form: z.object({
    title: z.string(),
    subtitle: z.string(),
    fields: z.array(AuthFormFieldSchema),
    submitButton: z.object({
      label: z.string(),
      loadingLabel: z.string(),
    }),
    footerLinks: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
  }),
  benefits: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })).optional(),
  helpSection: z.object({
    title: z.string(),
    items: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
  }).optional(),
  footer: z.object({
    copyright: z.string(),
    links: z.array(NavLinkSchema),
  }).optional(),
}).passthrough()

// Checkout page schema
export const CheckoutPageSchema = z.object({
  hero: z.object({
    badge: z.string(),
    headline: z.string(),
    subheadline: z.string(),
  }),
  orderSummary: z.object({
    title: z.string(),
    planName: z.string(),
    planPrice: z.number(),
    currency: z.string(),
    period: z.string(),
    features: z.array(z.string()),
  }),
  paymentForm: z.object({
    title: z.string(),
    subtitle: z.string(),
    methods: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      icon: z.string(),
    })),
    formFields: z.array(AuthFormFieldSchema),
    submitButton: z.object({
      label: z.string(),
      loadingLabel: z.string(),
    }),
    securityNote: z.string(),
  }),
  trustIndicators: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })),
}).passthrough()

// Success/Error pages schema
export const ResultPageSchema = z.object({
  hero: z.object({
    badge: z.string(),
    headline: z.string(),
    subheadline: z.string(),
    icon: z.string(),
    iconColor: z.string(),
  }),
  details: z.object({
    title: z.string(),
    items: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })),
  }).optional(),
  actions: z.array(z.object({
    label: z.string(),
    href: z.string(),
    variant: z.enum(["primary", "secondary", "outline"]),
  })),
  helpSection: z.object({
    title: z.string(),
    items: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
  }).optional(),
}).passthrough()

export const MarketingSchemas = {
  "marketing/homepage": HomepageDataSchema,
  "marketing/faq": FaqDataSchema,
  "marketing/navigation": NavigationDataSchema,
  "marketing/footer": FooterDataSchema,
  "marketing/templates": TemplatesPageSchema,
  "marketing/pricing": PricingPageSchema,
  "marketing/login": AuthPageSchema,
  "marketing/signup": AuthPageSchema,
  "marketing/forgot-password": AuthPageSchema,
  "marketing/checkout": CheckoutPageSchema,
  "marketing/success": ResultPageSchema,
  "marketing/error": ResultPageSchema,
} as const