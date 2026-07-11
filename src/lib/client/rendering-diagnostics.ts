export type KnownProblemSignature = {
  matchAll: string[];
  exclude?: string[];
};

export type RenderingSafetyConfig = {
  forceUserIds?: string[];
  forceDeviceIds?: string[];
  knownProblemSignatures?: KnownProblemSignature[];
  fallbackWhenBackdropUnsupported?: boolean;
};

type NavigatorUAData = {
  mobile?: boolean;
  platform?: string;
  brands?: Array<{ brand: string; version: string }>;
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
};

type NavigatorWithUAData = Navigator & {
  userAgentData?: NavigatorUAData;
  standalone?: boolean;
};

export type RenderingMetadata = {
  deviceId: string;
  userAgent: string;
  platform: string | null;
  platformVersion: string | null;
  manufacturer: string | null;
  model: string | null;
  androidVersion: string | null;
  browserName: string | null;
  browserVersion: string | null;
  webViewVersion: string | null;
  pwaInstalled: boolean;
  safeRenderingEnabled: boolean;
  safeRenderingReason: string;
  backdropFilterSupported: boolean;
  backdropFilterInUse: boolean;
  backdropFilterLayerCount: number;
  devicePixelRatio: number;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  colorDepth: number;
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
  maxTouchPoints: number;
  gpuVendor: string | null;
  gpuRenderer: string | null;
  route: string;
};

export type BrowserDiagnosticEvent = {
  id: string;
  type: string;
  timestamp: string;
  route: string;
  details?: Record<string, string | number | boolean | null>;
};

const DEVICE_ID_KEY = "frameid:rendering-device-id";
const EVENT_BUFFER_KEY = "frameid:browser-event-buffer";
const EVENT_BUFFER_LIMIT = 20;

function randomDeviceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function randomEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateRenderingDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const stored = window.localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
    const created = randomDeviceId();
    window.localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return "storage-unavailable";
  }
}

function sanitizeEventDetails(details: BrowserDiagnosticEvent["details"]) {
  if (!details) return undefined;
  return Object.fromEntries(
    Object.entries(details)
      .slice(0, 20)
      .map(([key, value]) => [key.slice(0, 80), typeof value === "string" ? value.slice(0, 500) : value]),
  );
}

export function getBrowserDiagnosticEvents(): BrowserDiagnosticEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(EVENT_BUFFER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-EVENT_BUFFER_LIMIT) as BrowserDiagnosticEvent[] : [];
  } catch {
    return [];
  }
}

export function recordBrowserDiagnosticEvent(
  type: string,
  details?: BrowserDiagnosticEvent["details"],
): BrowserDiagnosticEvent | null {
  if (typeof window === "undefined") return null;
  const event: BrowserDiagnosticEvent = {
    id: randomEventId(),
    type: type.slice(0, 100),
    timestamp: new Date().toISOString(),
    route: `${window.location.pathname}${window.location.search}`,
    details: sanitizeEventDetails(details),
  };

  try {
    const events = [...getBrowserDiagnosticEvents(), event].slice(-EVENT_BUFFER_LIMIT);
    window.sessionStorage.setItem(EVENT_BUFFER_KEY, JSON.stringify(events));
  } catch {
    // The buffer is best-effort and must never affect the dashboard.
  }

  return event;
}

export function clearBrowserDiagnosticEvents() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(EVENT_BUFFER_KEY);
  } catch {
    // Ignore restricted storage environments.
  }
}

function parseVersion(pattern: RegExp, userAgent: string) {
  return userAgent.match(pattern)?.[1] ?? null;
}

function parseBrowser(userAgent: string) {
  const edge = parseVersion(/EdgA?\/([\d.]+)/i, userAgent);
  if (edge) return { name: "Edge", version: edge };
  const samsung = parseVersion(/SamsungBrowser\/([\d.]+)/i, userAgent);
  if (samsung) return { name: "Samsung Internet", version: samsung };
  const chrome = parseVersion(/(?:Chrome|CriOS)\/([\d.]+)/i, userAgent);
  if (chrome) return { name: "Chrome", version: chrome };
  const firefox = parseVersion(/(?:Firefox|FxiOS)\/([\d.]+)/i, userAgent);
  if (firefox) return { name: "Firefox", version: firefox };
  const safari = parseVersion(/Version\/([\d.]+).*Safari/i, userAgent);
  if (safari) return { name: "Safari", version: safari };
  return { name: null, version: null };
}

function parseAndroidVersion(userAgent: string) {
  return parseVersion(/Android\s+([\d.]+)/i, userAgent);
}

