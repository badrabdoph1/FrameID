import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { isGitHubBackupConfigured } from "@/lib/env";
import { resolveGitHubContentConfig } from "@/lib/content/git-sync";

export type CheckStatus = "ok" | "warning" | "error" | "unknown";

export interface PlatformCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
  reason?: string;
  latencyMs?: number;
}

export interface IntegrityResult {
  score: number;
  checks: PlatformCheck[];
  lastCheckAt: string;
  lastUpdatedAt: string | null;
}

export type StorageLocation = "database" | "git" | "storage" | "generated";

export interface StorageMapEntry {
  id: string;
  label: string;
  location: StorageLocation;
  locationLabel: string;
  status: CheckStatus;
  lastUpdatedAt: string | null;
  includedInBackup: boolean;
  restoredOnTransfer: boolean;
  detail?: string;
}

export interface SourceEntry {
  id: string;
  label: string;
  filePath: string;
  fileName: string;
  githubUrl: string | null;
  lastCommitSha: string | null;
  lastCommitDate: string | null;
}

export interface SyncPoint {
  id: string;
  label: string;
  timestamp: string | null;
  status: CheckStatus;
  detail?: string;
}

export interface HealthServiceCheck {
  id: string;
  label: string;
  status: CheckStatus;
  latencyMs?: number;
  detail?: string;
  reason?: string;
}

export interface RecoveryEstimate {
  estimatedMinutes: number;
  gitRestoreReady: boolean;
  databaseRestoreReady: boolean;
  uploadsRestoreReady: boolean;
  lastValidBackup: string | null;
  details: { label: string; value: string; status: CheckStatus }[];
}

export interface DependencyNode {
  id: string;
  label: string;
  group: string;
  dependsOn: string[];
  dependedBy: string[];
}

export interface VerificationResult {
  total: number;
  passed: number;
  warnings: number;
  errors: number;
  checks: PlatformCheck[];
}

export interface PlatformCenterData {
  integrity: IntegrityResult;
  storageMap: StorageMapEntry[];
  sourceExplorer: SourceEntry[];
  syncCenter: SyncPoint[];
  healthChecks: HealthServiceCheck[];
  recoveryEstimate: RecoveryEstimate;
  dependencyGraph: DependencyNode[];
  emergencyCenter: RecoveryEstimate;
}

export async function getPlatformCenterData(): Promise<PlatformCenterData> {
  const [integrity, storageMap, sourceExplorer, syncCenter, healthChecks, recoveryEstimate, dependencyGraph] = await Promise.all([
    computeIntegrity(),
    computeStorageMap(),
    computeSourceExplorer(),
    computeSyncCenter(),
    computeHealthChecks(),
    computeRecoveryEstimate(),
    computeDependencyGraph(),
  ]);

  return {
    integrity,
    storageMap,
    sourceExplorer,
    syncCenter,
    healthChecks,
    recoveryEstimate,
    dependencyGraph,
    emergencyCenter: recoveryEstimate,
  };
}

