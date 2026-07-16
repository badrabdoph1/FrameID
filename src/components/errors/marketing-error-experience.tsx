"use client";

import { Home, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";

type Props = {
  error?: unknown;
  homeHref?: string;
  onRetry?: () => void;
};

export function MarketingErrorExperience({ error: _error, homeHref = "/", onRetry }: Props) {
  const retry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  return (
    <main className="relative grid min-h-[70dvh] place-items-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(216,180,106,0.22),transparent_40%),radial-gradient(circle_at_70%_85%,rgba(201,169,110,0.10),transparent_35%)]" />
      <section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-champagne/30 bg-card/95 p-6 text-center shadow-[0_28px_90px_rgba(157,114,38,0.10)] sm:p-10" aria-labelledby="marketing-error-title">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-champagne/40 bg-gradient-to-br from-champagne-soft to-champagne-soft/50 shadow-[0_0_0_10px_rgba(216,180,106,0.10)]">
          <Sparkles className="size-8 text-champagne-strong" aria-hidden />
        </div>
        <p className="mt-7 text-xs font-bold tracking-[0.18em] text-champagne-strong">تحديث بسيط</p>
        <h1 id="marketing-error-title" className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl">بنجهّز لك تجربة أحسن</h1>
        <p className="mx-auto mt-4 max-w-md text-balance text-sm font-medium leading-7 text-muted-foreground sm:text-base">في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. جرّب تاني بعد لحظات.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={retry} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-bold text-background transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <RefreshCw className="size-4" aria-hidden />
            إعادة المحاولة
          </button>
          <Link href={homeHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-champagne/30 bg-champagne-soft/40 px-5 text-sm font-bold text-champagne-strong no-underline transition hover:-translate-y-0.5 hover:bg-champagne-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Home className="size-4" aria-hidden />
            الصفحة الرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
