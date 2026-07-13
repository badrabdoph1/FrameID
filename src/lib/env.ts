function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
}

export interface Env {
  readonly DATABASE_URL: string;
  readonly SESSION_SECRET: string;
  readonly NEXT_PUBLIC_APP_URL: string;
  readonly NEXT_PUBLIC_GA_ID: string;
  readonly BACKUP_GITHUB_TOKEN: string;
  readonly BACKUP_DIR: string;
  readonly CRON_SECRET: string;
  readonly SMTP_HOST: string;
  readonly SMTP_PORT: number;
  readonly SMTP_SECURE: boolean;
  readonly SMTP_USERNAME: string;
  readonly SMTP_PASSWORD: string;
  readonly SMTP_FROM_NAME: string;
  readonly SMTP_FROM_EMAIL: string;
  readonly PASSWORD_RESET_DELIVERY_MODE: "console" | "email";
  readonly SEED_SUPER_ADMIN_EMAIL: string;
  readonly SEED_SUPER_ADMIN_PASSWORD: string;
  readonly isDev: boolean;
  readonly isProd: boolean;
}

export const env: Env = {
  get DATABASE_URL() { return requireEnv("DATABASE_URL"); },
  get SESSION_SECRET() { return requireEnv("SESSION_SECRET"); },
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || "",
  BACKUP_GITHUB_TOKEN: process.env.BACKUP_GITHUB_TOKEN || "",
  BACKUP_DIR: process.env.BACKUP_DIR || "",
  CRON_SECRET: process.env.CRON_SECRET || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USERNAME: process.env.SMTP_USERNAME || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || "FrameID",
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || "",
  PASSWORD_RESET_DELIVERY_MODE: (process.env.PASSWORD_RESET_DELIVERY_MODE || "console") as "console" | "email",
  SEED_SUPER_ADMIN_EMAIL: process.env.SEED_SUPER_ADMIN_EMAIL || "admin@example.com",
  SEED_SUPER_ADMIN_PASSWORD: process.env.SEED_SUPER_ADMIN_PASSWORD || "",
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
};

export function isGitHubBackupConfigured(): boolean {
  const token = process.env.BACKUP_GITHUB_TOKEN || "";
  return token.trim().length > 0;
}
