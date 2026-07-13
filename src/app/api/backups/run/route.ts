import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createBackupJobService } from "@/modules/backups/backup-job-service";
import { env } from "@/lib/env";
import { isSupportedBackupType } from "@/modules/backups/backup-policy";
import { verifyGitHubActionsOidcToken } from "@/modules/backups/github-actions-oidc";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function log(level: "info" | "warn" | "error", msg: string, meta?: Record<string, unknown>) {
  const entry = { timestamp: new Date().toISOString(), level, ...meta };
  if (level === "error") console.error(`[backup-api] ${msg}`, entry);
  else if (level === "warn") console.warn(`[backup-api] ${msg}`, entry);
  else console.log(`[backup-api] ${msg}`, entry);
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  log("info", "=== Manual backup requested ===");

  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const requestedTrigger = request.headers.get("x-frameid-backup-trigger");
    const repository = process.env.BACKUP_GITHUB_REPOSITORY
      || [process.env.RAILWAY_GIT_REPO_OWNER, process.env.RAILWAY_GIT_REPO_NAME].filter(Boolean).join("/");
    const isGitHubActions = requestedTrigger === "GITHUB_ACTIONS";
    const authorized = isGitHubActions
      ? Boolean(repository) && await verifyGitHubActionsOidcToken(bearerToken, repository)
      : Boolean(env.CRON_SECRET) && authHeader === `Bearer ${env.CRON_SECRET}`;

    if (!authorized) {
      log("warn", "Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedType = body.type || "DATABASE";

    if (!isSupportedBackupType(requestedType)) {
      log("warn", `Invalid backup type requested: ${requestedType}`);
      return NextResponse.json({ error: "Invalid backup type. Must be DATABASE or FULL" }, { status: 400 });
    }

    const databaseUrl = env.DATABASE_URL;
    if (!databaseUrl) {
      log("error", "DATABASE_URL is not configured");
      return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
    }

    log("info", `Starting ${requestedType} backup`, {
      hasGitHubToken: Boolean(env.BACKUP_GITHUB_TOKEN),
      hasGitHubRepo: Boolean(process.env.BACKUP_GITHUB_REPOSITORY),
    });

    const service = createBackupJobService({
      repository: createPrismaBackupJobRepository(prisma as never),
      databaseUrl,
      platformVersion: process.env.npm_package_version ?? "0.1.0",
      backupGitHubToken: env.BACKUP_GITHUB_TOKEN,
      backupGitHubRepository: process.env.BACKUP_GITHUB_REPOSITORY,
    });

    const trigger = isGitHubActions ? "GITHUB_ACTIONS" : "CLI";
    const result = await service.runBackup({
      type: requestedType,
      trigger,
      initiatedById: trigger === "GITHUB_ACTIONS" ? "github-actions" : "api",
      note: `Manual API backup ${new Date().toISOString()}`,
    });

    const durationMs = Date.now() - startedAt;
    log("info", `✓ Manual backup completed`, { ...result, durationMs });

    return NextResponse.json({ success: true, ...result, durationMs });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "Backup failed";
    log("error", `✗ Manual backup failed`, { error: message, durationMs, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json({ error: message, durationMs }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger a backup",
    usage: { method: "POST", body: { type: "DATABASE | FULL" }, auth: "Bearer CRON_SECRET" },
  });
}
