"use client";

import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export type AutoSaveIndicatorProps = {
  status: AutoSaveStatus;
  message?: string;
  lastSaved?: Date;
  onRetry?: () => void;
};

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function AutoSaveIndicator({
  status,
  message,
  lastSaved,
  onRetry,
}: AutoSaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all",
        status === "saving" && "bg-champagne/10 text-champagne",
        status === "saved" && "bg-success/10 text-success",
        status === "error" && "bg-danger/10 text-danger",
      )}
      role="status"
      aria-live="polite"
    >
      {status === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin shrink-0" />
          <span>{message ?? "جاري الحفظ..."}</span>
        </>
      )}

      {status === "saved" && (
        <>
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>{message ?? "تم الحفظ"}</span>
          {lastSaved && (
            <span className="opacity-70" dir="ltr">
              {formatTime(lastSaved)}
            </span>
          )}
        </>
      )}

      {status === "error" && (
        <>
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{message ?? "حدث خطأ في الحفظ"}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mr-1 inline-flex items-center gap-1 rounded-md border border-current/20 px-2 py-0.5 text-[12px] font-semibold transition hover:bg-current/10"
              aria-label="إعادة المحاولة"
            >
              <RefreshCw className="size-3" />
              إعادة
            </button>
          )}
        </>
      )}
    </div>
  );
}
