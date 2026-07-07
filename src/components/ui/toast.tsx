"use client";

import {
  AlertTriangle,
  CheckCircle2,
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
import { formatErrorForClipboard } from "@/lib/errors/error-service";
import type {
  ErrorDetail,
  Notification as NotificationType,
  UserError,
} from "@/lib/errors/types";
import { cn } from "@/lib/utils/cn";

type ExtendedNotification = NotificationType & {
  _errorDetail?: ErrorDetail;
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

function ToastIcon({
  type,
}: {
  type: NotificationType["type"];
}) {
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
        "mt-2 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 py-1 text-xs transition",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/50",
      )}
      aria-label="نسخ تفاصيل الخطأ"
    >
      <ClipboardCopy className="size-3" aria-hidden />
      {copied ? "تم النسخ ✓" : "📋 نسخ تفاصيل الخطأ"}
    </button>
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (notification.duration && notification.duration > 0 && notification.type !== "error") {
      timerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(() => dismissRef.current(), 200);
      }, notification.duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification.duration, notification.type]);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => dismissRef.current(), 200);
  }, []);

  return (
    <div
      role="alert"
      aria-live={notification.type === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm gap-3 rounded-[var(--radius-panel)] border bg-surface p-4 shadow-lg backdrop-blur-xl transition-all",
        "data-[state=exiting]:opacity-0 data-[state=exiting]:translate-y-2",
        bgMap[notification.type],
      )}
      data-state={exiting ? "exiting" : "entering"}
    >
      <ToastIcon type={notification.type} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {notification.title}
          </p>
          <button
            onClick={handleDismiss}
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
          <p className="mt-1.5 text-xs text-muted-foreground/70">
            💡 {notification.error.suggestion}
          </p>
        )}

        {notification.type === "error" && notification.error && (
          <CopyButton
            detail={{
              code: notification.error.code,
              message: notification.error.message,
              requestId: "",
              timestamp: new Date().toISOString(),
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ExtendedNotification[]>([]);

  const addToast = useCallback((notification: ExtendedNotification) => {
    const id = notification.id;
    setToasts((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [...prev, notification];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
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
        className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2"
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