async function computeIntegrity(): Promise<IntegrityResult> {
  const checks: PlatformCheck[] = [];

  const gitDir = existsSync(join(process.cwd(), ".git"));
  checks.push({
    id: "git-repo",
    label: "مستودع Git موجود",
    status: gitDir ? "ok" : "error",
    detail: gitDir ? "المستودع موجود ومحلي" : "لا يوجد مستودع Git",
  });

  const githubConfig = resolveGitHubContentConfig();
  const githubBackupConfigured = isGitHubBackupConfigured();
  checks.push({
    id: "github-connected",
    label: "GitHub متصل",
    status: githubConfig ? "ok" : "error",
    detail: githubConfig ? `المستودع: ${githubConfig.repository} (${githubConfig.branch})` : "لم يتم ضبط متغيرات GitHub",
  });

  checks.push({
    id: "github-backup",
    label: "النسخ الاحتياطي على GitHub",
    status: githubBackupConfigured ? "ok" : "error",
    detail: githubBackupConfigured ? "مُعد وجاهز" : "BACKUP_GITHUB_TOKEN غير مضبوط",
  });

  const railwayToken = Boolean(process.env.RAILWAY_TOKEN);
  const railwayProject = Boolean(process.env.RAILWAY_PROJECT_ID);
  checks.push({
    id: "railway-connected",
    label: "Railway متصل",
    status: railwayToken && railwayProject ? "ok" : railwayProject ? "warning" : "unknown",
    detail: railwayToken && railwayProject
      ? `المشروع: ${process.env.RAILWAY_PROJECT_ID}`
      : railwayProject
        ? "RAILWAY_TOKEN غير مضبوط"
        : "ليس على Railway",
  });

  let _dbConnected = false;
  let dbLatencyMs = 0;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    _dbConnected = true;
    checks.push({
      id: "postgresql",
      label: "PostgreSQL يعمل",
      status: dbLatencyMs < 5000 ? "ok" : "warning",
      latencyMs: dbLatencyMs,
      detail: `متصل — ${dbLatencyMs}ms`,
    });
  } catch {
    checks.push({
      id: "postgresql",
      label: "PostgreSQL يعمل",
      status: "error",
      reason: "فشل الاتصال بقاعدة البيانات",
    });
  }

  const uploadsDir = existsSync(join(process.cwd(), "public", "uploads"));
  checks.push({
    id: "storage",
    label: "Storage يعمل",
    status: uploadsDir ? "ok" : "warning",
    detail: uploadsDir ? "مجلد uploads موجود" : "مجلد uploads غير موجود",
  });

  const [latestBackup, latestRestore, contentRevisionCount, themeCount, templateCount, planCount] = await Promise.all([
    prisma.backupJob.findFirst({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true, metadata: true } }),
    prisma.restoreJob.findFirst({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true } }),
    prisma.contentRevision.count(),
    prisma.theme.count({ where: { deletedAt: null } }),
    prisma.template.count({ where: { deletedAt: null } }),
    prisma.plan.count(),
  ]);

  const backupMeta = latestBackup?.metadata && typeof latestBackup.metadata === "object" && !Array.isArray(latestBackup.metadata)
    ? latestBackup.metadata as Record<string, unknown>
    : {};

  checks.push({
    id: "backup-operational",
    label: "النسخ الاحتياطي يعمل",
    status: latestBackup?.completedAt ? "ok" : "error",
    detail: latestBackup?.completedAt
      ? `آخر نسخة: ${new Date(latestBackup.completedAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}`
      : "لا توجد نسخة مكتملة",
  });

  checks.push({
    id: "restore-ready",
    label: "الاستعادة جاهزة",
    status: latestBackup?.completedAt && backupMeta.remoteVerified === true ? "ok" : latestBackup?.completedAt ? "warning" : "error",
    detail: latestBackup?.completedAt
      ? backupMeta.remoteVerified === true
        ? "تم التحقق عن بُعد"
        : "لم يتم التحقق عن بُعد بعد"
      : "لا توجد نسخة صالحة",
  });

  checks.push({
    id: "git-sync",
    label: "Git Sync يعمل",
    status: contentRevisionCount > 0 && githubConfig ? "ok" : githubConfig ? "warning" : "unknown",
    detail: contentRevisionCount > 0
      ? `${contentRevisionCount} مراجعة مسجلة`
      : githubConfig
        ? "لا توجد مراجعات بعد"
        : "Git Sync غير مُعد",
  });

  checks.push({
    id: "domain-layer",
    label: "طبقة الدومين تعمل",
    status: Boolean(process.env.NEXT_PUBLIC_APP_URL) ? "ok" : "warning",
    detail: process.env.NEXT_PUBLIC_APP_URL ?? "NEXT_PUBLIC_APP_URL غير مضبوط",
  });

  checks.push({
    id: "platform-data",
    label: "بيانات المنصة محفوظة",
    status: themeCount > 0 && templateCount > 0 ? "ok" : "warning",
    detail: `${themeCount} ثيم · ${templateCount} قالب · ${planCount} باقة`,
  });

  checks.push({
    id: "no-hardcoded-data",
    label: "لا توجد بيانات Platform Hardcoded",
    status: githubConfig && contentRevisionCount > 0 ? "ok" : "warning",
    detail: githubConfig && contentRevisionCount > 0
      ? "البيانات متزامنة مع GitHub"
      : "يُفضّل تزامن بيانات المنصة مع GitHub",
  });

  checks.push({
    id: "scheduler",
    label: "الجدولة التلقائية تعمل",
    status: process.env.BACKUP_SCHEDULER_ENABLED !== "false" ? "ok" : "warning",
    detail: process.env.BACKUP_SCHEDULER_ENABLED !== "false"
      ? `الفاصل: ${process.env.BACKUP_SCHEDULER_INTERVAL_MS ?? "43200000"}ms`
      : "الجدولة معطلة",
  });

  const requiredEnvVars = [
    { key: "DATABASE_URL", label: "DATABASE_URL" },
    { key: "SESSION_SECRET", label: "SESSION_SECRET" },
    { key: "ADMIN_SESSION_SECRET", label: "ADMIN_SESSION_SECRET" },
  ];
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v.key]);
  checks.push({
    id: "env-vars",
    label: "متغيرات البيئة الأساسية",
    status: missingEnvVars.length === 0 ? "ok" : "error",
    detail: missingEnvVars.length === 0
      ? "جميع المتغيرات الأساسية مضبوطة"
      : `ناقص: ${missingEnvVars.map((v) => v.label).join(", ")}`,
  });

  const passed = checks.filter((c) => c.status === "ok").length;
  const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0;

  return {
    score,
    checks,
    lastCheckAt: new Date().toISOString(),
    lastUpdatedAt: latestBackup?.completedAt?.toISOString() ?? null,
  };
}

