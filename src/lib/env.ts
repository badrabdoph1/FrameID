const _requiredServerVars = [
  "DATABASE_URL",
  "SESSION_SECRET",
] as const;

const _requiredClientVars = [] as const;

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (typeof window !== "undefined") return "";
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
}

export const env = {
  DATABASE_URL: getEnvVar("DATABASE_URL"),
  SESSION_SECRET: getEnvVar("SESSION_SECRET"),
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || "",
  BACKUP_GITHUB_TOKEN: process.env.BACKUP_GITHUB_TOKEN || "",
  BACKUP_ENCRYPTION_KEY: process.env.BACKUP_ENCRYPTION_KEY || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "noreply@resend.dev",
  PASSWORD_RESET_DELIVERY_MODE: (process.env.PASSWORD_RESET_DELIVERY_MODE || "console") as "console" | "email" | "sms",
  SEED_SUPER_ADMIN_EMAIL: process.env.SEED_SUPER_ADMIN_EMAIL || "admin@example.com",
  SEED_SUPER_ADMIN_PASSWORD: process.env.SEED_SUPER_ADMIN_PASSWORD || "",
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
} as const;

export type Env = typeof env;
