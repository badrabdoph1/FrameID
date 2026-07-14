import "server-only"
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { ZodTypeAny } from "zod"
import { updateManifestEntry } from "./manifest"
import { getContent, contentFileExists } from "./loader"
import { appendContentRevision } from "./revisions"
import type { ContentRevisionEntry } from "./revisions"
import { commitContentFilesToGitHub } from "./git-sync"
import type { SaveResult } from "./types"

const CONTENT_DIR = join(process.cwd(), "content")
const MANIFEST_PATH = join(CONTENT_DIR, "manifest.json")

export type SaveContentOptions = {
  actor?: {
    id?: string
    name?: string
    email?: string
  }
}

function stripContentMeta(value: Record<string, unknown>) {
  const copy = { ...value }
  delete copy._version
  delete copy._updatedAt
  return copy
}

export async function saveContent(
  type: string,
  schema: ZodTypeAny,
  data: unknown,
  options: SaveContentOptions = {},
): Promise<SaveResult> {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((e) => ({
        path: (e.path ?? []).join("."),
        message: e.message,
      })),
    }
  }

  let currentVersion = 0
  let before: unknown = null
  if (contentFileExists(type)) {
    try {
      const current = getContent(type, schema) as unknown as Record<string, unknown> & { _version: number }
      currentVersion = current._version ?? 0
      before = stripContentMeta(current)
    } catch {
      before = null
    }
  }

  const newVersion = currentVersion + 1
  const updatedAt = new Date().toISOString()
  const envelope = {
    $schema: type,
    version: newVersion,
    updatedAt,
    data: result.data,
  }

  const filePath = join(CONTENT_DIR, `${type}.json`)
  const previousFile = existsSync(filePath) ? readFileSync(filePath, "utf-8") : null
  const previousManifest = existsSync(MANIFEST_PATH) ? readFileSync(MANIFEST_PATH, "utf-8") : null
  writeFileSync(filePath, JSON.stringify(envelope, null, 2), "utf-8")
  updateManifestEntry(type, newVersion)

  const commitResult = await commitContentFilesToGitHub({
    files: [
      { path: `content/${type}.json`, absolutePath: filePath },
      { path: "content/manifest.json", absolutePath: MANIFEST_PATH },
    ],
    message: `Update platform content: ${type}`,
  })

  if (!commitResult.commitSha) {
    if (previousFile === null) unlinkSync(filePath)
    else writeFileSync(filePath, previousFile, "utf-8")
    if (previousManifest === null) unlinkSync(MANIFEST_PATH)
    else writeFileSync(MANIFEST_PATH, previousManifest, "utf-8")
    return {
      success: false,
      errors: [{
        path: "git",
        message: commitResult.error ?? "GitHub غير مضبوط؛ لم يُعتمد تعديل محتوى المنصة.",
      }],
    }
  }

  const gitStatus: ContentRevisionEntry["gitStatus"] = "committed"

  const revision: ContentRevisionEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    actorId: options.actor?.id,
    actorName: options.actor?.name,
    actorEmail: options.actor?.email,
    before,
    after: result.data,
    createdAt: updatedAt,
    commitId: commitResult.commitSha,
    gitStatus,
    gitError: undefined,
  }
  await appendContentRevision(revision)

  return {
    success: true,
    version: newVersion,
    commitId: commitResult.commitSha,
    gitStatus: "committed",
  }
}