async function computeStorageMap(): Promise<StorageMapEntry[]> {
  const [
    platformPageCount,
    themeCount,
    templateCount,
    planCount,
    paymentSettingsCount,
    notificationLogCount,
    backupJobCount,
    contentRevisionCount,
    mediaAssetCount,
    userCount,
    tenantCount,
    siteCount,
    subscriptionCount,
    paymentRequestCount,
    domainCount,
    latestBackup,
    latestRevision,
  ] = await Promise.all([
    prisma.platformPage.count(),
    prisma.theme.count({ where: { deletedAt: null } }),
    prisma.template.count({ where: { deletedAt: null } }),
    prisma.plan.count(),
    prisma.paymentSettings.count(),
    prisma.notificationLog.count({ where: { tenantId: null, deletedAt: null } }),
    prisma.backupJob.count(),
    prisma.contentRevision.count(),
    prisma.platformMediaAsset.count(),
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.site.count({ where: { deletedAt: null } }),
    prisma.subscription.count(),
    prisma.paymentRequest.count(),
    prisma.domain.count(),
    prisma.backupJob.findFirst({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true } }),
    prisma.contentRevision.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  const githubConfig = resolveGitHubContentConfig();
  const hasGitSync = Boolean(githubConfig) && contentRevisionCount > 0;

  return [
    {
      id: "platform-pages",
      label: "صفحات المنصة",
      location: "database",
      locationLabel: "PostgreSQL + Git",
      status: platformPageCount > 0 ? "ok" : "warning",
      lastUpdatedAt: latestRevision?.createdAt?.toISOString() ?? null,
      includedInBackup: true,
      restoredOnTransfer: hasGitSync,
      detail: `${platformPageCount} صفحة`,
    },
    {
      id: "themes",
      label: "الثيمات",
      location: "database",
      locationLabel: "PostgreSQL + Git",
      status: themeCount > 0 ? "ok" : "warning",
      lastUpdatedAt: latestRevision?.createdAt?.toISOString() ?? null,
      includedInBackup: true,
      restoredOnTransfer: hasGitSync,
      detail: `${themeCount} ثيم`,
    },
    {
      id: "templates",
      label: "القوالب",
      location: "database",
      locationLabel: "PostgreSQL + Git",
      status: templateCount > 0 ? "ok" : "warning",
      lastUpdatedAt: latestRevision?.createdAt?.toISOString() ?? null,
      includedInBackup: true,
      restoredOnTransfer: hasGitSync,
      detail: `${templateCount} قالب`,
    },
    {
      id: "plans",
      label: "الباقات",
      location: "database",
      locationLabel: "PostgreSQL + Git",
      status: planCount > 0 ? "ok" : "warning",
      lastUpdatedAt: latestRevision?.createdAt?.toISOString() ?? null,
      includedInBackup: true,
      restoredOnTransfer: hasGitSync,
      detail: `${planCount} باقة`,
    },
    {
      id: "payment-settings",
      label: "وسائل الدفع",
      location: "database",
      locationLabel: "PostgreSQL + Git",
      status: paymentSettingsCount > 0 ? "ok" : "warning",
      lastUpdatedAt: latestRevision?.createdAt?.toISOString() ?? null,
      includedInBackup: true,
      restoredOnTransfer: hasGitSync,
      detail: `${paymentSettingsCount} وسيلة`,
    },
    {
      id: "platform-messages",
      label: "رسائل الاشتراك",
      location: "database",
      locationLabel: "PostgreSQL + Git",
      status: notificationLogCount > 0 ? "ok" : "warning",
      lastUpdatedAt: latestRevision?.createdAt?.toISOString() ?? null,
      includedInBackup: true,
      restoredOnTransfer: hasGitSync,
      detail: `${notificationLogCount} رسالة`,
    },
    {
      id: "platform-media",
      label: "وسائط المنصة",
      location: "git",
      locationLabel: "GitHub",
      status: "ok",
      lastUpdatedAt: null,
      includedInBackup: true,
      restoredOnTransfer: true,
      detail: `${mediaAssetCount} ملف`,
    },
    {
      id: "backup-jobs",
      label: "النسخ الاحتياطية",
      location: "database",
      locationLabel: "PostgreSQL + GitHub",
      status: backupJobCount > 0 ? "ok" : "warning",
      lastUpdatedAt: latestBackup?.completedAt?.toISOString() ?? null,
      includedInBackup: false,
      restoredOnTransfer: false,
      detail: `${backupJobCount} نسخة`,
    },
    {
      id: "content-revisions",
      label: "سجل التعديلات",
      location: "database",
      locationLabel: "PostgreSQL",
      status: contentRevisionCount > 0 ? "ok" : "warning",
      lastUpdatedAt: latestRevision?.createdAt?.toISOString() ?? null,
      includedInBackup: true,
      restoredOnTransfer: true,
      detail: `${contentRevisionCount} مراجعة`,
    },
    {
      id: "customers",
      label: "العملاء",
      location: "database",
      locationLabel: "PostgreSQL",
      status: userCount > 0 ? "ok" : "unknown",
      lastUpdatedAt: null,
      includedInBackup: true,
      restoredOnTransfer: true,
      detail: `${userCount} عميل · ${tenantCount} حساب`,
    },
    {
      id: "sites",
      label: "المواقع",
      location: "database",
      locationLabel: "PostgreSQL",
      status: siteCount > 0 ? "ok" : "unknown",
      lastUpdatedAt: null,
      includedInBackup: true,
      restoredOnTransfer: true,
      detail: `${siteCount} موقع · ${domainCount} دومين`,
    },
    {
      id: "subscriptions",
      label: "الاشتراكات",
      location: "database",
      locationLabel: "PostgreSQL",
      status: subscriptionCount > 0 ? "ok" : "unknown",
      lastUpdatedAt: null,
      includedInBackup: true,
      restoredOnTransfer: true,
      detail: `${subscriptionCount} اشتراك`,
    },
    {
      id: "payments",
      label: "المدفوعات",
      location: "database",
      locationLabel: "PostgreSQL",
      status: paymentRequestCount > 0 ? "ok" : "unknown",
      lastUpdatedAt: null,
      includedInBackup: true,
      restoredOnTransfer: true,
      detail: `${paymentRequestCount} طلب دفع`,
    },
    {
      id: "customer-uploads",
      label: "صور العملاء",
      location: "storage",
      locationLabel: "Uploads (local)",
      status: existsSync(join(process.cwd(), "public", "uploads")) ? "ok" : "warning",
      lastUpdatedAt: null,
      includedInBackup: true,
      restoredOnTransfer: false,
      detail: "تحتاجRestore منفصل للنقل",
    },
    {
      id: "feature-flags",
      label: "الخصائص التجريبية",
      location: "database",
      locationLabel: "PostgreSQL + Git",
      status: "ok",
      lastUpdatedAt: latestRevision?.createdAt?.toISOString() ?? null,
      includedInBackup: true,
      restoredOnTransfer: hasGitSync,
    },
  ];
}

function computeSourceExplorer(): SourceEntry[] {
  const githubConfig = resolveGitHubContentConfig();
  const repoUrl = githubConfig
    ? `https://github.com/${githubConfig.repository}/tree/${githubConfig.branch}`
    : null;

  const sources: { id: string; label: string; path: string }[] = [
    { id: "admin-config", label: "إعدادات المنصة", path: "content/platform/admin-config.json" },
    { id: "prisma-schema", label: "مخطط قاعدة البيانات", path: "prisma/schema.prisma" },
    { id: "backup-policy", label: "سياسة النسخ الاحتياطي", path: "src/modules/backups/backup-policy.ts" },
    { id: "git-sync", label: "مزامنة المحتوى", path: "src/lib/content/git-sync.ts" },
    { id: "platform-config-git", label: "تزامن إعدادات المنصة", path: "src/modules/setup/platform-configuration-git.ts" },
    { id: "theme-contract", label: "عقد القوالب", path: "src/modules/themes/template-contract.ts" },
    { id: "theme-registry", label: "سجل الثيمات", path: "src/modules/themes/theme-registry.ts" },
    { id: "site-content", label: "خدمة محتوى المواقع", path: "src/modules/content/site-content-service.ts" },
    { id: "permissions", label: "الصلاحيات والأدوار", path: "src/modules/admin/permissions.ts" },
    { id: "navigation", label: "خريطة التنقل", path: "src/modules/admin/navigation.ts" },
    { id: "env-config", label: "إعدادات البيئة", path: "src/lib/env.ts" },
    { id: "health-api", label: "فحص الصحة", path: "src/app/api/health/route.ts" },
  ];

  return sources.map((s) => ({
    id: s.id,
    label: s.label,
    filePath: s.path,
    fileName: s.path.split("/").pop() ?? s.path,
    githubUrl: repoUrl ? `${repoUrl}/${s.path}` : null,
    lastCommitSha: null,
    lastCommitDate: null,
  }));
}

async function computeSyncCenter(): Promise<SyncPoint[]> {
  const [latestBackup, latestRestore, latestRevision] = await Promise.all([
    prisma.backupJob.findFirst({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true, type: true, metadata: true } }),
    prisma.restoreJob.findFirst({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true } }),
    prisma.contentRevision.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true, commitId: true, gitStatus: true } }),
  ]);

  const backupMeta = latestBackup?.metadata && typeof latestBackup.metadata === "object" && !Array.isArray(latestBackup.metadata)
    ? latestBackup.metadata as Record<string, unknown>
    : {};

  const railwayCommit = process.env.RAILWAY_GIT_COMMIT_SHA ?? null;

  return [
    {
      id: "last-commit",
      label: "آخر Commit",
      timestamp: null,
      status: railwayCommit ? "ok" : "unknown",
      detail: railwayCommit ? railwayCommit.slice(0, 12) : "غير متاح",
    },
    {
      id: "last-deploy",
      label: "آخر Deploy",
      timestamp: null,
      status: railwayCommit ? "ok" : "unknown",
      detail: process.env.RAILWAY_ENVIRONMENT_ID ? `Railway (${process.env.RAILWAY_ENVIRONMENT_ID})` : "محلي",
    },
    {
      id: "last-backup",
      label: "آخر Backup",
      timestamp: latestBackup?.completedAt?.toISOString() ?? null,
      status: latestBackup ? "ok" : "error",
      detail: latestBackup ? `${latestBackup.type} — Remote Verified: ${backupMeta.remoteVerified === true ? "نعم" : "لا"}` : "لا توجد نسخة",
    },
    {
      id: "last-restore",
      label: "آخر Restore",
      timestamp: latestRestore?.completedAt?.toISOString() ?? null,
      status: latestRestore ? "ok" : "unknown",
    },
    {
      id: "last-git-sync",
      label: "آخر Git Sync",
      timestamp: latestRevision?.createdAt?.toISOString() ?? null,
      status: latestRevision ? "ok" : "unknown",
      detail: latestRevision?.commitId ? `Commit: ${latestRevision.commitId.slice(0, 12)}` : latestRevision ? "تم بدون commit" : "لا توجد مزامنة",
    },
  ];
}

