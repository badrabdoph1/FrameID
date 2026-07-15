import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";
import { Camera, Sparkles } from "lucide-react";

export function AuthShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen min-h-dvh bg-background">
      {/* Left Panel - Desktop Only */}
      <section className="relative hidden overflow-hidden bg-ink md:flex md:flex-col md:justify-between md:p-12 lg:p-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 font-display text-2xl font-semibold text-white">
          <div className="flex size-10 items-center justify-center rounded-xl bg-champagne/20 backdrop-blur-sm">
            <Camera className="size-5 text-champagne" />
          </div>
          <span>FrameID</span>
        </Link>

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-4 py-2 text-xs font-semibold text-champagne backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            منصة لكل مصور
          </div>
          <h2 className="text-4xl font-semibold leading-[1.15] text-white lg:text-5xl lg:leading-[1.1]">
            موقع احترافي،
            <br />
            <span className="text-champagne">رابط واحد</span>
            <br />
            يجمع كل شغلك
          </h2>
          <p className="mt-6 text-base leading-[1.7] text-white/60 lg:text-lg">
            اعرض صورك، باقاتك، وأسعارك في مكان واحد.
            <br />
            تجربة مجانية من أول دخول.
          </p>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 flex items-center gap-8 border-t border-white/10 pt-8">
          <div>
            <div className="text-2xl font-bold text-champagne">+500</div>
            <div className="mt-1 text-xs text-white/50">مصور نشط</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-2xl font-bold text-champagne">+10K</div>
            <div className="mt-1 text-xs text-white/50">حجز مكتمل</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-2xl font-bold text-champagne">4.9</div>
            <div className="mt-1 text-xs text-white/50">تقييم المستخدمين</div>
          </div>
        </div>
      </section>

      {/* Right Panel - Form */}
      <section className="flex min-h-dvh flex-col px-5 py-8 md:px-12 md:py-12 lg:px-20 lg:py-16">
        {/* Mobile Logo */}
        <Link href="/" className="mb-8 flex items-center gap-3 font-display text-xl font-semibold md:hidden">
          <div className="flex size-9 items-center justify-center rounded-lg bg-champagne/20">
            <Camera className="size-4 text-champagne" />
          </div>
          <span className="text-foreground">FrameID</span>
        </Link>

        {/* Form Container */}
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold leading-[1.2] text-foreground md:text-3xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-[1.7] text-muted-foreground md:text-base">
              {description}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm md:p-8">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
