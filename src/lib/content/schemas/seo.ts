import { z } from "zod"

export const OGImageSchema = z.object({
  url: z.string().url(),
  width: z.number(),
  height: z.number(),
  alt: z.string(),
}).passthrough()

export const SEODataSchema = z.object({
  defaultTitle: z.string(),
  titleTemplate: z.string(),
  description: z.string(),
  siteUrl: z.string().url(),
  locale: z.string(),
  openGraph: z.object({
    title: z.string(),
    description: z.string(),
    siteName: z.string(),
    images: z.array(OGImageSchema),
  }).passthrough(),
  twitter: z.object({
    card: z.string(),
    title: z.string(),
    description: z.string(),
    images: z.array(z.string()),
  }).passthrough(),
}).passthrough()

export const SEOSchemas = {
  "seo/metadata": SEODataSchema,
} as const