async function computeHealthChecks(): Promise<HealthServiceCheck[]> {
  const checks: HealthServiceCheck[] = [];

  const gitDir = existsSync(join(process.cwd(), ".git"));
  checks.push({
    id: "git",
    label: "Git",
    status: gitDir ? "ok" : "error",
    reason: gitDir ? undefined : "لا يوجد مستودع Git",
  });

  const githubConfig = resolveGitHubContentConfig();
  checks.push({
    id: "github",
    label: "GitHub",
    status: githubConfig ? "ok" : "error",
    detail: githubConfig ? githubConfig.repository : undefined,
    reason: githubConfig ? undefined : "متغيرات GitHub غير مضبوطة",
  });

  const railwayReady = Boolean(process.env.RAILWAY_TOKEN && process.env.RAILWAY_PROJECT_ID);
  checks.push({
    id: "railway",
    label: "Railway",
    status: railwayReady ? "ok" : process.env.RAILWAY_PROJECT_ID ? "warning" : "unknown",
    reason: railwayReady ? undefined : process.env.RAILWAY_PROJECT_ID ? "RAILWAY_TOKEN ناقص" : "ليس على Railway",
  });

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    checks.push({
      id: "postgresql",
      label: "PostgreSQL",
      status: latency < 5000 ? "ok" : "warning",
      latencyMs: latency,
      detail: `${latency}ms`,
    });
  } catch {
    checks.push({
      id: "postgresql",
      label: "PostgreSQL",
      status: "error",
      reason: "فشل الاتصال",
    });
  }

  const uploadsExist = existsSync(join(process.cwd(), "public", "uploads"));
  checks.push({
    id: "storage",
    label: "Storage",
    status: uploadsExist ? "ok" : "warning",
    reason: uploadsExist ? undefined : "مجلد uploads غير موجود",
  });

  const latestBackup = await prisma.backupJob.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true, metadata: true },
  });
  const backupMeta = latestBackup?.metadata && typeof latestBackup.metadata === "object" && !Array.isArray(latestBackup.metadata)
    ? latestBackup.metadata as Record<string, unknown>
    : {};

  checks.push({
    id: "backup",
    label: "Backup",
    status: latestBackup && backupMeta.remoteVerified === true ? "ok" : latestBackup ? "warning" : "error",
    detail: latestBackup?.completedAt
      ? new Date(latestBackup.completedAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })
      : undefined,
    reason: !latestBackup ? "لا توجد نسخة" : backupMeta.remoteVerified !== true ? "لم يتم التحقق عن بُعد" : undefined,
  });

  const latestRestore = await prisma.restoreJob.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });
  checks.push({
    id: "restore",
    label: "Restore",
    status: latestBackup ? "ok" : "error",
    detail: latestRestore?.completedAt
      ? `آخر استعادة: ${new Date(latestRestore.completedAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}`
      : latestBackup
        ? "جاهز للاستعادة"
        : undefined,
    reason: !latestBackup ? "لا توجد نسخة صالحة للاستعادة" : undefined,
  });

  const schedulerEnabled = process.env.BACKUP_SCHEDULER_ENABLED !== "false";
  checks.push({
    id: "scheduler",
    label: "Scheduler",
    status: schedulerEnabled ? "ok" : "warning",
    detail: schedulerEnabled ? "مفعّل" : "معطّل",
  });

  checks.push({
    id: "domain-layer",
    label: "Domain Layer",
    status: Boolean(process.env.NEXT_PUBLIC_APP_URL) ? "ok" : "warning",
    detail: process.env.NEXT_PUBLIC_APP_URL,
    reason: process.env.NEXT_PUBLIC_APP_URL ? undefined : "NEXT_PUBLIC_APP_URL غير مضبوط",
  });

  const missingCritical = ["SESSION_SECRET", "ADMIN_SESSION_SECRET"].filter((k) => !process.env[k]);
  checks.push({
    id: "environment",
    label: "Environment Variables",
    status: missingCritical.length === 0 ? "ok" : "error",
    detail: missingCritical.length === 0 ? "جميع المتغيرات الحساسة مضبوطة" : undefined,
    reason: missingCritical.length > 0 ? `ناقص: ${missingCritical.join(", ")}` : undefined,
  });

  const smtpConfigured = Boolean(process.env.SMTP_HOST);
  checks.push({
    id: "email",
    label: "Email (SMTP)",
    status: smtpConfigured ? "ok" : "warning",
    detail: smtpConfigured ? process.env.SMTP_HOST : undefined,
    reason: smtpConfigured ? undefined : "SMTP غير مُعد",
  });

  return checks;
}

