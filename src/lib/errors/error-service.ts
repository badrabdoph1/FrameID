import { ZodError } from "zod";
import { getErrorCodeDef } from "./error-codes";
import { logger } from "./logger";
import { formatErrorForClipboard as formatDiagnosticForClipboard } from "./format-error";
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
    return "مقدرش اتصل بقاعدة البيانات. حاول تاني بعد شوية.";
  }
  if (msg.includes("P2002")) {
    return "البيانات دي موجودة قبل كده.";
  }
  if (msg.includes("P2025")) {
    return "البيانات اللي انت بتدور عليها مش موجودة.";
  }
  if (msg.includes("P2003")) {
    return "البيانات غلط. تأكد إن العلاقات صح.";
  }
  return undefined;
}

type PrismaKnownError = Error & {
  code?: string;
  meta?: {
    target?: string[] | string;
  };
};

function isPrismaUniqueError(error: Error): error is PrismaKnownError {
  return (
    (error as PrismaKnownError).code === "P2002" ||
    error.message.includes("P2002") ||
    error.message.includes("Unique constraint failed")
  );
}

function getPrismaUniqueTarget(error: PrismaKnownError): string {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.join(",");
  }

  if (typeof target === "string") {
    return target;
  }

  return error.message;
}

function classifyErrorCode(error: unknown): ErrorCodeDef {
  if (error instanceof ZodError) return getErrorCodeDef("FID-VAL-001");
  if (error instanceof AppError) return getErrorCodeDef(error.code);

  if (error instanceof Error) {
    const msg = error.message;

    if (isPrismaUniqueError(error)) {
      const target = getPrismaUniqueTarget(error);
      if (target.includes("email")) return getErrorCodeDef("FID-AUTH-002");
      if (target.includes("slug")) return getErrorCodeDef("FID-SITE-001");
    }

    if (msg.includes("fetch failed") || msg.includes("NetworkError") || msg.includes("network")) {
      return getErrorCodeDef("FID-DB-001");
    }

    if (msg.includes("P1001") || msg.includes("Can't reach database server") || msg.includes("DATABASE_URL")) {
      return getErrorCodeDef("FID-DB-003");
    }

    if (msg.includes("Prisma") || msg.includes("prisma") || msg.includes("P2002") || msg.includes("P2025") || msg.includes("P2003")) {
      return getErrorCodeDef("FID-DB-002");
    }

    if (msg.includes("email already exists") || msg.includes("Email already exists")) return getErrorCodeDef("FID-AUTH-002");
    if (msg.includes("Invalid phone/email or password") || msg.includes("Invalid email or password")) return getErrorCodeDef("FID-AUTH-001");
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
  let metadata: Record<string, unknown> | undefined;

  if (error instanceof ZodError) {
    metadata = { issues: error.issues };
    if (isDev) {
      const issues = error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
      stack = `Validation Issues:\n${issues}`;
    }
  }

  if (error instanceof AppError) {
    if (error.message !== def.message) message = error.message;
    suggestion = error.suggestion ?? suggestion;
    cause = error.cause?.message;
    metadata = error.metadata;
  }

  if (error instanceof Error && !(error instanceof AppError)) {
    const prismaMsg = extractPrismaMessage(error);
    if (prismaMsg) cause = error.message;
    stack = error.stack;
  }

  return { def, message, suggestion, stack, cause, metadata };
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
  const { createRequestContext, getBrowser, getPlatform } = await import("./request-context");
  const ctx = await createRequestContext();
  const classified = classifyError(error);

  const detail: ErrorDetail = {
    code: classified.def.code,
    message: classified.message,
    suggestion: classified.suggestion,
    requestId: ctx.requestId,
    correlationId: ctx.correlationId,
    route: ctx.route,
    method: ctx.method,
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
    errorType: error instanceof Error ? error.name : typeof error,
    stack: classified.stack,
    cause: classified.cause,
    category: classified.def.category,
  });

  return {
    userError: sanitizeForUser(classified),
    detail,
  };
}

export function formatErrorForClipboard(detail: ErrorDetail): string {
  return formatDiagnosticForClipboard(detail);
}
