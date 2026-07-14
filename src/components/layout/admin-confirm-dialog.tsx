"use client"

import { useCallback, useEffect, useId, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type AdminConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning" | "default"
  loading?: boolean
}

export function AdminConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "تأكيد", cancelLabel = "إلغاء", variant = "danger", loading = false }: AdminConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const handleEscape = useCallback((event: KeyboardEvent) => { if (event.key === "Escape" && !loading) onClose() }, [loading, onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener("keydown", handleEscape)
    cancelRef.current?.focus()
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, handleEscape])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={loading} className="admin-scale-in relative z-10 w-full max-w-sm rounded-xl border border-white/8 bg-[#0a0a0a] p-6 shadow-2xl">
        <button type="button" aria-label="إغلاق نافذة التأكيد" onClick={onClose} disabled={loading} className="absolute left-3 top-3 grid size-11 place-items-center rounded-xl text-white/40 transition hover:bg-white/6 hover:text-white disabled:opacity-40"><X className="size-4" /></button>
        <span className={cn("mb-4 grid size-12 place-items-center rounded-xl", variant === "danger" && "bg-red-500/10", variant === "warning" && "bg-amber-500/10", variant === "default" && "bg-white/6")}><AlertTriangle className={cn("size-6", variant === "danger" && "text-red-400", variant === "warning" && "text-amber-400", variant === "default" && "text-white/40")} /></span>
        <h2 id={titleId} className="text-lg font-semibold text-white">{title}</h2>
        <p id={descriptionId} className="mt-1 text-sm leading-6 text-white/50">{description}</p>
        <div className="mt-6 flex gap-3">
          <button ref={cancelRef} type="button" onClick={onClose} disabled={loading} className="min-h-11 flex-1 rounded-lg border border-white/8 px-4 text-sm font-extrabold text-white/60 transition hover:bg-white/6 hover:text-white disabled:opacity-40">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={cn("min-h-11 flex-1 rounded-lg px-4 text-sm font-extrabold transition disabled:opacity-40", variant === "danger" && "bg-red-500 text-white hover:bg-red-600", variant === "warning" && "bg-amber-500 text-[#17120a] hover:bg-amber-600", variant === "default" && "bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-[#17120a] hover:opacity-90")}>{loading ? "جارٍ التنفيذ..." : confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}
