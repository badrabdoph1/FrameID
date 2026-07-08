"use client";

import {
  AlertTriangle,
  Check,
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
import { formatErrorForClipboard } from "@/lib/errors/format-error";
import type {
  ErrorDetail,
  Notification as NotificationType,
} from "@/lib/errors/types";
import { cn } from "@/lib/utils/cn";

const MAX_VISIBLE_TOASTS = 5;
const EXIT_ANIMATION_MS = 250;

type ExtendedNotification = NotificationType & {
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
  success: "border-emerald-400/20 bg-emerald-500/10",
  error: "border-red-400/25 bg-red-500/10",
  warning: "border-amber-400/25 bg-amber-500/10",
  info: "border-sky-400/20 bg-sky-500/10",
};

const iconColorMap: Record<string, string> = {
  success: "text-emerald-300",
  error: "text-red-300",
  warning: "text-amber-300",
  info: "text-sky-300",
};

const progressColorMap: Record<string, string> = {
  success: "bg-emerald-300",
  error: "bg-red-300",
  warning: "bg-amber-300",
  info: "bg-sky-300",
};

function getBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
}

function getRoute(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.pathname}${window.location.search}`;
}

function buildFallbackDetail(notification: ExtendedNotification): ErrorDetail {
  return {
    code: notification.error?.code ?? "FID-UNK-001",
    message: notification.error?.message ?? notification.description ?? notification.title,
    suggestion: notification.suggestion ?? notification.error?.suggestion,
    requestId: notification.requestId ?? "client-only",
    correlationId: notification.correlationId,
    route: notification.route ?? getRoute(),
    timestamp: notification.createdAt ?? new Date().toISOString(),
    browser: getBrowser(),
    platform: typeof navigator === "undefined" ? "unknown" : navigator.platform,
    userAgent: typeof navigator === "undefined" ? undefined : navigator.userAgent,
  };
}

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
    window.setTimeout(() => setCopied(false), 2000);
  }, [detail]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "mt-3 inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs font-bold transition",
        "text-white/65 hover:border-white/20 hover:bg-white/10 hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50",
      )}
      aria-label="نسخ تفاصيل الخطأ"
    >
      {copied ? (
        <>
          <Check className="size-3 text-emerald-300" aria-hidden />
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
        "absolute bottom-0 left-0 h-0.5 rounded-full motion-reduce:hidden",
        progressColorMap[type],
      )}
      style={{ animation: `toast-progress ${duration}ms linear forwards` }}
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
  const detail = notification.detail ?? (notification.type === "error" ? buildFallbackDetail(notification) : null);

  dismissRef.current = onDismiss;

  const triggerDismiss = useCallback(() => {
    setExiting(true);
    window.setTimeout(() => dismissRef.current(), EXIT_ANIMATION_MS);
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
      role="alert"
      aria-live={notification.type === "error" ? "assertive" : "polite"}
      className={cn(
        "pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl",
        "bg-[#0d0f14]/95 text-[#fff7e8]",
        "data-[state=entering]:animate-toast-enter data-[state=exiting]:animate-toast-exit data-[state=swiped]:animate-toast-swipe motion-reduce:animate-none",
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
            <p className="text-sm font-black text-[#fff7e8]">
              {notification.title}
              {notification.groupCount && notification.groupCount > 1 && (
                <span className="mr-1.5 inline-flex size-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-black leading-none text-white/70">
                  {notification.groupCount}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={triggerDismiss}
              className="shrink-0 rounded-lg p-1 text-white/45 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
              aria-label="إغلاق"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>

          {notification.description ? (
            <p className="mt-1 text-sm leading-6 text-white/62">{notification.description}</p>
          ) : null}

          {(notification.suggestion || notification.error?.suggestion) ? (
            <p className="mt-2 rounded-xl border border-white/8 bg-white/5 px-2.5 py-2 text-xs leading-5 text-white/58">
              <span className="font-black text-[#f3cf73]">الحل المقترح: </span>
              {notification.suggestion ?? notification.error?.suggestion}
            </p>
          ) : null}

          {notification.type === "error" && detail ? (
            <div className="mt-2 grid gap-1.5 text-xs text-white/45">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span>Code: <b className="font-mono text-red-200">{detail.code}</b></span>
                <span>Request: <b className="font-mono text-white/65">{detail.requestId}</b></span>
              </div>
              <CopyButton detail={detail} />
            </div>
          ) : null}
        </div>
      </div>

      {notification.type !== "error" && notification.duration && notification.duration > 0 ? (
        <ProgressBar duration={notification.duration} type={notification.type} />
      ) : null}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ExtendedNotification[]>([]);
  const toastMapRef = useRef(new Map<string, ExtendedNotification>());

  const addToast = useCallback((notification: ExtendedNotification) => {
    const key = notification.groupKey;
    const existing = key ? toastMapRef.current.get(key) : undefined;

    if (existing && key) {
      const updated = {
        ...notification,
        id: existing.id,
        groupCount: (existing.groupCount ?? 1) + 1,
        _entered: true,
      };
      toastMapRef.current.set(key, updated);
      setToasts((prev) => prev.map((toast) => (toast.id === existing.id ? updated : toast)));
      return;
    }

    const withEnter = { ...notification, _entered: true };
    if (key) toastMapRef.current.set(key, withEnter);

    setToasts((prev) => {
      const next = [withEnter, ...prev];
      if (next.length > MAX_VISIBLE_TOASTS) {
        const removed = next.pop();
        if (removed?.groupKey) toastMapRef.current.delete(removed.groupKey);
      }
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const removed = prev.find((toast) => toast.id === id);
      if (removed?.groupKey) toastMapRef.current.delete(removed.groupKey);
      return prev.filter((toast) => toast.id !== id);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = notify.subscribe((notification) => {
      addToast(notification as ExtendedNotification);
    });
    return unsubscribe;
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        className="fixed left-1/2 top-4 z-[100] flex w-[calc(100%-1rem)] -translate-x-1/2 flex-col-reverse gap-2 sm:left-auto sm:right-4 sm:w-auto sm:translate-x-0 rtl:sm:left-4 rtl:sm:right-auto"
        aria-label="الإشعارات"
      >
        {toasts.map((toast) => (
          <SingleToast key={toast.id} notification={toast} onDismiss={() => removeToast(toast.id)} />
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
