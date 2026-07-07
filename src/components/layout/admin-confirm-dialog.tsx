"use client";

import { useEffect, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AdminConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
};

export function AdminConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "danger",
  loading,
}: AdminConfirmDialogProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-scale-in relative z-10 w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 flex size-7 items-center justify-center rounded-md text-white/30 transition hover:bg-white/[0.06] hover:text-white/60"
        >
          <X className="size-4" />
        </button>

        <div className={cn(
          "mb-4 flex size-12 items-center justify-center rounded-xl",
          variant === "danger" && "bg-red-500/10",
          variant === "warning" && "bg-amber-500/10",
          variant === "default" && "bg-white/[0.06]",
        )}>
          <AlertTriangle className={cn(
            "size-6",
            variant === "danger" && "text-red-400",
            variant === "warning" && "text-amber-400",
            variant === "default" && "text-white/40",
          )} />
        </div>

        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/50">{description}</p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-40",
              variant === "danger" && "bg-red-500 text-white hover:bg-red-600",
              variant === "warning" && "bg-amber-500 text-ink hover:bg-amber-600",
              variant === "default" && "bg-champagne text-ink hover:bg-champagne/90",
            )}
          >
            {loading ? "جاري..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
