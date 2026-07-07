import "server-only"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { ContentManifest } from "./types"

const MANIFEST_PATH = join(process.cwd(), "content", "manifest.json")

type FullManifest = {
  $schema: string
  version: number
  updatedAt: string
  data: ContentManifest
}

function readManifest(): FullManifest {
  if (!existsSync(MANIFEST_PATH)) {
    return {
      $schema: "manifest",
      version: 1,
      updatedAt: new Date().toISOString(),
      data: {},
    }
  }
  const raw = readFileSync(MANIFEST_PATH, "utf-8")
  return JSON.parse(raw)
}

export function updateManifestEntry(type: string, version: number): void {
  const manifest = readManifest()
  manifest.data[type] = {
    version,
    updatedAt: new Date().toISOString(),
  }
  manifest.version = (manifest.version ?? 1) + 1
  manifest.updatedAt = new Date().toISOString()
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8")
}

export function getManifestData(): ContentManifest {
  return readManifest().data
}

export function getManifestEntry(type: string): { version: number; updatedAt: string } | null {
  const manifest = readManifest().data
  return manifest[type] ?? null
}
