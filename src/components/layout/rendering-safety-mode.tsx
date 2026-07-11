"use client";

import { useEffect } from "react";

import {
  collectRenderingMetadata,
  getOrCreateRenderingDeviceId,
  recordBrowserDiagnosticEvent,
  reportRenderingDiagnostic,
  type RenderingSafetyConfig,
} from "@/lib/client/rendering-diagnostics";

const SAFE_RENDERING_CLASS = "frameid-rendering-safe";
const STORAGE_KEY = "frameid:safe-rendering";
const ERROR_DEDUPE_PREFIX = "frameid:diagnostic:";
const ENABLE_VALUES = new Set(["1", "true", "on", "enabled"]);
const DISABLE_VALUES = new Set(["0", "false", "off", "disabled"]);

type RenderingSafetyModeProps = {
  config?: RenderingSafetyConfig;
  userId?: string;
};

function readManualPreference(): boolean | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)?.toLowerCase();
    if (!value) return null;
    if (ENABLE_VALUES.has(value)) return true;
    if (DISABLE_VALUES.has(value)) return false;
  } catch {
    // Storage may be unavailable in private or restricted WebViews.
  }
  return null;
}

function readTemporaryDebugOverride(): boolean | null {
  const value = new URLSearchParams(window.location.search).get("safe-rendering")?.toLowerCase();
  if (!value || value === "auto" || value === "reset") return null;
  if (ENABLE_VALUES.has(value)) return true;
  if (DISABLE_VALUES.has(value)) return false;
  return null;
}

function matchesKnownSignature(config: RenderingSafetyConfig | undefined, metadata: Awaited<ReturnType<typeof collectRenderingMetadata>>) {
  if (!config?.knownProblemSignatures?.length) return false;
  const haystack = [
    metadata.userAgent,
    metadata.platform,
    metadata.platformVersion,
    metadata.model,
    metadata.browserName,
    metadata.browserVersion,
    metadata.webViewVersion,
    metadata.gpuRenderer,
  ].filter(Boolean).join(" ").toLowerCase();

  return config.knownProblemSignatures.some((signature) => {
    const required = signature.matchAll.map((part) => part.trim().toLowerCase()).filter(Boolean);
    const excluded = (signature.exclude ?? []).map((part) => part.trim().toLowerCase()).filter(Boolean);
    return required.length > 0 && required.every((part) => haystack.includes(part)) && excluded.every((part) => !haystack.includes(part));
  });
}

function shouldSendError(key: string) {
  try {
    const storageKey = `${ERROR_DEDUPE_PREFIX}${key.slice(0, 160)}`;
    if (window.sessionStorage.getItem(storageKey)) return false;
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // If session storage is unavailable, still send the diagnostic.
  }
  return true;
}

export function RenderingSafetyMode({ config, userId }: RenderingSafetyModeProps) {
  useEffect(() => {
    let cancelled = false;
    let resizeTimer: number | undefined;
    const root = document.documentElement;

    recordBrowserDiagnosticEvent("dashboard-mounted", {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      online: navigator.onLine,
    });

    async function resolveMode() {
      const debugOverride = readTemporaryDebugOverride();
      const manualPreference = readManualPreference();
      const deviceId = getOrCreateRenderingDeviceId();
      const supportsBackdropFilter = typeof CSS !== "undefined" && (
        CSS.supports("backdrop-filter", "blur(1px)") ||
        CSS.supports("-webkit-backdrop-filter", "blur(1px)")
      );

      let reason = "full-rendering-default";
      let enabled = false;

      // Query-string control is intentionally a temporary developer override.
      // It affects only the current page load and never writes to local storage.
      if (debugOverride !== null) {
        enabled = debugOverride;
        reason = debugOverride ? "debug-query-safe" : "debug-query-full";
      } else if (manualPreference !== null) {
        enabled = manualPreference;
        reason = manualPreference ? "manual-local-storage" : "manual-full-rendering";
      } else if (config?.forceUserIds?.includes(userId ?? "")) {
        enabled = true;
        reason = "feature-flag-user";
      } else if (config?.forceDeviceIds?.includes(deviceId)) {
        enabled = true;
        reason = "feature-flag-device";
      } else if (!supportsBackdropFilter && config?.fallbackWhenBackdropUnsupported === true) {
        enabled = true;
        reason = "missing-backdrop-filter-support";
      } else if (config?.knownProblemSignatures?.length) {
        const metadata = await collectRenderingMetadata({ safeRenderingEnabled: false, safeRenderingReason: reason });
        enabled = matchesKnownSignature(config, metadata);
        if (enabled) reason = "known-problem-signature";
      }

      if (cancelled) return;
      root.classList.toggle(SAFE_RENDERING_CLASS, enabled);
      root.dataset.renderingMode = enabled ? "safe" : "full";
      root.dataset.renderingModeReason = reason;
      recordBrowserDiagnosticEvent("rendering-mode-resolved", {
        mode: enabled ? "safe" : "full",
        reason,
        backdropFilterSupported: supportsBackdropFilter,
      });
    }

    void resolveMode();

    const report = () => {
      recordBrowserDiagnosticEvent("manual-rendering-report-requested", {
        renderingMode: root.dataset.renderingMode ?? "unknown",
        renderingReason: root.dataset.renderingModeReason ?? "unknown",
      });
      void reportRenderingDiagnostic("rendering-report", {
        message: "Manual rendering issue report",
      });
    };

    const handleWindowError = (event: ErrorEvent) => {
      const message = event.message || "Unhandled client error";
      const key = `${message}:${event.filename}:${event.lineno}:${event.colno}`;
      recordBrowserDiagnosticEvent("window-error", {
        message,
        filename: event.filename || null,
        line: event.lineno || 0,
        column: event.colno || 0,
      });
      if (!shouldSendError(key)) return;
      void reportRenderingDiagnostic("client-error", {
        message,
        stack: event.error instanceof Error ? event.error.stack ?? null : null,
        code: "window-error",
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "Unhandled promise rejection");
      recordBrowserDiagnosticEvent("unhandled-rejection", { message });
      if (!shouldSendError(`promise:${message}`)) return;
      void reportRenderingDiagnostic("client-error", {
        message,
        stack: reason instanceof Error ? reason.stack ?? null : null,
        code: "unhandled-rejection",
      });
    };

    const handleVisibilityChange = () => {
      recordBrowserDiagnosticEvent("visibility-change", { state: document.visibilityState });
    };
    const handleOnline = () => recordBrowserDiagnosticEvent("network-change", { online: true });
    const handleOffline = () => recordBrowserDiagnosticEvent("network-change", { online: false });
    const handleOrientationChange = () => recordBrowserDiagnosticEvent("orientation-change", {
      angle: window.screen.orientation?.angle ?? null,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
    const handleResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        recordBrowserDiagnosticEvent("viewport-resize", {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        });
      }, 180);
    };
    const handlePageHide = () => recordBrowserDiagnosticEvent("page-hide", { persisted: false });

    window.addEventListener("frameid:report-rendering", report);
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleResize);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      recordBrowserDiagnosticEvent("dashboard-unmounted");
      window.removeEventListener("frameid:report-rendering", report);
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      root.classList.remove(SAFE_RENDERING_CLASS);
      delete root.dataset.renderingMode;
      delete root.dataset.renderingModeReason;
    };
  }, [config, userId]);

  return null;
}
