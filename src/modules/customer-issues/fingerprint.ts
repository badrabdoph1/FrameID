import { createHash } from "node:crypto";

import type { ErrorFingerprintInput, SourceLocation } from "./types";

const PROJECT_FRAME = /(?:\(|\s|^)(?:file:\/\/)?(?:[^\s():]+\/)*(src\/[^\s():]+):(\d+):(\d+)\)?/;
const DYNAMIC_SEGMENT = /^(?:\d+|[a-z]+_[a-z0-9_-]+|[a-z0-9_-]{16,})$/i;

function normalizeRoute(route?: string | null): string {
  if (!route) return "unknown-route";
  let pathname = route;

  try {
    pathname = new URL(route, "https://frameid.invalid").pathname;
  } catch {
    pathname = route.split("?")[0]?.split("#")[0] ?? route;
  }

  return pathname
    .split("/")
    .map((segment) => (DYNAMIC_SEGMENT.test(segment) ? ":id" : segment))
    .join("/") || "/";
}

export function extractSourceLocation(stack?: string | null): SourceLocation | null {
  if (!stack) return null;

  for (const line of stack.split("\n")) {
    if (line.includes("node_modules")) continue;
    const match = line.match(PROJECT_FRAME);
    if (!match?.[1] || !match[2] || !match[3]) continue;
    return {
      file: match[1],
      line: Number(match[2]),
      column: Number(match[3]),
    };
  }

  return null;
}

export function createErrorFingerprint(input: ErrorFingerprintInput): string {
  const source = extractSourceLocation(input.stack);
  const stableParts = [
    input.code || "FID-UNK-001",
    input.errorType || "Error",
    input.sourceArea || "GLOBAL",
    normalizeRoute(input.route),
    source?.file || input.digest || "no-source",
  ];

  return createHash("sha256").update(stableParts.join("|")).digest("hex").slice(0, 32);
}
