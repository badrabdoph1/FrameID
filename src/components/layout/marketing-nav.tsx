"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

interface MarketingNavProps {
  links?: NavLink[];
}

const defaultLinks: NavLink[] = [
  { href: "/templates", label: "القوالب" },
  { href: "/login", label: "تسجيل دخول" },
  { href: "/signup", label: "جرب مجاناً" }
];

export function MarketingNav({ links = defaultLinks }: MarketingNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryLink = links.find((l) => l.href === "/signup");

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <Link
        href="#main-content"
        className="fixed start-4 top-4 z-50 -translate-y-24 rounded-[var(--radius-control)] bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
       انتقال للمحتوى
      </Link>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-ink/70 backdrop-blur-xl">
        <nav className="container-page flex h-16 items-center justify-between gap-3 text-white">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-normal"
            translate="no"
          >
            FrameID
          </Link>
          <div className="hidden min-w-0 items-center gap-1 text-sm md:flex">
            {links.map((item) => {
              const isPrimary = item.href === "/signup";
              const isQuiet = item.href === "/login";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isPrimary
                      ? "inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-ink transition-[background-color] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      : isQuiet
                        ? "hidden rounded-full px-3 py-2 text-white/72 transition-[background-color,color] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
                        : "rounded-full px-3 py-2 text-white/78 transition-[background-color,color] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            {primaryLink && (
              <Link
                href={primaryLink.href}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-ink transition-[background-color] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {primaryLink.label}
              </Link>
            )}
            <button
              type="button"
              aria-label="القائمة"
              aria-controls="marketing-mobile-menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            </button>
          </div>
        </nav>
        {menuOpen ? (
          <nav
            id="marketing-mobile-menu"
            aria-label="قائمة الموقع"
            className="border-t border-white/10 bg-ink/95 px-4 py-3 text-white shadow-soft md:hidden"
          >
            <div className="container-page grid max-h-[calc(100dvh-5rem)] gap-2 overflow-y-auto px-0 pb-[env(safe-area-inset-bottom)]">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={
                    item.href === "/signup"
                      ? "inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-white px-4 text-sm font-semibold text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      : "inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>
    </>
  );
}
