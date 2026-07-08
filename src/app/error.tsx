"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-dvh items-center justify-center bg-background p-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-danger-soft">
            <AlertTriangle className="size-8 text-danger" />
          </div>
          <h1 className="text-3xl font-bold">آسفين، حصل خطأ غير متوقع</h1>
          <p className="mt-3 text-muted-foreground leading-7">
            في مشكلة تقنية حالياً. فريقنا بيشتغل على إصلاحها. جرب تاني بعد شوية.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground/60">
              كود الخطأ: {error.digest}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-6 text-sm font-semibold text-background transition hover:bg-foreground/90"
            >
              <RefreshCw className="size-4" />
              جرب تاني
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-6 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <Home className="size-4" />
              الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
