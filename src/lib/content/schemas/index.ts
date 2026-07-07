import type { z } from "zod"
import { MarketingSchemas } from "./marketing"
import { LegalSchemas } from "./legal"
import { SEOSchemas } from "./seo"
import { SettingsSchemas } from "./settings"
import { TemplateSchemas } from "./templates"

export * from "./marketing"
export * from "./legal"
export * from "./seo"
export * from "./settings"
export * from "./templates"

export const ContentSchemas = {
  ...MarketingSchemas,
  ...LegalSchemas,
  ...SEOSchemas,
  ...SettingsSchemas,
  ...TemplateSchemas,
} as const

export type ContentSchemaKey = keyof typeof ContentSchemas
export type ContentSchemaType<T extends ContentSchemaKey> = z.infer<(typeof ContentSchemas)[T]>
