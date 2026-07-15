"use client";

import { useEffect } from "react";

export function GuideBreathing({
  active,
  targetSelector,
}: {
  active: boolean;
  targetSelector: string;
}) {
  useEffect(() => {
    if (!active) return;

    const el = document.querySelector(targetSelector) as HTMLElement | null;
    if (!el) return;

    el.classList.add("lg-breathing");

    return () => {
      el.classList.remove("lg-breathing");
    };
  }, [active, targetSelector]);

  return null;
}
