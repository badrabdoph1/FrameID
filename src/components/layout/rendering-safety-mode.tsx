"use client";

import { useEffect } from "react";

import {
  collectRenderingMetadata,
  getOrCreateRenderingDeviceId,
  reportRenderingDiagnostic,
  type RenderingSafetyConfig,
} from "@/lib/client/rendering-diagnostics";

const SAFE_RENDERING_CLASS = "frameid-rendering-safe";
const STORAGE_KEY = "frameid:safe-rendering";
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

function persistManualPreference(value: boolean | null) {
  try {
    if (value === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Safe mode still works for the current page when storage is blocked.
  }
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

export function RenderingSafetyMode({ config, userId }: RenderingSafetyModeProps) {
  useEffect(() => {
    let cancelled = false;
    const root = document.documentElement;
    const searchParams = new URLSearchParams(window.location.search);
    const queryPreference = searchParams.get("safe-rendering")?.toLowerCase();

    if (queryPreference && ENABLE_VALUES.has(queryPreference)) persistManualPreference(true);
    if (queryPreference && DISABLE_VALUES.has(queryPreference)) persistManualPreference(false);
    if (queryPreference === "auto" || queryPreference === "reset") persistManualPreference(null);

    async function resolveMode() {
      const manualPreference = readManualPreference();
      const deviceId = getOrCreateRenderingDeviceId();
      const supportsBackdropFilter = typeof CSS !== "undefined" && (
        CSS.supports("backdrop-filter", "blur(1px)") ||
        CSS.supports("-webkit-backdrop-filter", "blur(1px)")
      );

      let reason = "full-rendering-default";
      let enabled = false;

      if (manualPreference !== null) {
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
    }

    void resolveMode();

    const report = () => {
      void reportRenderingDiagnostic("rendering-report", {
        message: "Manual rendering issue report",
      });
    };
    window.addEventListener("frameid:report-rendering", report);

    return () => {
      cancelled = true;
      window.removeEventListener("frameid:report-rendering", report);
      root.classList.remove(SAFE_RENDERING_CLASS);
      delete root.dataset.renderingMode;
      delete root.dataset.renderingModeReason;
    };
  }, [config, userId]);

  return null;
}
