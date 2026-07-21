"use client";

import { Home, LogIn, ShieldX } from "lucide-react";
import Link from "next/link";

type Props = {
  homeHref?: string;
  loginHref?: string;
};

export function ForbiddenErrorExperience({ homeHref = "/", loginHref = "/login" }: Props) {
  return (
    <main className="relative grid min-h-[70dvh] place-items-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(148,98,0,0.06),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(122,117,108,0.04),transparent_35%)]" />
      <section className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-warning/20 bg-card/95 p-8 text-center shadow-[0_20px_60px_rgba(16,16,16,0.07)] sm:p-12" aria-labelledby="forbidden-title">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-warning/25 bg-warning-soft/70">
          <ShieldX className="size-8 text-warning" aria-hidden />
        </div>
        <p className="mt-8 text-xs font-bold tracking-[0.18em] text-warning">الوصول مقيد</p>
        <h1 id="forbidden-title" className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl">ليس لديك صلاحية للوصول</h1>
        <p className="mx-auto mt-5 max-w-md text-balance text-sm font-medium leading-7 text-muted-foreground sm:text-base">
          الصفحة دي محمية ومتاحة لحسابات معينة. لو عندك حساب تاني بصلاحيات أعلى، جرّب تسجّل دخول بيه. ولو حاسس إن في غلط، كلم المشرف.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link href={loginHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-bold text-background no-underline transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LogIn className="size-4" aria-hidden />
            تسجيل دخول بحساب آخر
          </Link>
          <Link href={homeHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-bold text-foreground no-underline transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Home className="size-4" aria-hidden />
            الصفحة الرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
