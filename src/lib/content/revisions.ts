import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const REVISION_LOG_PATH = join(process.cwd(), "content", "revisions", "log.json");
const MAX_REVISIONS = 500;

export type ContentRevisionEntry = {
  id: string;
  type: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  before: unknown;
  after: unknown;
  createdAt: string;
  commitId?: string;
  gitStatus: "committed" | "not-configured" | "failed";
  gitError?: string;
};

function readRevisionLog(): ContentRevisionEntry[] {
  if (!existsSync(REVISION_LOG_PATH)) return [];
  try {
    return JSON.parse(readFileSync(REVISION_LOG_PATH, "utf-8")) as ContentRevisionEntry[];
  } catch {
    return [];
  }
}

export function appendContentRevision(entry: ContentRevisionEntry): void {
  mkdirSync(dirname(REVISION_LOG_PATH), { recursive: true });
  const current = readRevisionLog();
  const next = [entry, ...current].slice(0, MAX_REVISIONS);
  writeFileSync(REVISION_LOG_PATH, JSON.stringify(next, null, 2), "utf-8");
}

export function getContentRevisionHistory(limit = 100): ContentRevisionEntry[] {
  return readRevisionLog().slice(0, limit);
}

export function getRevisionLogAbsolutePath() {
  return REVISION_LOG_PATH;
}
