import "server-only"
import { writeFileSync } from "node:fs"
import { join } from "node:fs"
import type { ZodTypeAny } from "zod"
import { createBackup } from "./backup"
import { updateManifestEntry } from "./manifest"
import { getContent, contentFileExists } from "./loader"
import type { SaveResult } from "./types"

const CONTENT_DIR = join(process.cwd(), "content")

export function saveContent(
  type: string,
  schema: ZodTypeAny,
  data: unknown,
): SaveResult {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    }
  }

  let currentVersion = 0
  if (contentFileExists(type)) {
    try {
      const current = getContent(type, schema)
      currentVersion = (current as unknown as { _version: number })._version ?? 0
    } catch {
      /* file may be invalid — treat as first save */
    }
  }

  createBackup(type)

  const newVersion = currentVersion + 1
  const envelope = {
    $schema: type,
    version: newVersion,
    updatedAt: new Date().toISOString(),
    data: result.data,
  }

  const filePath = join(CONTENT_DIR, `${type}.json`)
  writeFileSync(filePath, JSON.stringify(envelope, null, 2), "utf-8")

  updateManifestEntry(type, newVersion)

  return { success: true, version: newVersion }
}
