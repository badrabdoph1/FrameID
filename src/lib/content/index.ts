import { getContent as loadContent } from "./loader"
import { saveContent as writeContent } from "./writer"
import { getManifestData, getManifestEntry } from "./manifest"
import { ContentSchemas } from "./schemas"
import type { ContentSchemaKey, ContentSchemaType, SaveResult, ContentManifest } from "./types"

export type { SaveResult, ContentManifest, ContentSchemaKey, ContentSchemaType }

type ContentSchema = NonNullable<(typeof ContentSchemas)[ContentSchemaKey]>

export function getContent<T extends ContentSchemaKey>(
  type: T,
): ContentSchemaType<T> & { _version: number; _updatedAt: string } {
  const schema: ContentSchema = ContentSchemas[type]
  if (!schema) throw new Error(`Unknown content type: ${String(type)}`)
  return loadContent(type, schema) as ContentSchemaType<T> & {
    _version: number
    _updatedAt: string
  }
}

export function saveContent(type: ContentSchemaKey, data: unknown): SaveResult {
  const schema: ContentSchema = ContentSchemas[type]
  if (!schema) throw new Error(`Unknown content type: ${String(type)}`)
  return writeContent(type, schema, data)
}

export function getManifest(): ContentManifest {
  return getManifestData()
}

export function getContentManifestEntry(type: ContentSchemaKey): { version: number; updatedAt: string } | null {
  return getManifestEntry(type as string)
}

export { ContentSchemas }