function parseLegacyAndroidModel(userAgent: string) {
  const value = userAgent.match(/Android[^;]*;\s*(?:[a-z]{2}(?:-[A-Z]{2})?;\s*)?([^;)]+?)(?:\s+Build\/[^;)]+)?[;)]/i)?.[1]?.trim();
  return value && value !== "wv" ? value : null;
}

function inferManufacturer(model: string | null) {
  if (!model) return null;
  const known = ["Samsung", "Xiaomi", "Redmi", "POCO", "OPPO", "OnePlus", "realme", "Huawei", "HONOR", "vivo", "TECNO", "Infinix", "Motorola", "Nokia", "Google"];
  return known.find((name) => model.toLowerCase().includes(name.toLowerCase())) ?? null;
}

function getGpuInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl || !("getExtension" in gl)) return { vendor: null, renderer: null };
    const webgl = gl as WebGLRenderingContext;
    const extension = webgl.getExtension("WEBGL_debug_renderer_info");
    if (!extension) return { vendor: null, renderer: null };
    return {
      vendor: String(webgl.getParameter(extension.UNMASKED_VENDOR_WEBGL) ?? "") || null,
      renderer: String(webgl.getParameter(extension.UNMASKED_RENDERER_WEBGL) ?? "") || null,
    };
  } catch {
    return { vendor: null, renderer: null };
  }
}

function inspectBackdropUsage() {
  const supported = typeof CSS !== "undefined" && (
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)")
  );
  let count = 0;
  try {
    for (const element of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const style = window.getComputedStyle(element);
      if ((style.backdropFilter && style.backdropFilter !== "none") || ((style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter ?? "none") !== "none") {
        count += 1;
      }
    }
  } catch {
    count = 0;
  }
  return { supported, count };
}

export async function collectRenderingMetadata(overrides?: Partial<Pick<RenderingMetadata, "safeRenderingEnabled" | "safeRenderingReason">>): Promise<RenderingMetadata> {
  const navigatorWithHints = navigator as NavigatorWithUAData;
  const userAgent = navigator.userAgent;
  const browser = parseBrowser(userAgent);
  const uaData = navigatorWithHints.userAgentData;
  let highEntropy: Record<string, unknown> = {};

  try {
    highEntropy = await uaData?.getHighEntropyValues?.(["architecture", "bitness", "model", "platformVersion", "fullVersionList", "wow64"]) ?? {};
  } catch {
    highEntropy = {};
  }

  const model = typeof highEntropy.model === "string" && highEntropy.model.trim()
    ? highEntropy.model.trim()
    : parseLegacyAndroidModel(userAgent);
  const platform = uaData?.platform ?? navigator.platform ?? null;
  const platformVersion = typeof highEntropy.platformVersion === "string" ? highEntropy.platformVersion : null;
  const webViewVersion = /;\s*wv\)/i.test(userAgent) || /\bwv\b/i.test(userAgent)
    ? parseVersion(/Version\/([\d.]+)/i, userAgent) ?? browser.version
    : null;
  const backdrop = inspectBackdropUsage();
  const gpu = getGpuInfo();
  const root = document.documentElement;

  return {
    deviceId: getOrCreateRenderingDeviceId(),
    userAgent,
    platform,
    platformVersion,
    manufacturer: inferManufacturer(model),
    model,
    androidVersion: parseAndroidVersion(userAgent),
    browserName: browser.name,
    browserVersion: browser.version,
    webViewVersion,
    pwaInstalled: window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || navigatorWithHints.standalone === true,
    safeRenderingEnabled: overrides?.safeRenderingEnabled ?? root.classList.contains("frameid-rendering-safe"),
    safeRenderingReason: overrides?.safeRenderingReason ?? root.dataset.renderingModeReason ?? "unknown",
    backdropFilterSupported: backdrop.supported,
    backdropFilterInUse: backdrop.count > 0,
    backdropFilterLayerCount: backdrop.count,
    devicePixelRatio: window.devicePixelRatio,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    colorDepth: window.screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    deviceMemory: typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number" ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null : null,
    maxTouchPoints: navigator.maxTouchPoints,
    gpuVendor: gpu.vendor,
    gpuRenderer: gpu.renderer,
    route: `${window.location.pathname}${window.location.search}`,
  };
}

export async function reportRenderingDiagnostic(category: "rendering-report" | "client-error", details: { message: string; stack?: string | null; code?: string | null }) {
  try {
    const metadata = await collectRenderingMetadata();
    await fetch("/api/client-diagnostics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category, ...details, metadata }),
      keepalive: true,
    });
  } catch {
    // Diagnostics must never interrupt the customer workflow.
  }
}
