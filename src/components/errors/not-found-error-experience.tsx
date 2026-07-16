"use client";

import { FileX, Home } from "lucide-react";
import Link from "next/link";

type Props = {
  homeHref?: string;
};

export function NotFoundErrorExperience({ homeHref = "/" }: Props) {
  return (
    <main className="relative grid min-h-[70dvh] place-items-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(122,117,108,0.06),transparent_50%)]" />
      <section className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-8 text-center shadow-[0_20px_60px_rgba(16,16,16,0.07)] sm:p-12" aria-labelledby="not-found-title">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-border/70 bg-muted/60">
          <FileX className="size-8 text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-8 text-xs font-bold tracking-[0.18em] text-muted-foreground">404</p>
        <h1 id="not-found-title" className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl">لم نعثر على هذه الصفحة</h1>
        <p className="mx-auto mt-5 max-w-md text-balance text-sm font-medium leading-7 text-muted-foreground sm:text-base">الرابط ممكن يكون اتغيّر أو الصفحة اتشالت. تأكد من الرابط أو ارجع للصفحة الرئيسية.</p>

        <div className="mt-10">
          <Link href={homeHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-8 text-sm font-bold text-background no-underline transition hover:-translate-y-0.5 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Home className="size-4" aria-hidden />
            الصفحة الرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
