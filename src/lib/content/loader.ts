import "server-only"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { cache } from "react"
import type { ZodTypeAny } from "zod"
import { ContentNotFoundError, ContentValidationError } from "./errors"

const CONTENT_DIR = join(process.cwd(), "content")

function readRawContent(type: string): unknown {
  const filePath = join(CONTENT_DIR, `${type}.json`)
  if (!existsSync(filePath)) {
    throw new ContentNotFoundError(type)
  }
  const raw = readFileSync(filePath, "utf-8")
  return JSON.parse(raw)
}

function parseEnvelope(raw: unknown): { data: unknown; version: number; updatedAt: string } {
  const envelope = raw as { data?: unknown; version?: number; updatedAt?: string }
  if (!envelope || typeof envelope !== "object") {
    throw new Error("Invalid content file: must be an object envelope")
  }
  return {
    data: envelope.data,
    version: envelope.version ?? 0,
    updatedAt: envelope.updatedAt ?? "",
  }
}

export const getContent = cache(function getContent<T>(
  type: string,
  schema: ZodTypeAny,
): T & { _version: number; _updatedAt: string } {
  const raw = readRawContent(type)
  const { data, version, updatedAt } = parseEnvelope(raw)
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ContentValidationError(
      type,
      result.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    )
  }
  return { ...result.data, _version: version, _updatedAt: updatedAt }
})

export function getContentPath(type: string): string {
  return join(CONTENT_DIR, `${type}.json`)
}

export function contentFileExists(type: string): boolean {
  return existsSync(join(CONTENT_DIR, `${type}.json`))
}
