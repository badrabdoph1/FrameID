import { prisma } from "@/lib/prisma";
import type { ErrorLevel, ErrorLogEntry, Logger } from "./types";

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
        method: entry.method || null,
        userId: entry.userId || null,
        tenantId: entry.tenantId || null,
        userAgent: entry.userAgent || null,
        platform: entry.platform || null,
        browser: entry.browser || null,
        stack: entry.stack || null,
        cause: entry.cause || null,
        metadata: entry.metadata as Record<string, unknown> | null,
      },
    });
  } catch {
    if (isDev) {
      console.error("[logger] Failed to persist error log to DB");
    }
  }
}

export const logger: Logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (isDev) {
      devLog("DEBUG", "DBG", message, meta);
    }
  },

  info(message: string, meta?: Record<string, unknown>) {
    if (isDev) {
      devLog("INFO", "INF", message, meta);
    }
  },

  warn(message: string, meta?: Record<string, unknown>) {
    if (isDev) {
      devLog("WARN", "WRN", message, meta);
    }
  },

  error(code: string, message: string, meta?: Record<string, unknown>) {
    const entry: ErrorLogEntry = {
      id: crypto.randomUUID(),
      code,
      message,
      category: (meta?.category as ErrorLogEntry["category"]) ?? "UNKNOWN",
      level: "ERROR",
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
      resolved: false,
      createdAt: formatTimestamp(),
    };

    if (isDev) {
      devLog("ERROR", code, message, meta);
      if (entry.stack) {
        console.error("  Stack:", entry.stack);
      }
    }

    persistErrorLog(entry);
  },

  fatal(code: string, message: string, meta?: Record<string, unknown>) {
    const entry: ErrorLogEntry = {
      id: crypto.randomUUID(),
      code,
      message,
      category: (meta?.category as ErrorLogEntry["category"]) ?? "UNKNOWN",
      level: "FATAL",
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
      resolved: false,
      createdAt: formatTimestamp(),
    };

    if (isDev) {
      devLog("FATAL", code, message, meta);
      if (entry.stack) {
        console.error("  Stack:", entry.stack);
      }
    }

    persistErrorLog(entry);
  },
};

export function getInMemoryErrorLog(): ErrorLogEntry[] {
  return [...inMemoryBuffer];
}