async function computeRecoveryEstimate(): Promise<RecoveryEstimate> {
  const [latestBackup, latestFullBackup, backupJobs] = await Promise.all([
    prisma.backupJob.findFirst({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true, type: true, sizeBytes: true, metadata: true } }),
    prisma.backupJob.findFirst({ where: { status: "COMPLETED", type: "FULL" }, orderBy: { completedAt: "desc" }, select: { completedAt: true, sizeBytes: true, metadata: true } }),
    prisma.backupJob.findMany({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 10, select: { createdAt: true, completedAt: true, sizeBytes: true } }),
  ]);

  const githubConfig = resolveGitHubContentConfig();
  const gitRestoreReady = Boolean(githubConfig);
  const databaseRestoreReady = Boolean(latestBackup);
  const uploadsRestoreReady = Boolean(latestFullBackup);

  const completedDurations = backupJobs
    .filter((j) => j.completedAt)
    .map((j) => new Date(j.completedAt!).getTime() - new Date(j.createdAt).getTime())
    .filter((ms) => ms > 0);
  const avgMs = completedDurations.length > 0
    ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
    : 120_000;
  const estimatedMinutes = Math.max(2, Math.round(avgMs / 60_000) + 3);

  const details: { label: string; value: string; status: CheckStatus }[] = [
    { label: "Git Config", value: gitRestoreReady ? "جاهز" : "غير جاهز", status: gitRestoreReady ? "ok" : "error" },
    { label: "Database Backup", value: databaseRestoreReady ? "متاح" : "غير متاح", status: databaseRestoreReady ? "ok" : "error" },
    { label: "Uploads Backup", value: uploadsRestoreReady ? "متاح" : "غير متاح", status: uploadsRestoreReady ? "ok" : "error" },
    { label: "آخر نسخة صالحة", value: latestBackup?.completedAt
      ? new Date(latestBackup.completedAt).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })
      : "لا توجد", status: latestBackup ? "ok" : "error" },
    { label: "متوسط وقت الاستعادة", value: `~${estimatedMinutes} دقيقة`, status: "ok" },
  ];

  return {
    estimatedMinutes,
    gitRestoreReady,
    databaseRestoreReady,
    uploadsRestoreReady,
    lastValidBackup: latestBackup?.completedAt?.toISOString() ?? null,
    details,
  };
}

