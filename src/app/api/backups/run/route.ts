import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPrismaBackupJobRepository } from "@/modules/backups/prisma-backup-job-repository";
import { createBackupJobService } from "@/modules/backups/backup-job-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = (body.type || "FULL") as "DATABASE" | "UPLOADS" | "FULL";

    if (!["DATABASE", "UPLOADS", "FULL"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid backup type. Must be DATABASE, UPLOADS, or FULL" },
        { status: 400 }
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL is not configured" },
        { status: 500 }
      );
    }

    const service = createBackupJobService({
      repository: createPrismaBackupJobRepository(prisma as never),
      databaseUrl,
      platformVersion: process.env.npm_package_version ?? "0.1.0",
      backupGitHubToken: process.env.BACKUP_GITHUB_TOKEN,
      backupEncryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    });

    const result = await service.runManualBackup({
      type,
      initiatedById: "api",
      note: "API-triggered backup",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger a backup",
    usage: { body: { type: "DATABASE | UPLOADS | FULL" } },
  });
}
