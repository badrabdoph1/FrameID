import { z } from "zod"

export const TemplateEntrySchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  previewImage: z.string().url(),
  category: z.string(),
  order: z.number().int().nonnegative(),
  isPublished: z.boolean(),
}).passthrough()

export const TemplateRegistryDataSchema = z.object({
  items: z.array(TemplateEntrySchema),
}).passthrough()

export const PackageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subtitle: z.string(),
  priceAmount: z.number().int().nonnegative(),
  currency: z.string().length(3),
  features: z.array(z.string().min(1)),
  imageUrl: z.string().url(),
  isHighlighted: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
})

export const ExtraSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  priceAmount: z.number().int().nonnegative(),
  currency: z.string().length(3),
  iconKey: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
})

export const GalleryImageSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  alt: z.string(),
  caption: z.string(),
  sortOrder: z.number().int().nonnegative(),
  isFeatured: z.boolean(),
})

export const UnifiedTemplateContentSchema = z.object({
  photographerName: z.string(),
  studioName: z.string(),
  description: z.string(),
  heroImageUrl: z.string(),
  heroEyebrow: z.string(),
  heroCtaLabel: z.string(),
  packagesTitle: z.string(),
  packagesDescription: z.string(),
  packages: z.array(PackageSchema),
  extrasTitle: z.string(),
  extrasDescription: z.string(),
  extras: z.array(ExtraSchema),
  galleryTitle: z.string(),
  galleryDescription: z.string(),
  gallery: z.array(GalleryImageSchema),
  contactPhone: z.string().nullable(),
  contactWhatsapp: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactInstagram: z.string().nullable(),
  contactFacebook: z.string().nullable(),
  contactTiktok: z.string().nullable(),
  workLocation: z.string(),
}).passthrough()

export const TemplateSchemas = {
  "templates/registry": TemplateRegistryDataSchema,
  "templates/unified-content": UnifiedTemplateContentSchema,
} as const
