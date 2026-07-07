"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="size-6 text-danger" />
        </div>
        <h2 className="text-xl font-bold">حدث خطأ في لوحة الإدارة</h2>
        <p className="mt-2 text-sm text-muted-foreground">نأسف للإزعاج، يرجى المحاولة مرة أخرى.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-foreground/90"
          >
            <RefreshCw className="size-4" />
            إعادة المحاولة
          </button>
          <Link
            href="/admin"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            <LayoutDashboard className="size-4" />
            لوحة الإدارة
          </Link>
        </div>
      </div>
    </div>
  )
}