function computeDependencyGraph(): DependencyNode[] {
  const nodes: DependencyNode[] = [
    { id: "themes", label: "الثيمات", group: "المحتوى", dependsOn: [], dependedBy: ["templates"] },
    { id: "templates", label: "القوالب", group: "المحتوى", dependsOn: ["themes"], dependedBy: ["sites", "marketing"] },
    { id: "plans", label: "الباقات", group: "المالية", dependsOn: [], dependedBy: ["subscriptions", "marketing", "checkout"] },
    { id: "payment-settings", label: "وسائل الدفع", group: "المالية", dependsOn: [], dependedBy: ["payment-accounts"] },
    { id: "payment-accounts", label: "حسابات الدفع", group: "المالية", dependsOn: ["payment-settings"], dependedBy: ["payment-requests"] },
    { id: "payment-requests", label: "طلبات الدفع", group: "المالية", dependsOn: ["payment-accounts", "subscriptions"], dependedBy: [] },
    { id: "subscriptions", label: "الاشتراكات", group: "المالية", dependsOn: ["plans"], dependedBy: ["payment-requests", "tenants"] },
    { id: "tenants", label: "العملاء", group: "العملاء", dependsOn: ["subscriptions"], dependedBy: ["sites", "media-assets"] },
    { id: "sites", label: "المواقع", group: "العملاء", dependsOn: ["tenants", "templates"], dependedBy: ["domains", "sections"] },
    { id: "domains", label: "الدومينات", group: "العملاء", dependsOn: ["sites"], dependedBy: [] },
    { id: "sections", label: "أقسام المواقع", group: "العملاء", dependsOn: ["sites"], dependedBy: [] },
    { id: "media-assets", label: "وسائط العملاء", group: "العملاء", dependsOn: ["tenants"], dependedBy: [] },
    { id: "platform-pages", label: "صفحات المنصة", group: "المنصة", dependsOn: [], dependedBy: ["home-page"] },
    { id: "home-page", label: "الصفحة الرئيسية", group: "المنصة", dependsOn: ["platform-pages"], dependedBy: ["marketing"] },
    { id: "marketing", label: "التسويق", group: "المنصة", dependsOn: ["home-page", "templates", "plans"], dependedBy: ["checkout"] },
    { id: "checkout", label: "صفحة الدفع", group: "المنصة", dependsOn: ["plans", "marketing", "payment-settings"], dependedBy: [] },
    { id: "feature-flags", label: "الخصائص", group: "المنصة", dependsOn: [], dependedBy: ["dashboard", "sites"] },
    { id: "dashboard", label: "لوحة العميل", group: "العملاء", dependsOn: ["feature-flags"], dependedBy: [] },
  ];

  for (const node of nodes) {
    for (const dep of node.dependsOn) {
      const target = nodes.find((n) => n.id === dep);
      if (target && !target.dependedBy.includes(node.id)) {
        target.dependedBy.push(node.id);
      }
    }
  }

  return nodes;
}

