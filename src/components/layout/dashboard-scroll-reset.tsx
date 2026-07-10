"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

function scrollPageToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function DashboardScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!pathname?.startsWith("/dashboard")) return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    scrollPageToTop();
    const animationFrame = window.requestAnimationFrame(scrollPageToTop);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [pathname]);

  return null;
}
