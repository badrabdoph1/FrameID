import type { ContentSchemaKey, ContentSchemaType } from "./schemas"

export type { ContentSchemaKey, ContentSchemaType }

export type SaveResult =
  | { success: true; version: number; commitId?: string; gitStatus: "committed" | "not-configured" | "failed"; gitError?: string }
  | { success: false; errors: { path: string; message: string }[] }

export type ContentType = ContentSchemaKey

export type ContentFileManifestEntry = {
  version: number
  updatedAt: string
}

export type ContentManifest = Record<string, ContentFileManifestEntry>
