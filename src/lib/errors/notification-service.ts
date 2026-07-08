"use client";

import type { ErrorDetail, Notification, NotificationType, UserError } from "./types";

type Listener = (notification: Notification) => void;

type NotifyOptions = {
  title: string;
  description?: string;
  suggestion?: string;
  error?: UserError;
  detail?: ErrorDetail;
  duration?: number;
  requestId?: string;
  correlationId?: string;
  route?: string;
  groupKey?: string;
  persist?: boolean;
};

type LegacyOptions = {
  requestId?: string;
  correlationId?: string;
  route?: string;
  duration?: number;
  persist?: boolean;
};

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCurrentRoute(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.pathname}${window.location.search}`;
}

function normalizeOptions(
  titleOrOptions: string | NotifyOptions,
  description?: string,
  options?: LegacyOptions,
): NotifyOptions {
  if (typeof titleOrOptions === "object") {
    return titleOrOptions;
  }

  return {
    title: titleOrOptions,
    description,
    ...options,
    duration: options?.duration,
  };
}

async function persistNotification(notification: Notification): Promise<void> {
  if (notification.type === "info" && notification.duration === 0) return;
  if (notification.createdAt == null) return;

  try {
    await fetch("/api/internal/notification-events", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: notification.type,
        title: notification.title,
        body: notification.description,
        category: notification.error?.code ?? notification.detail?.code ?? notification.type,
        requestId: notification.requestId,
        correlationId: notification.correlationId,
        route: notification.route,
      }),
    });
  } catch {
    // Client notifications must never block the user flow.
  }
}

class NotificationService {
  private listeners = new Set<Listener>();
  private lastEmit = new Map<string, number>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(notification: Notification): void {
    this.listeners.forEach((listener) => listener(notification));
    if (notification.type !== "info" || notification.duration !== 0) {
      void persistNotification(notification);
    }
  }

  private getGroupKey(notification: Pick<Notification, "type" | "title" | "error" | "groupKey">): string {
    return notification.groupKey ?? `${notification.type}:${notification.error?.code ?? notification.title}`;
  }

  private shouldGroup(key: string): boolean {
    const now = Date.now();
    const last = this.lastEmit.get(key);
    if (last && now - last < 3000) {
      this.lastEmit.set(key, now);
      return true;
    }
    this.lastEmit.set(key, now);
    return false;
  }

  private createNotification(type: NotificationType, options: NotifyOptions, defaultDuration: number): Notification {
    const groupKey = this.getGroupKey({ type, title: options.title, error: options.error, groupKey: options.groupKey });
    const grouped = this.shouldGroup(groupKey);

    return {
      id: createId(),
      type,
      title: options.title,
      description: options.description,
      suggestion: options.suggestion ?? options.error?.suggestion ?? options.detail?.suggestion,
      error: options.error,
      detail: options.detail,
      duration: options.duration ?? defaultDuration,
      groupKey,
      groupCount: grouped ? 2 : undefined,
      requestId: options.requestId ?? options.detail?.requestId,
      correlationId: options.correlationId ?? options.detail?.correlationId,
      route: options.route ?? options.detail?.route ?? getCurrentRoute(),
      createdAt: new Date().toISOString(),
    };
  }

  success(title: string, description?: string, options?: LegacyOptions): void;
  success(options: NotifyOptions): void;
  success(titleOrOptions: string | NotifyOptions, description?: string, options?: LegacyOptions): void {
    this.emit(this.createNotification("success", normalizeOptions(titleOrOptions, description, options), 4000));
  }

  error(title: string, description?: string, error?: UserError, duration?: number, requestId?: string): void;
  error(options: NotifyOptions): void;
  error(
    titleOrOptions: string | NotifyOptions,
    description?: string,
    error?: UserError,
    duration?: number,
    requestId?: string,
  ): void {
    const options = typeof titleOrOptions === "object"
      ? titleOrOptions
      : { title: titleOrOptions, description, error, duration, requestId };

    this.emit(this.createNotification("error", options, 0));
  }

  warning(title: string, description?: string, options?: LegacyOptions): void;
  warning(options: NotifyOptions): void;
  warning(titleOrOptions: string | NotifyOptions, description?: string, options?: LegacyOptions): void {
    this.emit(this.createNotification("warning", normalizeOptions(titleOrOptions, description, options), 6000));
  }

  info(title: string, description?: string, options?: LegacyOptions): void;
  info(options: NotifyOptions): void;
  info(titleOrOptions: string | NotifyOptions, description?: string, options?: LegacyOptions): void {
    this.emit(this.createNotification("info", normalizeOptions(titleOrOptions, description, options), 6000));
  }
}

export const notify = new NotificationService();
export type { NotifyOptions };
