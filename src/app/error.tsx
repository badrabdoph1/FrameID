"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, LayoutDashboard } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4 text-center">
      <div className="mx-auto max-w-md rounded-[var(--radius-panel)] border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="size-7 text-danger" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">500</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">حصل خطأ غير متوقع</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          في مشكلة تقنية مؤقتة. جرّب مرة أخرى، أو ارجع للرئيسية أو لوحة التحكم.
        </p>
        {error.digest ? (
          <p className="mt-3 rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            كود الخطأ: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="size-4" aria-hidden />
            جرب تاني
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="size-4" aria-hidden />
            الرئيسية
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2"
          >
            <LayoutDashboard className="size-4" aria-hidden />
            لوحة التحكم
          </Link>
        </div>
      </div>
    </main>
  );
}
