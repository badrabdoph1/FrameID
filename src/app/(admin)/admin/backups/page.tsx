import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { isGitHubBackupConfigured } from "@/lib/env";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  rebuildFromGitHubAction,
  prepareMigrationBackupAction,
} from "@/app/(admin)/admin/backups/actions";
import { PendingForm, PendingButton } from "@/components/admin/pending-button";
import {
  handleCreateBackup,
  handleRestoreLatestGitHubBackup,
  handleRestoreWorkspaceBackup,
  handleVerifyWorkspaceBackup,
  handleDeleteWorkspaceBackup,
  handleUpdateBackupSettings,
  handleVerifyAllBackups,
} from "@/app/(admin)/admin/backups/server-actions";
import { createPrismaAdminBackupCenterRepository } from "@/modules/admin/prisma-admin-backup-center-repository";
import { SUPPORTED_BACKUP_TYPES, getBackupPolicy, type SupportedBackupType } from "@/modules/backups/backup-policy";
import { reconcileProductionGitHubBackupCatalog } from "@/modules/backups/production-github-backup-catalog";
import { BackupMetricsSection } from "./components/BackupMetricsSection";
import { BackupCreationSection } from "./components/BackupCreationSection";
import { BackupRestoreSection } from "./components/BackupRestoreSection";
import { BackupListSection } from "./components/BackupListSection";
import { BackupSettingsSection } from "./components/BackupSettingsSection";
import { BackupLogsSection } from "./components/BackupLogsSection";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | undefined>> };
export type BackupJobRow = {
  id: string;
  type: string;
  status: string;
  trigger: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  localPath: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  githubPath: string | null;
  githubBranch: string | null;
  githubCommitSha: string | null;
  localVerified: boolean;
  githubUploaded: boolean;
  remoteVerified: boolean;
  retentionApplied: boolean;
  auditLogged: boolean;
};
type RestoreRow = {
  id: string;
  backupJobId: string;
  type: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};
type BackupSettingRow = {
  type: SupportedBackupType;
  enabled: boolean;
  schedule: string;
  retentionCount: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
};

export default async function AdminBackupsPage({ searchParams }: Props) {
  await requireAdminPermission("backups", "view");
  await reconcileProductionGitHubBackupCatalog();
  const params = await searchParams;
  const repository = createPrismaAdminBackupCenterRepository(prisma);
  const center = (await repository.getBackupCenter()) as {
    settings: BackupSettingRow[];
    jobs: BackupJobRow[];
    restores: RestoreRow[];
  };

  const settings = SUPPORTED_BACKUP_TYPES.map((type) => {
    const policy = getBackupPolicy(type);
    const saved = center.settings.find((item) => item.type === type);
    return {
      type,
      enabled: saved?.enabled ?? true,
      schedule: saved?.schedule ?? policy.schedule,
      retentionCount: saved?.retentionCount ?? policy.retentionCount,
      lastRunAt: saved?.lastRunAt ?? null,
      nextRunAt: saved?.nextRunAt ?? null,
    };
  });
  const jobs = center.jobs.filter((job) => SUPPORTED_BACKUP_TYPES.includes(job.type as SupportedBackupType));
  const restores = center.restores.filter((item) => SUPPORTED_BACKUP_TYPES.includes(item.type as SupportedBackupType));
  const completed = jobs.filter((job) => job.status === "COMPLETED").length;
  const failed = jobs.filter((job) => job.status === "FAILED").length;
  const storageUsed = jobs.reduce((sum, job) => sum + (job.sizeBytes ?? 0), 0);
  const latestCompleted = jobs.find((j) => j.status === "COMPLETED");
  const justCompleted = params.job ? jobs.find((job) => job.id === params.job) : undefined;
  const latestBackupDate = jobs[0] ? formatDate(jobs[0].createdAt) : null;
  const latestRestoreDate = restores[0] ? formatDate(restores[0].createdAt) : null;

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { action: { contains: "BACKUP" } },
        { action: { contains: "RESTORE" } },
        { action: { contains: "SCHEDULER" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, action: true, entityId: true, metadata: true, createdAt: true },
  });

  return (
    <AdminPageShell badge="النظام" title="مركز النسخ الاحتياطي" description="إنشاء النسخ الاحتياطية واستعادتها وحمايتك عند النقل بين الاستضافات.">
      <Feedback params={params} job={justCompleted} />
      <GitHubStatusBanner />
      <RebuildBanner />

      <BackupMetricsSection
        completed={completed}
        failed={failed}
        storageUsed={storageUsed}
        latestBackupDate={latestBackupDate}
        latestRestoreDate={latestRestoreDate}
      />

      <BackupCreationSection onCreateBackup={handleCreateBackup} />

      <BackupRestoreSection
        latestCompleted={latestCompleted}
        migrationActionLabel="ذهاب طوارئ"
        onPrepareMigrationBackup={prepareMigrationBackupAction}
        onRestoreLatestGitHubBackup={handleRestoreLatestGitHubBackup}
        onRestoreWorkspaceBackup={handleRestoreWorkspaceBackup}
      />

      <BackupListSection
        jobs={jobs}
        latestCompleted={latestCompleted}
        onRestoreWorkspaceBackup={handleRestoreWorkspaceBackup}
        onVerifyWorkspaceBackup={handleVerifyWorkspaceBackup}
        onDeleteWorkspaceBackup={handleDeleteWorkspaceBackup}
      />

      <BackupSettingsSection
        settings={settings}
        onUpdateBackupSettings={handleUpdateBackupSettings}
        onVerifyAllBackups={handleVerifyAllBackups}
      />

      <BackupLogsSection auditLogs={auditLogs} />
    </AdminPageShell>
  );
}

