import "server-only"
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"

const CONTENT_DIR = join(process.cwd(), "content")
const BACKUP_DIR = join(CONTENT_DIR, ".backups")

export function createBackup(type: string): string | null {
  const sourcePath = join(CONTENT_DIR, `${type}.json`)
  if (!existsSync(sourcePath)) return null

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backupPath = join(BACKUP_DIR, `${type}/${timestamp}.json`)
  const backupDir = dirname(backupPath)

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true })
  }

  copyFileSync(sourcePath, backupPath)
  return backupPath
}

export function listBackups(type: string): string[] {
  const backupDir = join(BACKUP_DIR, type)
  if (!existsSync(backupDir)) return []
  return readdirSync(backupDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse()
}
