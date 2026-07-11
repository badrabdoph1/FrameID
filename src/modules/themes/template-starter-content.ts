import { z } from "zod";

const sectionSchema = z.object({
  title: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().nonnegative(),
  isVisible: z.boolean()
});

const urlSchema = z.string().url();
const optionalContactText = z.string().trim().max(120).nullable();

export const templateStarterContentSchema = z.object({
  site: z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(320)
  }),
  sections: z.object({
    hero: sectionSchema.extend({
      headline: z.string().trim().min(1).max(160),
      subheadline: z.string().trim().min(1).max(500),
      imageUrl: urlSchema
    }),
    gallery: sectionSchema.extend({
      description: z.string().trim().min(1).max(500)
    }),
    packages: sectionSchema.extend({
      description: z.string().trim().min(1).max(500)
    }),
    extras: sectionSchema.extend({
      description: z.string().trim().min(1).max(500)
    }),
    contact: sectionSchema.extend({
      callToAction: z.string().trim().min(1).max(120)
    })
  }),
  contact: z.object({
    studioName: z.string().trim().min(1).max(120),
    bio: z.string().trim().min(1).max(320),
    longDescription: z.string().trim().min(1).max(1200),
    phone: optionalContactText,
    whatsapp: optionalContactText,
    email: z.string().trim().email().nullable(),
    instagram: z.string().trim().min(1).max(80),
    facebook: z.string().trim().min(1).max(120)
  }),
  packages: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        name: z.string().trim().min(1).max(120),
        subtitle: z.string().trim().min(1).max(240),
        priceAmount: z.number().int().nonnegative(),
        currency: z.string().trim().length(3),
        features: z.array(z.string().trim().min(1).max(160)).min(1),
        imageUrl: urlSchema,
        isHighlighted: z.boolean(),
        sortOrder: z.number().int().nonnegative()
      })
    )
    .min(3),
  extras: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().min(1).max(320),
        priceAmount: z.number().int().nonnegative(),
        currency: z.string().trim().length(3),
        iconKey: z.string().trim().min(1).max(80),
        sortOrder: z.number().int().nonnegative()
      })
    )
    .min(1),
  gallery: z.object({
    album: z.object({
      title: z.string().trim().min(1).max(120),
      description: z.string().trim().min(1).max(320),
      sortOrder: z.number().int().nonnegative()
    }),
    images: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(80),
          url: urlSchema,
          alt: z.string().trim().min(1).max(240),
          caption: z.string().trim().min(1).max(320),
          sortOrder: z.number().int().nonnegative(),
          isFeatured: z.boolean().default(false)
        })
      )
      .min(1)
  }),
  seo: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(320),
    canonicalUrl: urlSchema.nullable(),
    robotsIndex: z.boolean(),
    structuredData: z.object({
      "@context": z.literal("https://schema.org"),
      "@type": z.string().trim().min(1),
      name: z.string().trim().min(1).max(120),
      description: z.string().trim().min(1).max(320)
    })
  }),
  themeSettings: z.record(z.string(), z.unknown())
});

export type TemplateStarterContent = z.infer<typeof templateStarterContentSchema>;

export type TemplateRegistrationIdentity =
  | { identifierKind: "phone"; phone: string; email?: string | null }
  | { identifierKind: "email"; email: string; phone?: string | null };

export function parseTemplateStarterContent(value: unknown): TemplateStarterContent {
  return templateStarterContentSchema.parse(value);
}

export function personalizeTemplateStarterContent(
  content: TemplateStarterContent,
  photographerName: string,
  registrationIdentity?: TemplateRegistrationIdentity
): TemplateStarterContent {
  const name = z.string().trim().min(1).max(120).parse(photographerName);
  const personalized = structuredClone(content);

  // Only photographer identity changes during signup. Shared studio and description
  // defaults remain untouched until the customer edits them from the dashboard.
  personalized.site.title = name;
  personalized.sections.hero.headline = name;
  personalized.seo.title = name;
  personalized.seo.structuredData.name = name;

  if (registrationIdentity?.identifierKind === "phone") {
    const phone = z.string().trim().min(1).max(40).parse(registrationIdentity.phone);
    personalized.contact.phone = phone;
    personalized.contact.whatsapp = phone;
  } else if (registrationIdentity?.identifierKind === "email") {
    personalized.contact.email = z.string().trim().email().parse(registrationIdentity.email);
  }

  return personalized;
}