function Feedback({ params, job }: { params: Record<string, string | undefined>; job?: BackupJobRow }) {
  if (params.error) return <Banner tone="danger">{params.details ?? params.error}</Banner>;
  if (job?.status === "COMPLETED") return <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-4 text-sm font-bold text-emerald-200"><p>اكتملت النسخة على Railway ووصلت إلى GitHub بعد Remote Verify.</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-lg border border-emerald-400/20 px-2 py-1">الفرع: {job.githubBranch}</span><span className="rounded-lg border border-emerald-400/20 px-2 py-1">Commit: {job.githubCommitSha?.slice(0, 12)}</span><span className="rounded-lg border border-emerald-400/20 px-2 py-1">المراحل: {formatPipelineStages(job)}</span>{job.githubPath ? <a href={job.githubPath} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-300/30 px-2 py-1 text-emerald-100 underline">فتح النسخة على GitHub</a> : null}</div><p className="mt-2 text-xs text-emerald-100/65">النسخ عملية تشغيل داخل Railway، لذلك لا تنشئ Deployment أو Commit على main؛ Commit النسخة موجود في الفرع الموضح أعلاه.</p></div>;
  if (params.started) return <Banner tone="success">تم إنشاء النسخة بنجاح.</Banner>;
  if (params.restored) return <Banner tone="success">تمت الاستعادة بنجاح. قد تحتاج لتحديث الصفحة لرؤية التغييرات.</Banner>;
  if (params.deleted) return <Banner tone="success">تم حذف النسخة.</Banner>;
  if (params.verified && params.valid !== undefined) {
    const valid = Number(params.valid);
    const invalid = Number(params.invalid);
    return <Banner tone={invalid === 0 ? "success" : "danger"}>{invalid === 0 ? `تم التحقق من ${valid} نسخة بنجاح.` : `فشل التحقق: ${invalid} نسخة من أصل ${valid + invalid}.`}</Banner>;
  }
  if (params.verified) return <Banner tone={params.verified === "1" ? "success" : "danger"}>{params.verified === "1" ? "النسخة سليمة." : "فشل التحقق من النسخة."}</Banner>;
  if (params["settings-updated"]) return <Banner tone="success">تم تحديث إعدادات النسخ.</Banner>;
  if (params.rebuilt) return <Banner tone="success">تمت إعادة بناء الفهرس من GitHub. تم استعادة {params.indexed ?? "0"} نسخة.</Banner>;
  return null;
}

function GitHubStatusBanner() {
  const configured = isGitHubBackupConfigured();
  if (configured) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs font-bold text-emerald-300">
        GitHub مُعد وهو التخزين الخارجي الرسمي. الملفات المحلية مؤقتة وتُحذف بعد اكتمال الرفع والتحقق والاحتفاظ والتدقيق.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs font-bold text-amber-300">
      النسخ الاحتياطي متوقف: GitHub غير مُعد، ولا يُسمح باعتبار أي نسخة محلية نسخة مكتملة. أضف <span className="font-mono">BACKUP_GITHUB_TOKEN</span> و <span className="font-mono">BACKUP_GITHUB_REPOSITORY</span> من Railway Variables.
    </div>
  );
}

function RebuildBanner() {
  const configured = isGitHubBackupConfigured();
  if (!configured) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-300/15 bg-sky-300/5 px-4 py-3">
      <p className="text-xs font-bold text-sky-300/80">إذا كانت السجلات فارغة بعد حذف قاعدة البيانات أو النقل لحساب جديد، أعد بناء الفهرس من فروع GitHub.</p>
      <PendingForm action={rebuildFromGitHubAction}>
        <PendingButton pendingText="جاري إعادة البناء..." className="rounded-xl bg-sky-300 px-4 py-2 text-xs font-black text-[#101820] transition hover:brightness-110">إعادة البناء من GitHub</PendingButton>
      </PendingForm>
    </div>
  );
}
function Banner({ tone, children }: { tone: "success" | "danger"; children: React.ReactNode }) { return <div className={tone === "success" ? "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300" : "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"}>{children}</div>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }); }
function formatPipelineStages(job: BackupJobRow): string { const flags = [job.localVerified, job.githubUploaded, job.remoteVerified, job.retentionApplied, job.auditLogged]; return flags.every(Boolean) ? "5/5 مكتملة" : `${flags.filter(Boolean).length}/5`; }
