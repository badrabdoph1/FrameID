"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Check,
  ClipboardCopy,
  Info,
  X,
  XCircle,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { notify } from "@/lib/errors/notification-service";
import { formatErrorForClipboard } from "@/lib/errors/format-error";
import type {
  ErrorDetail,
  Notification as NotificationType,
} from "@/lib/errors/types";
import { cn } from "@/lib/utils/cn";

const MAX_VISIBLE_TOASTS = 5;
const EXIT_ANIMATION_MS = 250;

type ExtendedNotification = NotificationType & {
  _errorDetail?: ErrorDetail;
  _entered?: boolean;
};

type ToastContextType = {
  toasts: ExtendedNotification[];
  addToast: (notification: ExtendedNotification) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const bgMap: Record<string, string> = {
  success: "border-success/20 bg-success/5 bg-success-soft/50",
  error: "border-danger/20 bg-danger/5 bg-danger-soft/50",
  warning: "border-warning/20 bg-warning/5 bg-warning-soft/50",
  info: "border-signal/20 bg-signal/5",
};

const iconColorMap: Record<string, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-signal",
};

const progressColorMap: Record<string, string> = {
  success: "bg-success",
  error: "bg-danger",
  warning: "bg-warning",
  info: "bg-signal",
};

function ToastIcon({ type }: { type: NotificationType["type"] }) {
  const Icon = iconMap[type];
  return <Icon className={cn("size-5 shrink-0", iconColorMap[type])} aria-hidden />;
}

function CopyButton({ detail }: { detail: ErrorDetail }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = formatErrorForClipboard(detail);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [detail]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "mt-2 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border/50 px-2.5 py-1 text-xs transition",
        "text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50",
      )}
      aria-label="نسخ تفاصيل الخطأ"
    >
      {copied ? (
        <>
          <Check className="size-3 text-success" aria-hidden />
          <span>تم النسخ</span>
        </>
      ) : (
        <>
          <ClipboardCopy className="size-3" aria-hidden />
          <span>نسخ تفاصيل الخطأ</span>
        </>
      )}
    </button>
  );
}

function ProgressBar({ duration, type }: { duration: number; type: NotificationType["type"] }) {
  return (
    <span
      className={cn(
        "absolute bottom-0 left-0 h-0.5 rounded-full",
        progressColorMap[type],
      )}
      style={{
        animation: `toast-progress ${duration}ms linear forwards`,
      }}
    />
  );
}

function SingleToast({
  notification,
  onDismiss,
}: {
  notification: ExtendedNotification;
  onDismiss: () => void;
}) {
  const [exiting, setExiting] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRef = useRef(onDismiss);
  const touchStartRef = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const toastRef = useRef<HTMLDivElement>(null);

  dismissRef.current = onDismiss;

  const triggerDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => dismissRef.current(), EXIT_ANIMATION_MS);
  }, []);

  useEffect(() => {
    if (notification.type !== "error" && notification.duration && notification.duration > 0) {
      timerRef.current = setTimeout(triggerDismiss, notification.duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification.duration, notification.type, triggerDismiss]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - touchStartRef.current;
    setOffsetX(diff);
    if (Math.abs(diff) > 80) {
      setSwiped(true);
      triggerDismiss();
    }
  }, [triggerDismiss]);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(offsetX) < 80) {
      setOffsetX(0);
    }
  }, [offsetX]);

  return (
    <div
      ref={toastRef}
      role="alert"
      aria-live={notification.type === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-[var(--radius-panel)] border bg-surface p-4 shadow-lg backdrop-blur-xl",
        "data-[state=entering]:animate-toast-enter",
        "data-[state=exiting]:animate-toast-exit",
        "data-[state=swiped]:animate-toast-swipe",
        "dark:border-foreground/10 dark:bg-ink dark:shadow-2xl",
        bgMap[notification.type],
      )}
      data-state={swiped ? "swiped" : exiting ? "exiting" : "entering"}
      style={
        offsetX && !swiped
          ? { transform: `translateX(${offsetX}px)`, transition: "transform 0.05s linear" }
          : undefined
      }
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex gap-3">
        <ToastIcon type={notification.type} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              {notification.title}
              {notification.groupCount && notification.groupCount > 1 && (
                <span
                  className={cn(
                    "mr-1.5 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold leading-none text-white",
                    iconColorMap[notification.type].replace("text-", "bg-"),
                  )}
                >
                  {notification.groupCount}
                </span>
              )}
            </p>
            <button
              onClick={triggerDismiss}
              className={cn(
                "shrink-0 rounded-[var(--radius-control)] p-1 text-muted-foreground transition",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50",
              )}
              aria-label="إغلاق"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>

          {notification.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {notification.description}
            </p>
          )}

          {notification.error?.suggestion && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/70">
              <span className="inline-block rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                اقتراح
              </span>
              {notification.error.suggestion}
            </p>
          )}

          {notification.type === "error" && notification.error && (
            <CopyButton
              detail={{
                code: notification.error.code,
                message: notification.error.message,
                requestId: notification.requestId ?? "",
                timestamp: new Date().toISOString(),
              }}
            />
          )}
        </div>
      </div>

      {notification.type !== "error" && notification.duration && notification.duration > 0 && (
        <ProgressBar duration={notification.duration} type={notification.type} />
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ExtendedNotification[]>([]);
  const toastMapRef = useRef(new Map<string, ExtendedNotification>());

  const addToast = useCallback((notification: ExtendedNotification) => {
    const key = notification.groupKey;
    const existing = key ? toastMapRef.current.get(key) : undefined;

    if (existing) {
      const updated = {
        ...existing,
        id: crypto.randomUUID(),
        groupCount: (existing.groupCount ?? 1) + 1,
        _entered: true,
      };
      toastMapRef.current.set(key, updated);
      setToasts((prev) =>
        prev.map((t) => (t.id === existing.id ? updated : t)),
      );
      return;
    }

    const withEnter = { ...notification, _entered: true };
    if (key) toastMapRef.current.set(key, withEnter);

    setToasts((prev) => {
      const next = [withEnter, ...prev];
      if (next.length > MAX_VISIBLE_TOASTS) {
        const removed = next.pop()!;
        if (removed.groupKey) toastMapRef.current.delete(removed.groupKey);
      }
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const removed = prev.find((t) => t.id === id);
      if (removed?.groupKey) toastMapRef.current.delete(removed.groupKey);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  useEffect(() => {
    const unsub = notify.subscribe((n) => {
      addToast(n as ExtendedNotification);
    });
    return unsub;
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        className="fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 flex-col-reverse gap-2 sm:left-auto sm:right-4 sm:top-4 sm:translate-x-0 rtl:sm:left-4 rtl:sm:right-auto"
        aria-label="الإشعارات"
      >
        {toasts.map((t) => (
          <SingleToast key={t.id} notification={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return { toasts: ctx.toasts, toast: ctx.addToast, dismiss: ctx.removeToast };
}
