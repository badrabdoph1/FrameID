import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getPlatformCenterData, runVerification } from "@/modules/platform/platform-center-service";
import { verifyPlatformAction, simulateRecoveryAction } from "./actions";
import { IntegrityCard } from "./components/IntegrityCard";
import { StorageMapTable } from "./components/StorageMapTable";
import { SourceExplorer } from "./components/SourceExplorer";
import { SyncCenter } from "./components/SyncCenter";
import { HealthCheckSection } from "./components/HealthCheckSection";
import { RecoverySimulation } from "./components/RecoverySimulation";
import { DependencyExplorer } from "./components/DependencyExplorer";
import { EmergencyCenter } from "./components/EmergencyCenter";
import { VerificationSection } from "./components/VerificationSection";
import { PlatformAuditLog } from "./components/PlatformAuditLog";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function AdminPlatformPage({ searchParams }: Props) {
  await requireAdminPermission("backups", "view");

  const params = await searchParams;

  const [data, verificationResult, auditLogs] = await Promise.all([
    getPlatformCenterData(),
    params.verified ? runVerification() : Promise.resolve(null),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: "BACKUP" } },
          { action: { contains: "RESTORE" } },
          { action: { contains: "PLATFORM" } },
          { action: { contains: "GIT" } },
          { action: { contains: "VERIFY" } },
          { action: { contains: "CONTENT" } },
          { action: { contains: "SCHEDULER" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, action: true, entityId: true, metadata: true, createdAt: true },
    }),
  ]);

  return (
    <AdminPageShell
      badge="القيادة"
      title="مركز القيادة"
      description="حالة المنصة بالكامل في مكان واحد — قبل أي نقل أو تحديث أو استعادة أو نشر."
    >
      <VerificationBanner params={params} result={verificationResult} />

      <IntegrityCard
        score={data.integrity.score}
        checks={data.integrity.checks}
        lastCheckAt={data.integrity.lastCheckAt}
        lastUpdatedAt={data.integrity.lastUpdatedAt}
      />

      <SyncCenter points={data.syncCenter} />

      <div className="grid gap-5 lg:grid-cols-2">
        <HealthCheckSection checks={data.healthChecks} />
        <EmergencyCenter
          estimatedMinutes={data.emergencyCenter.estimatedMinutes}
          gitRestoreReady={data.emergencyCenter.gitRestoreReady}
          databaseRestoreReady={data.emergencyCenter.databaseRestoreReady}
          uploadsRestoreReady={data.emergencyCenter.uploadsRestoreReady}
          lastValidBackup={data.emergencyCenter.lastValidBackup}
          details={data.emergencyCenter.details}
        />
      </div>

      <StorageMapTable entries={data.storageMap} />

      <SourceExplorer sources={data.sourceExplorer} />

      <div className="grid gap-5 lg:grid-cols-2">
        <VerificationSection onVerify={verifyPlatformAction} result={verificationResult} />
        <RecoverySimulation onSimulate={simulateRecoveryAction} />
      </div>

      <DependencyExplorer nodes={data.dependencyGraph} />

      <PlatformAuditLog logs={auditLogs} />
    </AdminPageShell>
  );
}

function VerificationBanner({
  params,
  result,
}: {
  params: Record<string, string | undefined>;
  result: { total: number; passed: number; warnings: number; errors: number } | null;
}) {
  if (params.simulate) {
    return (
      <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 px-4 py-3 text-sm font-bold text-sky-300">
        تمت المحاكاة: {params.gitCount} عنصر يُستعاد تلقائيًا من Git، و{params.manualCount} عنصر يحتاج Restore منفصل.
      </div>
    );
  }
  if (result) {
    const tone = result.errors > 0
      ? "border-red-500/20 bg-red-500/10 text-red-300"
      : result.warnings > 0
        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    return (
      <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${tone}`}>
        نتيجة التحقق: {result.passed} ناجح · {result.warnings} تحذير · {result.errors} خطأ من أصل {result.total} فحص.
      </div>
    );
  }
  return null;
}
