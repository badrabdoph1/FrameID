import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createErrorFingerprint, extractSourceLocation } from "@/modules/customer-issues/fingerprint";
import { sanitizeIssuePayload, sanitizeIssueUrl } from "@/modules/customer-issues/sanitize";
import type { ErrorSourceArea } from "@/modules/customer-issues/types";
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
  const stack = meta?.stack as string | undefined;
  const route = meta?.route as string | undefined;
  const source = extractSourceLocation(stack);
  const sourceArea = ((meta?.sourceArea as ErrorSourceArea | undefined) ?? "GLOBAL");
  const errorType = meta?.errorType as string | undefined;
  const digest = meta?.digest as string | undefined;
  return {
    id: crypto.randomUUID(),
    code,
    message,
    errorType,
    fingerprint: createErrorFingerprint({ code, errorType, route, stack, digest, sourceArea }),
    category: normalizeCategory(meta),
    level,
    requestId: meta?.requestId as string | undefined,
    correlationId: meta?.correlationId as string | undefined,
    route: sanitizeIssueUrl(route) ?? undefined,
    method: meta?.method as string | undefined,
    url: sanitizeIssueUrl(meta?.url as string | undefined) ?? undefined,
    userId: meta?.userId as string | undefined,
    tenantId: meta?.tenantId as string | undefined,
    siteId: meta?.siteId as string | undefined,
    sessionId: meta?.sessionId as string | undefined,
    adminUserId: meta?.adminUserId as string | undefined,
    userAgent: meta?.userAgent as string | undefined,
    platform: meta?.platform as string | undefined,
    browser: meta?.browser as string | undefined,
    device: meta?.device as string | undefined,
    os: meta?.os as string | undefined,
    language: meta?.language as string | undefined,
    timezone: meta?.timezone as string | undefined,
    screenSize: meta?.screenSize as string | undefined,
    referrer: sanitizeIssueUrl(meta?.referrer as string | undefined) ?? undefined,
    connectionStatus: meta?.connectionStatus as string | undefined,
    environment: (meta?.environment as string | undefined) ?? process.env.NODE_ENV,
    releaseVersion: meta?.releaseVersion as string | undefined,
    buildVersion: meta?.buildVersion as string | undefined,
    templateCode: meta?.templateCode as string | undefined,
    lastAction: meta?.lastAction as string | undefined,
    sourceArea,
    sourceFile: source?.file,
    sourceLine: source?.line,
    sourceColumn: source?.column,
    ipAddress: meta?.ipAddress as string | undefined,
    stack,
    digest,
    cause: meta?.cause as string | undefined,
    metadata: sanitizeIssuePayload((meta?.metadata as Record<string, unknown> | undefined) ?? {}),
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
        method: entry.method || null,
        url: entry.url || null,
        errorType: entry.errorType || null,
        fingerprint: entry.fingerprint || null,
        stack: entry.stack || null,
        digest: entry.digest || null,
        cause: entry.cause || null,
        userId: entry.userId || null,
        tenantId: entry.tenantId || null,
        siteId: entry.siteId || null,
        sessionId: entry.sessionId || null,
        adminUserId: entry.adminUserId || null,
        sourceArea: entry.sourceArea || null,
        sourceFile: entry.sourceFile || null,
        sourceLine: entry.sourceLine ?? null,
        sourceColumn: entry.sourceColumn ?? null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        browser: entry.browser || null,
        device: entry.device || null,
        os: entry.os || entry.platform || null,
        language: entry.language || null,
        timezone: entry.timezone || null,
        screenSize: entry.screenSize || null,
        referrer: entry.referrer || null,
        connectionStatus: entry.connectionStatus || null,
        environment: entry.environment || null,
        releaseVersion: entry.releaseVersion || null,
        buildVersion: entry.buildVersion || null,
        templateCode: entry.templateCode || null,
        lastAction: entry.lastAction || null,
        metadata: entry.metadata as Prisma.InputJsonObject,
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
