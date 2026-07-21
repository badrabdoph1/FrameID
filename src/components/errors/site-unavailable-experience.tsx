"use client";

import { ArrowLeft, Globe, MessageCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

import { DEFAULT_SUPPORT_WHATSAPP_NUMBER, toWhatsappHref } from "@/modules/support/support-utils";

type Props = {
  isOwner?: boolean;
  homeHref?: string;
  dashboardHref?: string;
  loginHref?: string;
};

export function SiteUnavailableExperience({
  isOwner = false,
  homeHref = "/",
  dashboardHref = "/dashboard",
  loginHref = "/login",
}: Props) {
  const retry = () => window.location.reload();
  const supportHref = toWhatsappHref(DEFAULT_SUPPORT_WHATSAPP_NUMBER, "مرحبًا، أحتاج دعم فني بخصوص الموقع.");

  return (
    <main className="relative grid min-h-[70dvh] place-items-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(122,117,108,0.06),transparent_50%)]" />
      <section
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-8 text-center shadow-[0_20px_60px_rgba(16,16,16,0.07)] sm:p-12"
        aria-labelledby="site-unavailable-title"
      >
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-border/70 bg-muted/60">
          <Globe className="size-8 text-muted-foreground" aria-hidden />
        </div>

        <p className="mt-8 text-xs font-bold tracking-[0.18em] text-muted-foreground">
          الموقع غير متاح
        </p>

        <h1
          id="site-unavailable-title"
          className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl"
        >
          يتعذر عرض هذه الصفحة حاليًا
        </h1>

        <p className="mx-auto mt-5 max-w-md text-balance text-sm font-medium leading-7 text-muted-foreground sm:text-base">
          الموقع غير متاح مؤقتًا. ربما يكون صاحبه بيعمل تحديث أو الاشتراك انتهى. جرّب مرة أخرى لاحقًا.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-bold text-background transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="size-4" aria-hidden />
            إعادة المحاولة
          </button>
          <Link
            href={homeHref}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-bold text-foreground no-underline transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            الصفحة الرئيسية
          </Link>
        </div>

        {isOwner ? (
          <div className="mt-8 border-t border-border/50 pt-6">
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 text-sm font-bold text-champagne-strong no-underline transition hover:text-champagne-strong/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-4" aria-hidden />
              إدارة موقعك من لوحة التحكم
            </Link>
          </div>
        ) : (
          <p className="mt-8 text-xs font-medium text-muted-foreground/80">
            إذا كنت صاحب الموقع، يمكنك{" "}
            <Link
              href={loginHref}
              className="font-bold text-foreground underline decoration-border underline-offset-4 hover:text-foreground/80"
            >
              تسجيل الدخول
            </Link>{" "}
            لإدارة موقعك والتحقق من حالته.
          </p>
        )}

        <div className="mt-6 border-t border-border/50 pt-5">
          <a
            href={supportHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground no-underline transition hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageCircle className="size-4" aria-hidden />
            للدعم الفني
          </a>
        </div>
      </section>
    </main>
  );
}
