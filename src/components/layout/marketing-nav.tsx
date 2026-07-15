"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
}

interface MarketingNavProps {
  links?: NavLink[];
  previewMode?: boolean;
}

const defaultLinks: NavLink[] = [
  { href: "/templates", label: "القوالب" },
  { href: "/login", label: "تسجيل دخول" },
  { href: "/signup", label: "جرب مجاناً" }
];

export function MarketingNav({ links = defaultLinks, previewMode = false }: MarketingNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const signupLink = links.find((l) => l.href === "/signup");
  const otherLinks = links.filter((l) => l.href !== "/signup");

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
        className="fixed start-4 top-4 z-50 -translate-y-24 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        انتقال للمحتوى
      </Link>
      <header className={`${previewMode ? "sticky -mb-16" : "fixed"} inset-x-0 top-0 z-30 border-b border-white/8 bg-ink/60 backdrop-blur-xl`}>
        <nav className="container-page flex h-14 items-center justify-between gap-3 text-white md:h-16">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-normal md:text-xl"
            translate="no"
          >
            FrameID
          </Link>
          <div className="hidden items-center gap-0.5 text-sm md:flex">
            {otherLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-white/65 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {item.label}
              </Link>
            ))}
            {signupLink && (
              <Link
                href={signupLink.href}
                className="ms-2 inline-flex min-h-9 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {signupLink.label}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            {signupLink && (
              <Link
                href={signupLink.href}
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-white px-3.5 text-xs font-semibold text-ink transition hover:bg-white/90"
              >
                {signupLink.label}
              </Link>
            )}
            <button
              type="button"
              aria-label="القائمة"
              aria-controls="marketing-mobile-menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            </button>
          </div>
        </nav>
        {menuOpen ? (
          <nav
            id="marketing-mobile-menu"
            aria-label="قائمة الموقع"
            className="border-t border-white/8 bg-ink/95 px-4 py-3 text-white shadow-soft md:hidden"
          >
            <div className="container-page grid max-h-[calc(100dvh-4rem)] gap-2 overflow-y-auto px-0 pb-[env(safe-area-inset-bottom)]">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={
                    item.href === "/signup"
                      ? "inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-ink transition hover:bg-white/90"
                      : "inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/80 transition hover:bg-white/10"
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
