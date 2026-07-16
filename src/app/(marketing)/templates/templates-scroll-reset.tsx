"use client";

import { useEffect } from "react";

const TEMPLATES_GRID_HASH = "#templates-grid";

export function TemplatesScrollReset() {
  useEffect(() => {
    if (window.location.hash !== TEMPLATES_GRID_HASH) return;

    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", cleanUrl);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
  }, []);

  return null;
}
