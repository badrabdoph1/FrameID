type PlatformUrlEnv = {
  NEXT_PUBLIC_APP_URL?: string;
  RAILWAY_PUBLIC_DOMAIN?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_URL?: string;
};

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//iu.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/u, "");
    return `${url.protocol}//${url.host}${path}`;
  } catch {
    return null;
  }
}

export function getPlatformBaseUrl(
  env: PlatformUrlEnv = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL
  }
): string {
  const candidates = [
    env.NEXT_PUBLIC_APP_URL,
    env.RAILWAY_PUBLIC_DOMAIN,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    env.VERCEL_URL
  ];

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);
    if (normalized) return normalized;
  }

  return "http://localhost:3000";
}
