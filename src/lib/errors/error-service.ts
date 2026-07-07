import { ZodError } from "zod";
import { getErrorCodeDef } from "./error-codes";
import { logger } from "./logger";
import { createRequestContext, getBrowser, getPlatform } from "./request-context";
import type {
  ErrorCategory,
  ErrorCodeDef,
  ErrorDetail,
  UserError,
} from "./types";

const isDev = process.env.NODE_ENV === "development";

export class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly suggestion?: string;
  public readonly metadata?: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(
    code: string,
    message?: string,
    options?: {
      suggestion?: string;
      metadata?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    const def = getErrorCodeDef(code);
    super(message ?? def.message);
    this.name = "AppError";
    this.code = code;
    this.category = def.category;
    this.suggestion = options?.suggestion ?? def.suggestion;
    this.metadata = options?.metadata;
    this.cause = options?.cause;
  }
}

export class AuthError extends AppError {
  constructor(code: string, message?: string) {
    super(code, message, { metadata: { category: "AUTH" } });
    this.name = "AuthError";
  }
}

export class UploadError extends AppError {
  constructor(code: string, message?: string) {
    super(code, message, { metadata: { category: "UPLOAD" } });
    this.name = "UploadError";
  }
}

export class PaymentError extends AppError {
  constructor(code: string, message?: string) {
    super(code, message, { metadata: { category: "PAYMENT" } });
    this.name = "PaymentError";
  }
}

export class SiteError extends AppError {
  constructor(code: string, message?: string) {
    super(code, message, { metadata: { category: "SITE" } });
    this.name = "SiteError";
  }
}

export class DbError extends AppError {
  constructor(code: string, message?: string) {
    super(code, message, { metadata: { category: "DB" } });
    this.name = "DbError";
  }
}

export class ValidationError extends AppError {
  constructor(code: string, message?: string) {
    super(code, message, { metadata: { category: "VALIDATION" } });
    this.name = "ValidationError";
  }
}

export class AdminError extends AppError {
  constructor(code: string, message?: string) {
    super(code, message, { metadata: { category: "ADMIN" } });
    this.name = "AdminError";
  }
}

function extractPrismaMessage(error: Error): string | undefined {
  const msg = error.message;

  if (msg.includes("P1001") || msg.includes("Can't reach database server")) {
    return "تعذر الاتصال بقاعدة البيانات. تأكد من DATABASE_URL وتشغيل قاعدة البيانات ثم حاول مرة أخرى.";
  }
  if (msg.includes("P2002")) {
    return "البيانات موجودة مسبقاً.";
  }
  if (msg.includes("P2025")) {
    return "السجل المطلوب غير موجود.";
  }
  if (msg.includes("P2003")) {
    return "بيانات غير صالحة. تأكد من صحة العلاقات.";
  }
  return undefined;
}

function classifyErrorCode(error: unknown): ErrorCodeDef {
  if (error instanceof ZodError) {
    return getErrorCodeDef("FID-VAL-001");
  }

  if (error instanceof AppError) {
    return getErrorCodeDef(error.code);
  }

  if (error instanceof Error) {
    const msg = error.message;

    if (
      msg.includes("fetch failed") ||
      msg.includes("NetworkError") ||
      msg.includes("network")
    ) {
      return getErrorCodeDef("FID-DB-001");
    }

    if (
      msg.includes("P1001") ||
      msg.includes("Can't reach database server") ||
      msg.includes("DATABASE_URL")
    ) {
      return getErrorCodeDef("FID-DB-003");
    }

    if (
      msg.includes("Prisma") ||
      msg.includes("prisma") ||
      msg.includes("P2002") ||
      msg.includes("P2025") ||
      msg.includes("P2003")
    ) {
      return getErrorCodeDef("FID-DB-002");
    }

    if (msg.includes("email already exists") || msg.includes("Email already exists")) {
      return getErrorCodeDef("FID-AUTH-002");
    }

    if (msg.includes("Invalid email or password")) {
      return getErrorCodeDef("FID-AUTH-001");
    }
  }

  return getErrorCodeDef("FID-UNK-001");
}

export type ClassifiedError = {
  def: ErrorCodeDef;
  message: string;
  suggestion?: string;
  stack?: string;
  cause?: string;
  metadata?: Record<string, unknown>;
};

export function classifyError(error: unknown): ClassifiedError {
  const def = classifyErrorCode(error);

  let message = def.message;
  let suggestion = def.suggestion;
  let stack: string | undefined;
  let cause: string | undefined;

  if (error instanceof ZodError) {
    if (isDev) {
      const issues = error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      stack = `Validation Issues:\n${issues}`;
    }
  }

  if (error instanceof AppError) {
    if (error.message !== def.message) {
      message = error.message;
    }
    suggestion = error.suggestion ?? suggestion;
    cause = error.cause?.message;
  }

  if (error instanceof Error && !(error instanceof AppError)) {
    const prismaMsg = extractPrismaMessage(error);
    if (prismaMsg && isDev) {
      cause = error.message;
    }

    if (isDev) {
      stack = error.stack;
    }
  }

  return { def, message, suggestion, stack, cause };
}

export function sanitizeForUser(classified: ClassifiedError): UserError {
  return {
    code: classified.def.code,
    message: classified.message,
    suggestion: classified.suggestion,
  };
}

export async function processError(
  error: unknown,
  context?: {
    userId?: string;
    tenantId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ userError: UserError; detail: ErrorDetail }> {
  const ctx = await createRequestContext();
  const classified = classifyError(error);

  const detail: ErrorDetail = {
    code: classified.def.code,
    message: classified.message,
    suggestion: classified.suggestion,
    requestId: ctx.requestId,
    correlationId: ctx.correlationId,
    route: ctx.route,
    timestamp: new Date().toISOString(),
    userId: context?.userId,
    tenantId: context?.tenantId,
    userAgent: ctx.userAgent,
    platform: getPlatform(),
    browser: getBrowser(),
    stack: isDev ? classified.stack : undefined,
    cause: isDev ? classified.cause : undefined,
    metadata: context?.metadata ?? classified.metadata,
  };

  logger.error(classified.def.code, classified.message, {
    ...detail,
    category: classified.def.category,
  });

  return {
    userError: sanitizeForUser(classified),
    detail,
  };
}

export function formatErrorForClipboard(detail: ErrorDetail): string {
  const lines = [
    `=== Error Details ===`,
    `Code: ${detail.code}`,
    `Message: ${detail.message}`,
    `Timestamp: ${detail.timestamp}`,
    `Request ID: ${detail.requestId}`,
    `Correlation ID: ${detail.correlationId ?? "N/A"}`,
    `Route: ${detail.route ?? "N/A"}`,
    `User ID: ${detail.userId ?? "N/A"}`,
    `Browser: ${detail.browser ?? "N/A"}`,
    `Platform: ${detail.platform ?? "N/A"}`,
    ``,
  ];

  if (detail.suggestion) {
    lines.push(`Suggestion: ${detail.suggestion}`);
    lines.push(``);
  }

  if (detail.cause && isDev) {
    lines.push(`Cause: ${detail.cause}`);
    lines.push(``);
  }

  if (detail.stack && isDev) {
    lines.push(`Stack:`);
    lines.push(detail.stack);
    lines.push(``);
  }

  lines.push(`---`);

  return lines.join("\n");
}
