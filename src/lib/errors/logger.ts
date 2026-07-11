import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ErrorCategory, ErrorLevel, ErrorLogEntry, Logger } from "./types";

const isDev = process.env.NODE_ENV === "development";
const inMemoryBuffer: ErrorLogEntry[] = [];
const MAX_BUFFER = 500;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function devLog(
  level: ErrorLevel,
  code: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level}] [${code}]`;
  switch (level) {
    case "ERROR":
    case "FATAL":
      console.error(`${prefix} ${message}`, meta ?? "");
      break;
    case "WARN":
      console.warn(`${prefix} ${message}`, meta ?? "");
      break;
    default:
      console.log(`${prefix} ${message}`, meta ?? "");
  }
}

function productionLog(
  level: ErrorLevel,
  code: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  const safeMeta = {
    requestId: meta?.requestId,
    correlationId: meta?.correlationId,
    route: meta?.route,
    method: meta?.method,
    category: meta?.category,
    cause: meta?.cause,
    metadata: meta?.metadata,
  };

  const line = `[${formatTimestamp()}] [${level}] [${code}] ${message}`;
  if (level === "ERROR" || level === "FATAL") console.error(line, safeMeta);
  else if (level === "WARN") console.warn(line, safeMeta);
  else console.log(line, safeMeta);
}

function normalizeCategory(meta?: Record<string, unknown>): ErrorCategory {
  return (meta?.category as ErrorCategory | undefined) ?? "UNKNOWN";
}

function createEntry(
  level: ErrorLevel,
  code: string,
  message: string,
  meta?: Record<string, unknown>,
): ErrorLogEntry {
  return {
    id: crypto.randomUUID(),
    code,
    message,
    category: normalizeCategory(meta),
    level,
    requestId: meta?.requestId as string | undefined,
    correlationId: meta?.correlationId as string | undefined,
    route: meta?.route as string | undefined,
    method: meta?.method as string | undefined,
    userId: meta?.userId as string | undefined,
    tenantId: meta?.tenantId as string | undefined,
    userAgent: meta?.userAgent as string | undefined,
    platform: meta?.platform as string | undefined,
    browser: meta?.browser as string | undefined,
    stack: meta?.stack as string | undefined,
    cause: meta?.cause as string | undefined,
    metadata: meta?.metadata as Record<string, unknown> | undefined,
    resolved: level === "INFO" || level === "DEBUG",
    createdAt: formatTimestamp(),
  };
}

async function persistErrorLog(entry: ErrorLogEntry): Promise<void> {
  inMemoryBuffer.unshift(entry);
  if (inMemoryBuffer.length > MAX_BUFFER) {
    inMemoryBuffer.pop();
  }

  try {
    await prisma.errorLog.create({
      data: {
        code: entry.code,
        message: entry.message,
        category: entry.category,
        level: entry.level,
        requestId: entry.requestId || null,
        correlationId: entry.correlationId || null,
        route: entry.route || null,
        userId: entry.userId || null,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        resolved: entry.resolved,
      },
    });
  } catch {
    if (isDev) {
      console.error("[logger] Failed to persist log entry to DB");
    }
  }
}

function writeLog(level: ErrorLevel, code: string, message: string, meta?: Record<string, unknown>) {
  const entry = createEntry(level, code, message, meta);

  if (isDev) {
    devLog(level, code, message, meta);
    if (entry.stack) console.error("  Stack:", entry.stack);
  } else {
    productionLog(level, code, message, meta);
  }

  if (level !== "DEBUG" || isDev) {
    void persistErrorLog(entry);
  }
}

export const logger: Logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (isDev) writeLog("DEBUG", (meta?.code as string | undefined) ?? "FID-LOG-DEBUG", message, meta);
  },

  info(message: string, meta?: Record<string, unknown>) {
    writeLog("INFO", (meta?.code as string | undefined) ?? "FID-LOG-INFO", message, meta);
  },

  warn(message: string, meta?: Record<string, unknown>) {
    writeLog("WARN", (meta?.code as string | undefined) ?? "FID-LOG-WARN", message, meta);
  },

  error(code: string, message: string, meta?: Record<string, unknown>) {
    writeLog("ERROR", code, message, meta);
  },

  fatal(code: string, message: string, meta?: Record<string, unknown>) {
    writeLog("FATAL", code, message, meta);
  },
};

export function getInMemoryErrorLog(): ErrorLogEntry[] {
  return [...inMemoryBuffer];
}
