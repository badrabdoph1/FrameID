type PlatformUrlEnv = {
  NEXT_PUBLIC_APP_URL?: string;
};

export function getPlatformBaseUrl(
  env: PlatformUrlEnv = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }
): string {
  return (env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/u, "");
}
