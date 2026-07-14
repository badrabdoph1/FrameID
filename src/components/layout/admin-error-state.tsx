"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type AdminErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function AdminErrorState({
  title = "تعذر تحميل البيانات",
  description = "تحقق من الاتصال ثم أعد المحاولة.",
  onRetry,
  className,
}: AdminErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-red-500/10 bg-red-500/5 px-6 py-16 text-center", className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-red-500/10">
        <AlertTriangle className="size-7 text-red-400" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-red-400">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-red-400/60">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2 text-sm font-extrabold text-red-300 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70">
          <RefreshCw className="size-4" aria-hidden />
          إعادة المحاولة
        </button>
      )}
    </div>
  )
}
