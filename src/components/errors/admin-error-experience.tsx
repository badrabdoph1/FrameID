"use client";

import { Check, ClipboardCopy, Home, MessageSquareMore, RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { captureClientError, collectClientErrorContext, reportCapturedError } from "@/lib/client/error-reporting";
import { formatErrorForClipboard } from "@/lib/errors/format-error";
import type { ErrorDetail } from "@/lib/errors/types";

type Props = {
  error?: unknown;
  homeHref?: string;
  onRetry?: () => void;
};

export function AdminErrorExperience({ error, homeHref = "/admin", onRetry }: Props) {
  const capturePromise = useRef<Promise<string | null> | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [issueNumber, setIssueNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!error || capturePromise.current) return;
    capturePromise.current = captureClientError(error);
  }, [error]);

  const copyErrorDetails = async () => {
    const ctx = collectClientErrorContext();
    const err = error instanceof Error ? error : undefined;
    const detail: ErrorDetail = {
      code: "CLIENT_ERROR",
      message: err?.message ?? "Unknown error",
      requestId: "client-side",
      timestamp: new Date().toISOString(),
      stack: err?.stack,
      browser: ctx.browser,
      platform: ctx.device,
      userAgent: ctx.metadata.userAgent as string | undefined,
      cause: err?.cause ? String(err.cause) : undefined,
      metadata: { ...ctx.metadata, connectionStatus: ctx.connectionStatus, language: ctx.language, timezone: ctx.timezone, screenSize: ctx.screenSize, referrer: ctx.referrer, lastAction: ctx.lastAction, os: ctx.os },
    };
    const text = formatErrorForClipboard(detail);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied
    }
  };

  const retry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  const report = async () => {
    if (status === "sending" || status === "sent") return;
    setStatus("sending");
    try {
      capturePromise.current ??= captureClientError(error ?? new Error("Manual admin report"));
      const occurrenceId = await capturePromise.current;
      if (!occurrenceId) throw new Error("capture-failed");
      const result = await reportCapturedError(occurrenceId, note);
      setIssueNumber(result.issueNumber);
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <main className="relative grid min-h-[70dvh] place-items-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(186,45,45,0.06),transparent_35%),radial-gradient(circle_at_75%_80%,rgba(216,180,106,0.10),transparent_30%)]" />
      <section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 p-6 text-center shadow-[0_28px_90px_rgba(16,16,16,0.11)] sm:p-9" aria-labelledby="admin-error-title">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-danger/25 bg-danger-soft/60 shadow-[0_0_0_10px_rgba(186,45,45,0.06)]">
          <ShieldAlert className="size-8 text-danger" aria-hidden />
        </div>
        <p className="mt-7 text-xs font-bold tracking-[0.18em] text-danger">لوحة الإدارة</p>
        <h1 id="admin-error-title" className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl">لوحة الإدارة تواجه مشكلة</h1>
        <p className="mx-auto mt-4 max-w-md text-balance text-sm font-medium leading-7 text-muted-foreground sm:text-base">
          حدث خلل أثناء تحميل لوحة الإدارة. جرّب إعادة التحميل. لو المشكلة استمرت، ابعت بلاغ للفريق التقني وهنتابع الموضوع.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={retry} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-bold text-background transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <RefreshCw className="size-4" aria-hidden />
            إعادة المحاولة
          </button>
          <Link href={homeHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-bold text-foreground no-underline transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Home className="size-4" aria-hidden />
            الرئيسية
          </Link>
          <button type="button" onClick={() => void report()} disabled={status === "sending" || status === "sent"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-champagne/40 bg-champagne-soft px-5 text-sm font-bold text-champagne-strong transition hover:-translate-y-0.5 hover:bg-champagne-soft/70 disabled:cursor-default disabled:translate-y-0 disabled:opacity-75 sm:col-span-2">
            {status === "sent" ? <Check className="size-4" aria-hidden /> : <MessageSquareMore className="size-4" aria-hidden />}
            {status === "sending" ? "جاري إرسال البلاغ…" : status === "sent" ? "تم إبلاغ الإدارة" : "إبلاغ الفريق التقني"}
          </button>
          <button type="button" onClick={() => void copyErrorDetails()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger-soft/50 px-5 text-sm font-bold text-danger transition hover:-translate-y-0.5 hover:bg-danger-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 sm:col-span-2">
            {copied ? <Check className="size-4" aria-hidden /> : <ClipboardCopy className="size-4" aria-hidden />}
            {copied ? "تم النسخ ✓" : "نسخ تفاصيل الخطأ"}
          </button>
        </div>

        {status === "sent" && issueNumber ? <p role="status" className="mt-4 text-sm font-bold text-success">تم إرسال البلاغ {issueNumber}</p> : null}
        {status === "failed" ? <p role="status" className="mt-4 text-sm font-bold text-warning">تعذر الإرسال دلوقتي. جرّب مرة تانية بعد لحظات.</p> : null}

        {status !== "sent" ? (
          <div className="mt-5">
            {!showNote ? (
              <button type="button" onClick={() => setShowNote(true)} className="text-xs font-bold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">إضافة ملاحظة اختيارية</button>
            ) : (
              <label className="grid gap-2 text-right text-xs font-bold text-muted-foreground">
                ملاحظتك الاختيارية
                <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 2_000))} maxLength={2_000} rows={3} className="resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20" placeholder="اكتب ملاحظة تقنية…" />
              </label>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
