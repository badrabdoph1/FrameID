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

export const TemplateSchemas = {
  "templates/registry": TemplateRegistryDataSchema,
} as const
