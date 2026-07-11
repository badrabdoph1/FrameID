"use client";

const ACTION_KEY = "frameid:error-actions:v1";
const ACTION_LIMIT = 12;

type NavigatorWithConnection = Navigator & {
  connection?: { effectiveType?: string; downlink?: number; saveData?: boolean };
  deviceMemory?: number;
};

export type ClientErrorContext = {
  browser: string;
  device: string;
  os: string;
  language: string;
  timezone: string;
  screenSize: string;
  referrer: string;
  connectionStatus: string;
  lastAction: string | null;
  metadata: Record<string, unknown>;
};

function browserName(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Chrome\//.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent)) return "Safari";
  return "Unknown";
}

function osName(userAgent: string): string {
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return navigator.platform || "Unknown";
}

function readActions(): Array<{ name: string; at: string }> {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(ACTION_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(-ACTION_LIMIT) : [];
  } catch {
    return [];
  }
}

export function recordErrorAction(name: string): void {
  if (typeof window === "undefined" || !name.trim()) return;
  try {
    const actions = [...readActions(), { name: name.trim().slice(0, 120), at: new Date().toISOString() }].slice(-ACTION_LIMIT);
    sessionStorage.setItem(ACTION_KEY, JSON.stringify(actions));
  } catch {
    // Diagnostics are best-effort and never interrupt the user.
  }
}

export function collectClientErrorContext(): ClientErrorContext {
  const nav = navigator as NavigatorWithConnection;
  const actions = readActions();
  const lastAction = actions.at(-1)?.name ?? null;
  const connection = nav.connection;
  return {
    browser: browserName(nav.userAgent),
    device: /Mobi|Android|iPhone|iPad/i.test(nav.userAgent) ? "Mobile/Tablet" : "Desktop",
    os: osName(nav.userAgent),
    language: nav.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    referrer: document.referrer,
    connectionStatus: navigator.onLine ? "online" : "offline",
    lastAction,
    metadata: {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      hardwareConcurrency: nav.hardwareConcurrency ?? null,
      deviceMemory: nav.deviceMemory ?? null,
      effectiveConnectionType: connection?.effectiveType ?? null,
      downlink: connection?.downlink ?? null,
      saveData: connection?.saveData ?? null,
      actions,
    },
  };
}

function errorData(error: unknown) {
  if (error instanceof Error) {
    const withDigest = error as Error & { digest?: string };
    return {
      message: error.message || "Client error",
      errorType: error.name || "Error",
      stack: error.stack ?? null,
      digest: withDigest.digest ?? null,
    };
  }
  return { message: String(error || "Client error"), errorType: typeof error, stack: null, digest: null };
}

export async function captureClientError(error: unknown): Promise<string | null> {
  try {
    const context = collectClientErrorContext();
    const response = await fetch("/api/customer-issues/capture", {
      method: "POST",
      headers: { "content-type": "application/json", "x-frameid-page": `${location.pathname}${location.search}` },
      body: JSON.stringify({ ...errorData(error), ...context }),
      keepalive: true,
    });
    if (!response.ok) return null;
    const payload = await response.json() as { occurrenceId?: string };
    return payload.occurrenceId ?? null;
  } catch {
    return null;
  }
}

export async function reportCapturedError(occurrenceId: string, customerNote?: string | null) {
  const response = await fetch("/api/customer-issues/report", {
    method: "POST",
    headers: { "content-type": "application/json", "x-frameid-page": `${location.pathname}${location.search}` },
    body: JSON.stringify({ occurrenceId, customerNote: customerNote?.trim() || null }),
    keepalive: true,
  });
  const payload = await response.json() as { issueId?: string; issueNumber?: string; merged?: boolean; message?: string };
  if (!response.ok || !payload.issueNumber) throw new Error(payload.message ?? "report-failed");
  return { issueId: payload.issueId ?? "", issueNumber: payload.issueNumber, merged: payload.merged ?? false };
}
