import Link from "next/link";
import React from "react";

const navItems = [
  { href: "/templates", label: "القوالب", intent: "link" },
  { href: "/login", label: "دخول", intent: "quiet" },
  { href: "/signup", label: "إنشاء حساب", intent: "primary" }
];

export function MarketingNav() {
  return (
    <>
      <Link
        href="#main-content"
        className="fixed start-4 top-4 z-50 -translate-y-24 rounded-[var(--radius-control)] bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        تخطي إلى المحتوى
      </Link>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-ink/55 backdrop-blur-xl">
        <nav className="container-page flex h-16 items-center justify-between gap-3 text-white">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-normal"
            translate="no"
          >
            FrameID
          </Link>
          <div className="flex min-w-0 items-center gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.intent === "primary"
                    ? "inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-ink transition-[background-color] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    : item.intent === "quiet"
                      ? "hidden rounded-full px-3 py-2 text-white/72 transition-[background-color,color] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
                      : "rounded-full px-3 py-2 text-white/78 transition-[background-color,color] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