export async function runVerification(): Promise<VerificationResult> {
  const integrity = await computeIntegrity();
  return {
    total: integrity.checks.length,
    passed: integrity.checks.filter((c) => c.status === "ok").length,
    warnings: integrity.checks.filter((c) => c.status === "warning").length,
    errors: integrity.checks.filter((c) => c.status === "error").length,
    checks: integrity.checks,
  };
}

export async function simulateRecovery(): Promise<{
  gitRestorable: { id: string; label: string }[];
  needsSeparateRestore: { id: string; label: string }[];
}> {
  const gitRestorable = [
    { id: "themes", label: "الثيمات" },
    { id: "templates", label: "القوالب" },
    { id: "plans", label: "الباقات" },
    { id: "payment-settings", label: "وسائل الدفع" },
    { id: "platform-pages", label: "صفحات المنصة" },
    { id: "feature-flags", label: "الخصائص التجريبية" },
    { id: "platform-messages", label: "رسائل الاشتراك" },
    { id: "platform-media", label: "الوسائط العامة" },
    { id: "home-page", label: "الصفحة الرئيسية" },
    { id: "marketing", label: "محتوى التسويق" },
    { id: "checkout", label: "إعدادات الدفع" },
  ];

  const needsSeparateRestore = [
    { id: "customers", label: "العملاء وحساباتهم" },
    { id: "sites", label: "المواقع وإعداداتها" },
    { id: "customer-uploads", label: "الصور المرفوعة" },
    { id: "subscriptions", label: "الاشتراكات" },
    { id: "payment-requests", label: "طلبات الدفع" },
    { id: "domains", label: "الدومينات" },
    { id: "sections", label: "محتوى المواقع" },
    { id: "gallery", label: "المعارض والصور" },
  ];

  return { gitRestorable, needsSeparateRestore };
}
