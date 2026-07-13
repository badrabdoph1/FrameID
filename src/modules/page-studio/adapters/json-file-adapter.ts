import type { SourceAdapter, AdapterLoadResult, AdapterSaveResult, SaveOptions } from "./types";
import { getContent, saveContent, ContentSchemas } from "@/lib/content";
import type { ContentSchemaKey } from "@/lib/content";

export class JsonFileAdapter implements SourceAdapter {
  constructor(private schemaKey: ContentSchemaKey) {}

  async load(pageId: string): Promise<AdapterLoadResult> {
    const content = getContent(this.schemaKey);
    const { _version, _updatedAt, ...data } = content;
    return {
      data: data as Record<string, unknown>,
      version: _version,
      updatedAt: _updatedAt,
    };
  }

  async save(pageId: string, data: Record<string, unknown>, options: SaveOptions): Promise<AdapterSaveResult> {
    const result = await saveContent(this.schemaKey, data, { actor: options.actor });
    return {
      success: result.success,
      version: result.version,
      commitId: result.commitId,
      errors: result.errors,
    };
  }

  getSchema(pageId: string) {
    return ContentSchemas[this.schemaKey];
  }
}

export function createJsonFileAdapter(schemaKey: ContentSchemaKey): SourceAdapter {
  return new JsonFileAdapter(schemaKey);
}