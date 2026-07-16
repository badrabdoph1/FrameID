"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Headphones, Menu, X } from "lucide-react";

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
  { href: "/support", label: "الدعم" },
  { href: "/login", label: "تسجيل دخول" }
];

const SUPPORT_WHATSAPP = "https://wa.me/201038434472?text=مرحبًا،%20أحتاج%20دعم%20فني%20في%20FrameID.";

export function MarketingNav({ links = defaultLinks, previewMode = false }: MarketingNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const loginLink = links.find((l) => l.href === "/login");
  const otherLinks = links.filter((l) => l.href !== "/login");

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
        className="fixed start-4 top-4 z-50 -translate-y-24 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-lg transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        انتقال للمحتوى
      </Link>
      <header className={`${previewMode ? "sticky -mb-16" : "fixed"} inset-x-0 top-0 z-30 border-b border-white/8 bg-ink/85 backdrop-blur-xl`}>
        <nav className="container-page flex h-14 items-center justify-between gap-3 text-white md:h-16">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight md:text-xl"
            translate="no"
          >
            FrameID
          </Link>
          <div className="hidden items-center gap-1 text-sm md:flex">
            {otherLinks.map((item) => {
              const isSupport = item.href === "/support";
              return (
                <Link
                  key={item.href}
                  href={isSupport ? SUPPORT_WHATSAPP : item.href}
                  target={isSupport ? "_blank" : undefined}
                  rel={isSupport ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.82rem] font-medium text-white/70 transition-colors duration-150 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  {isSupport && <Headphones className="size-3.5" aria-hidden />}
                  {item.label}
                </Link>
              );
            })}
            {loginLink && (
              <Link
                href={loginLink.href}
                className="ms-2 inline-flex min-h-9 items-center justify-center rounded-full bg-white px-5 text-[0.82rem] font-semibold text-ink transition-all duration-150 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                {loginLink.label}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            {loginLink && (
              <Link
                href={loginLink.href}
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-ink transition-colors duration-150 hover:bg-white/90"
              >
                {loginLink.label}
              </Link>
            )}
            <button
              type="button"
              aria-label="القائمة"
              aria-controls="marketing-mobile-menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            </button>
          </div>
        </nav>
        {menuOpen ? (
          <nav
            id="marketing-mobile-menu"
            aria-label="قائمة الموقع"
            className="border-t border-white/10 bg-ink/95 px-4 py-4 text-white shadow-xl md:hidden"
          >
            <div className="container-page grid max-h-[calc(100dvh-4rem)] gap-2.5 overflow-y-auto px-0 pb-[env(safe-area-inset-bottom)]">
              {otherLinks.map((item) => {
                const isSupport = item.href === "/support";
                return (
                  <Link
                    key={item.href}
                    href={isSupport ? SUPPORT_WHATSAPP : item.href}
                    target={isSupport ? "_blank" : undefined}
                    rel={isSupport ? "noopener noreferrer" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-5 text-sm font-medium text-white/80 transition-colors duration-150 hover:bg-white/10"
                  >
                    {isSupport && <Headphones className="size-4" aria-hidden />}
                    {item.label}
                  </Link>
                );
              })}
              {loginLink && (
                <Link
                  href={loginLink.href}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-white/90"
                >
                  {loginLink.label}
                </Link>
              )}
            </div>
          </nav>
        ) : null}
      </header>
    </>
  );
}
