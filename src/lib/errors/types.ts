export type ErrorCategory =
  | "AUTH"
  | "UPLOAD"
  | "PAYMENT"
  | "SITE"
  | "CONTENT"
  | "DB"
  | "ADMIN"
  | "VALIDATION"
  | "BACKUP"
  | "MEDIA"
  | "SECURITY"
  | "UNKNOWN";

export type ErrorLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface ErrorCodeDef {
  code: string;
  category: ErrorCategory;
  level: ErrorLevel;
  message: string;
  suggestion?: string;
  httpStatus?: number;
}

export interface UserError {
  code: string;
  message: string;
  suggestion?: string;
}

export interface ErrorDetail extends UserError {
  requestId: string;
  correlationId?: string;
  route?: string;
  method?: string;
  timestamp: string;
  userId?: string;
  tenantId?: string;
  userAgent?: string;
  platform?: string;
  browser?: string;
  stack?: string;
  cause?: string;
  metadata?: Record<string, unknown>;
}

export type ActionResult<T = void> =
  | { success: true; data: T; requestId: string; correlationId?: string }
  | {
      success: false;
      error: UserError;
      requestId: string;
      correlationId?: string;
    };

export type ServerAction<TArgs extends unknown[], T> = (
  ...args: TArgs
) => Promise<ActionResult<T>>;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  suggestion?: string;
  error?: UserError;
  duration?: number;
}

export interface NotificationLogEntry {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  category?: string;
  userId?: string;
  tenantId?: string;
  readAt?: string;
  createdAt: string;
}

export interface ErrorLogEntry {
  id: string;
  code: string;
  message: string;
  category: ErrorCategory;
  level: ErrorLevel;
  requestId?: string;
  correlationId?: string;
  route?: string;
  method?: string;
  userId?: string;
  tenantId?: string;
  userAgent?: string;
  platform?: string;
  browser?: string;
  stack?: string;
  cause?: string;
  metadata?: Record<string, unknown>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
  createdAt: string;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(
    code: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void;
  fatal(
    code: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void;
}

export interface LogStore {
  write(entry: ErrorLogEntry): Promise<void>;
  writeNotification(entry: NotificationLogEntry): Promise<void>;
  query(params?: LogQueryParams): Promise<{
    entries: ErrorLogEntry[];
    total: number;
  }>;
  queryNotifications(params?: LogQueryParams): Promise<{
    entries: NotificationLogEntry[];
    total: number;
  }>;
  resolveError(id: string, by: string, note?: string): Promise<void>;
}

export interface LogQueryParams {
  category?: ErrorCategory;
  level?: ErrorLevel;
  code?: string;
  userId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
}
