"use client";

import { useEffect } from "react";

const SAFE_RENDERING_CLASS = "frameid-rendering-safe";

function shouldUseSafeRenderingMode(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent;
  const isAndroid = /Android/i.test(userAgent);
  const supportsBackdropFilter =
    typeof CSS !== "undefined" &&
    (CSS.supports("backdrop-filter", "blur(1px)") ||
      CSS.supports("-webkit-backdrop-filter", "blur(1px)"));

  // Some Android GPU/WebView combinations report support for backdrop-filter
  // but still corrupt composited fixed and sticky layers during rapid repaints.
  return isAndroid || !supportsBackdropFilter;
}

export function RenderingSafetyMode() {
  useEffect(() => {
    const root = document.documentElement;
    const safeMode = shouldUseSafeRenderingMode();

    root.classList.toggle(SAFE_RENDERING_CLASS, safeMode);

    return () => {
      root.classList.remove(SAFE_RENDERING_CLASS);
    };
  }, []);

  return null;
}
