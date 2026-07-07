import { z } from "zod"

export const LegalSectionSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
}).passthrough()

export const LegalDataSchema = z.object({
  title: z.string().min(1),
  lastUpdated: z.string(),
  sections: z.array(LegalSectionSchema),
}).passthrough()

export const LegalSchemas = {
  "legal/privacy": LegalDataSchema,
  "legal/terms": LegalDataSchema,
} as const
