import { z } from "zod"

export const PlatformDataSchema = z.object({
  name: z.string().min(1),
  logo: z.string(),
  favicon: z.string(),
  tagline: z.string(),
  accentColor: z.string(),
  locale: z.string(),
  direction: z.string(),
}).passthrough()

export const SettingsSchemas = {
  "settings/platform": PlatformDataSchema,
} as const
