"use client";

import { Check, Home, MessageSquareMore, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { captureClientError, reportCapturedError } from "@/lib/client/error-reporting";

export type ErrorExperienceVariant = "generic" | "marketing" | "dashboard" | "admin" | "not-found" | "unauthorized" | "forbidden" | "session-expired" | "expired";

const COPY: Record<ErrorExperienceVariant, { eyebrow: string; title: string; message: string }> = {
  generic: { eyebrow: "تحديث بسيط", title: "بنجهّز لك تجربة أحسن", message: "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. جرّب تاني بعد لحظات." },
  marketing: { eyebrow: "تحديث بسيط", title: "بنجهّز لك تجربة أحسن", message: "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. جرّب تاني بعد لحظات." },
  dashboard: { eyebrow: "حفظنا مكانك", title: "لوحة التحكم هترجع خلال لحظات", message: "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. جرّب تاني بعد لحظات." },
  admin: { eyebrow: "متابعة داخلية", title: "مساحة الإدارة بتتحدّث", message: "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. جرّب تاني بعد لحظات." },
  "not-found": { eyebrow: "الرابط اتغيّر", title: "الصفحة دي مش متاحة دلوقتي", message: "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. جرّب تاني بعد لحظات." },
  unauthorized: { eyebrow: "حسابك آمن", title: "سجّل دخولك عشان تكمّل", message: "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. سجّل دخولك وكمل بعد لحظات." },
  forbidden: { eyebrow: "صلاحيات الوصول", title: "الصفحة دي متاحة لصلاحيات معينة", message: "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. تقدر ترجع للرئيسية وتكمّل بشكل طبيعي." },
  "session-expired": { eyebrow: "حسابك آمن", title: "جلسة الدخول انتهت", message: "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. سجّل دخولك وكمل بعد لحظات." },
  expired: { eyebrow: "تحديث التفعيل", title: "الخدمة هترجع خلال لحظات", message: "في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. لو أنت صاحب الموقع، سجّل دخولك لتحديث التفعيل." },
};

type Props = {
  variant: ErrorExperienceVariant;
  error?: unknown;
  homeHref?: string;
  onRetry?: () => void;
};

export function ErrorExperience({ variant, error, homeHref = "/", onRetry }: Props) {
  const copy = COPY[variant];
  const capturePromise = useRef<Promise<string | null> | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [issueNumber, setIssueNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!error || capturePromise.current) return;
    capturePromise.current = captureClientError(error);
  }, [error]);

  const retry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  const report = async () => {
    if (status === "sending" || status === "sent") return;
    setStatus("sending");
    try {
      capturePromise.current ??= captureClientError(error ?? new Error("Manual customer report"));
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(216,180,106,0.18),transparent_34%),radial-gradient(circle_at_82%_82%,rgba(47,107,255,0.08),transparent_28%)]" />
      <section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 p-6 text-center shadow-[0_28px_90px_rgba(16,16,16,0.11)] sm:p-9" aria-labelledby="error-experience-title">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-champagne/35 bg-champagne-soft/75 shadow-[0_0_0_10px_rgba(216,180,106,0.08)]">
          <Sparkles className="size-8 text-champagne-strong" aria-hidden />
        </div>
        <p className="mt-7 text-xs font-bold tracking-[0.18em] text-champagne-strong">{copy.eyebrow}</p>
        <h1 id="error-experience-title" className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl">{copy.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-balance text-sm font-medium leading-7 text-muted-foreground sm:text-base">{copy.message}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={retry} data-error-action="retry-error-page" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-bold text-background transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <RefreshCw className="size-4" aria-hidden />
            إعادة المحاولة
          </button>
          <Link href={homeHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-bold text-foreground no-underline transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Home className="size-4" aria-hidden />
            الصفحة الرئيسية
          </Link>
          <button type="button" onClick={() => void report()} disabled={status === "sending" || status === "sent"} data-error-action="report-customer-issue" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-champagne/40 bg-champagne-soft px-5 text-sm font-bold text-champagne-strong transition hover:-translate-y-0.5 hover:bg-champagne-soft/70 disabled:cursor-default disabled:translate-y-0 disabled:opacity-75 sm:col-span-2">
            {status === "sent" ? <Check className="size-4" aria-hidden /> : <MessageSquareMore className="size-4" aria-hidden />}
            {status === "sending" ? "جاري إرسال البلاغ…" : status === "sent" ? "تم إبلاغ الإدارة" : "إبلاغ الإدارة بالمشكلة"}
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
                <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 2_000))} maxLength={2_000} rows={3} className="resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20" placeholder="لو حابب، اكتب ملاحظة قصيرة…" />
              </label>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
