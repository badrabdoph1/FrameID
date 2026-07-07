import { getContent as loadContent } from "./loader"
import { saveContent as writeContent } from "./writer"
import { getManifestData, getManifestEntry } from "./manifest"
import { ContentSchemas } from "./schemas"
import type { ContentSchemaKey, ContentSchemaType, SaveResult, ContentManifest } from "./types"

export type { SaveResult, ContentManifest, ContentSchemaKey, ContentSchemaType }

export function getContent<T extends ContentSchemaKey>(
  type: T,
): ContentSchemaType<T> & { _version: number; _updatedAt: string } {
  const schema = ContentSchemas[type]
  if (!schema) throw new Error(`Unknown content type: ${String(type)}`)
  return loadContent(type as string, schema as any) as ContentSchemaType<T> & {
    _version: number
    _updatedAt: string
  }
}

export function saveContent(type: ContentSchemaKey, data: unknown): SaveResult {
  const schema = ContentSchemas[type]
  if (!schema) throw new Error(`Unknown content type: ${String(type)}`)
  return writeContent(type as string, schema as any, data)
}

export function getManifest(): ContentManifest {
  return getManifestData()
}

export function getContentManifestEntry(type: ContentSchemaKey): { version: number; updatedAt: string } | null {
  return getManifestEntry(type as string)
}

export { ContentSchemas }
