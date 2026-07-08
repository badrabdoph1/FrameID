import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import {
  runBackupAction,
  restoreBackupAction,
  verifyBackupAction,
  verifyAllBackupsAction,
  deleteBackupAction,
  createSnapshotAction,
  checkAutoRestoreAction,
  updateBackupSettingsAction,
} from "@/app/(admin)/admin/backups/actions";
import { createPrismaAdminBackupCenterRepository } from "@/modules/admin/prisma-admin-backup-center-repository";
import { listBackupDirs } from "@/modules/backups/local-backup-artifact-writer";
import { createVerificationService } from "@/modules/backups/backup-verification-service";
import { buildBackupCenterViewModel } from "@/modules/backups/backup-center-view-model";
import { runBackupHealthCheck } from "@/modules/backups/backup-startup-health";
import { join } from "node:path";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    started?: string;
    restored?: string;
    backup?: string;
    error?: string;
    details?: string;
    verified?: string;
    "verified-all"?: string;
    valid?: string;
    invalid?: string;
    deleted?: string;
    snapshot?: string;
    "auto-restored"?: string;
    "auto-restore-check"?: string;
    needed?: string;
    "settings-updated"?: string;
  }>;
};

export default async function AdminBackupsPage({ searchParams }: Props) {
  await requireSuperAdminSession();
  const params = await searchParams;
  const repository = createPrismaAdminBackupCenterRepository(prisma);
  const backupCenter = await repository.getBackupCenter();
  const localBackups = await listBackupDirs();
  const verification = createVerificationService();
  const backupRoot = join(process.cwd(), "backups");
  const healthSummary = await verification.verifyAllBackups(backupRoot);
  const viewModel = await buildBackupCenterViewModel({
    prisma: prisma as never,
    backupRoot,
  });

  const healthCheck = await runBackupHealthCheck({
    prisma: prisma as never,
    backupRoot,
  });

  return (
    <AdminPageShell
      badge="التشغيل"
      title={`مركز المراقبة V3 — ${viewModel.healthStatus === "healthy" ? "سليم" : viewModel.healthStatus === "warning" ? "تحذير" : "حرج"}`}
      description="مراقبة شاملة للنسخ الاحتياطي والاستعادة والتحقق والصحة العامة"
    >
      {/* Alert Banner */}
      {viewModel.issues.length > 0 && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm mb-6 ${
            viewModel.healthStatus === "critical"
              ? "border-red-500/20 bg-red-500/10 text-red-400"
              : "border-amber-500/20 bg-amber-500/10 text-amber-400"
          }`}
        >
          <p className="font-medium mb-1">
            {viewModel.healthStatus === "critical"
              ? "مشاكل حرجة تحتاج إلى تدخل فوري"
              : "تحذيرات ينبغي مراجعتها"}
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {viewModel.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Status Messages */}
      {params.started && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 mb-6">
          تم إنشاء نسخة احتياطية والتحقق منها
        </div>
      )}
      {params.restored && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 mb-6">
          تمت استعادة النسخة: {params.backup}
        </div>
      )}
      {params["auto-restored"] && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 mb-6">
          تمت الاستعادة التلقائية بنجاح
        </div>
      )}
      {params["settings-updated"] && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 mb-6">
          تم تحديث الإعدادات
        </div>
      )}
      {params.snapshot && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 mb-6">
          تم إنشاء لقطة: {params.backup}
        </div>
      )}
      {params.verified === "1" && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 mb-6">
          النسخة {params.backup} سليمة
        </div>
      )}
      {params.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-6">
          <p className="font-medium">{params.details || params.error}</p>
        </div>
      )}

      {/* Health Dashboard Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        <HealthCard
          label="Total Backups"
          value={viewModel.backupSummary.total}
          tone={viewModel.backupSummary.total > 0 ? "success" : "default"}
        />
        <HealthCard
          label="Valid"
          value={viewModel.backupSummary.valid}
          tone={
            viewModel.backupSummary.valid === viewModel.backupSummary.total &&
            viewModel.backupSummary.total > 0
              ? "success"
              : viewModel.backupSummary.valid > 0
                ? "warning"
                : "default"
          }
        />
        <HealthCard
          label="Corrupted"
          value={viewModel.backupSummary.invalid}
          tone={viewModel.backupSummary.invalid === 0 ? "success" : "danger"}
        />
        <HealthCard
          label="Success Rate"
          value={(() => {
            const total = viewModel.backupSummary.valid + viewModel.backupSummary.invalid;
            return total > 0
              ? `${Math.round((viewModel.backupSummary.valid / total) * 100)}%`
              : "N/A";
          })()}
          tone={
            viewModel.backupSummary.invalid === 0
              ? "success"
              : viewModel.backupSummary.valid > 0
                ? "warning"
                : "danger"
          }
        />
        <HealthCard
          label="Restore Success"
          value={
            viewModel.restoreSummary.total > 0
              ? `${Math.round((viewModel.restoreSummary.successful / viewModel.restoreSummary.total) * 100)}%`
              : "N/A"
          }
          tone={
            viewModel.restoreSummary.failed === 0
              ? "success"
              : viewModel.restoreSummary.successful > 0
                ? "warning"
                : "default"
          }
        />
        <HealthCard
          label="Storage Used"
          value={formatBytes(viewModel.backupSummary.storageUsedBytes)}
          tone="default"
        />
        <HealthCard
          label="pg_dump"
          value={healthCheck.checks.pgDumpAvailable ? "OK" : "MISSING"}
          tone={healthCheck.checks.pgDumpAvailable ? "success" : "danger"}
        />
        <HealthCard
          label="psql"
          value={healthCheck.checks.psqlAvailable ? "OK" : "MISSING"}
          tone={healthCheck.checks.psqlAvailable ? "success" : "danger"}
        />
        <HealthCard
          label="tar"
          value={healthCheck.checks.tarAvailable ? "OK" : "MISSING"}
          tone={healthCheck.checks.tarAvailable ? "success" : "danger"}
        />
        <HealthCard
          label="DB Connection"
          value={healthCheck.checks.dbConnection ? "Connected" : "Disconnected"}
          tone={healthCheck.checks.dbConnection ? "success" : "danger"}
        />
        <HealthCard
          label="Storage"
          value={
            healthCheck.checks.storageReadable && healthCheck.checks.storageWritable
              ? "Read/Write"
              : "Degraded"
          }
          tone={
            healthCheck.checks.storageReadable && healthCheck.checks.storageWritable
              ? "success"
              : "danger"
          }
        />
        <HealthCard
          label="Scheduler"
          value={viewModel.schedulerStatus.active ? "Active" : "Inactive"}
          tone={viewModel.schedulerStatus.active ? "success" : "warning"}
        />
        <HealthCard
          label="Last Backup"
          value={viewModel.healthMetrics.find((m) => m.label === "Last Backup")?.value ?? "Never"}
          tone={
            viewModel.healthMetrics.find((m) => m.label === "Last Backup")?.tone ?? "default"
          }
        />
        <HealthCard
          label="Last Restore"
          value={viewModel.healthMetrics.find((m) => m.label === "Last Restore")?.value ?? "Never"}
          tone={
            viewModel.healthMetrics.find((m) => m.label === "Last Restore")?.tone ?? "default"
          }
        />
        <HealthCard
          label="Avg Duration"
          value={viewModel.healthMetrics.find((m) => m.label === "Avg Duration")?.value ?? "N/A"}
          tone="default"
        />
        <HealthCard
          label="Avg Size"
          value={viewModel.healthMetrics.find((m) => m.label === "Avg Size")?.value ?? "N/A"}
          tone="default"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form action={createSnapshotAction}>
          <button
            type="submit"
            className="rounded-lg bg-violet-600/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-600"
          >
            إنشاء لقطة كاملة
          </button>
        </form>
        <form action={checkAutoRestoreAction}>
          <button
            type="submit"
            className="rounded-lg border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/10"
          >
            فحص الاستعادة التلقائية
          </button>
        </form>
        <form action={verifyAllBackupsAction}>
          <button
            type="submit"
            className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/10"
          >
            التحقق من الكل
          </button>
        </form>
      </div>

      {/* Create Backup */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
        <h3 className="mb-4 text-sm font-medium text-white/60">
          إنشاء نسخة الآن
        </h3>
        <div className="flex flex-wrap gap-3">
          {(["DATABASE", "UPLOADS", "FULL"] as const).map((type) => (
            <form key={type} action={runBackupAction}>
              <input type="hidden" name="type" value={type} />
              <button
                type="submit"
                className="rounded-lg bg-champagne px-4 py-2 text-sm font-medium text-ink transition hover:bg-champagne/90"
              >
                {type === "DATABASE"
                  ? "قاعدة البيانات"
                  : type === "UPLOADS"
                    ? "الملفات المرفوعة"
                    : "نسخة كاملة"}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">
            الإعدادات والجدولة
          </h3>
          <div className="space-y-3">
            {backupCenter.settings.length > 0 ? (
              backupCenter.settings.map((setting) => (
                <form
                  key={setting.type}
                  action={updateBackupSettingsAction}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white/80">
                      {setting.type}
                    </p>
                    <AdminStatusBadge
                      tone={setting.enabled ? "success" : "default"}
                    >
                      {setting.enabled ? "مفعل" : "متوقف"}
                    </AdminStatusBadge>
                  </div>
                  <input type="hidden" name="type" value={setting.type} />
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">
                        مفعل
                      </label>
                      <select
                        name="enabled"
                        defaultValue={setting.enabled ? "true" : "false"}
                        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs text-white/80"
                      >
                        <option value="true">نعم</option>
                        <option value="false">لا</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">
                        الجدول
                      </label>
                      <input
                        name="schedule"
                        defaultValue={setting.schedule}
                        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs text-white/80 font-mono"
                        placeholder="0 2 * * 0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">
                        الاحتفاظ
                      </label>
                      <input
                        name="retentionCount"
                        type="number"
                        min="1"
                        defaultValue={setting.retentionCount}
                        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs text-white/80"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-champagne/80 px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-champagne"
                  >
                    حفظ
                  </button>
                </form>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/35">
                لا توجد إعدادات. قم بإنشاء نسخة احتياطية لتفعيل الإعدادات.
              </p>
            )}
          </div>
        </div>

        {/* Local Backups */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">
            النسخ المحلية
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto admin-scrollbar">
            {localBackups.length > 0 ? (
              localBackups.map((backupId) => {
                const v = healthSummary.results.find((r) =>
                  backupId ? true : false
                );
                return (
                  <div
                    key={backupId}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80 font-mono">
                          {backupId}
                        </p>
                      </div>
                      <AdminStatusBadge tone="success">
                        متوفرة
                      </AdminStatusBadge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["DATABASE", "UPLOADS", "FULL"] as const).map(
                        (type) => (
                          <form key={type} action={restoreBackupAction} className="inline">
                            <input
                              type="hidden"
                              name="backupId"
                              value={backupId}
                            />
                            <input type="hidden" name="type" value={type} />
                            <button
                              type="submit"
                              className="rounded-lg border border-amber-500/30 px-2.5 py-1 text-xs text-amber-400 transition hover:bg-amber-500/10"
                            >
                              استعادة{" "}
                              {type === "DATABASE"
                                ? "قاعدة البيانات"
                                : type === "UPLOADS"
                                  ? "الملفات"
                                  : "الكل"}
                            </button>
                          </form>
                        )
                      )}
                      <form action={verifyBackupAction} className="inline">
                        <input type="hidden" name="backupId" value={backupId} />
                        <button
                          type="submit"
                          className="rounded-lg border border-emerald-500/30 px-2.5 py-1 text-xs text-emerald-400 transition hover:bg-emerald-500/10"
                        >
                          تحقق
                        </button>
                      </form>
                      <form action={deleteBackupAction} className="inline">
                        <input type="hidden" name="backupId" value={backupId} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-500/10"
                        >
                          حذف
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-white/35">
                لا توجد نسخ محلية
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Job History */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">سجل النسخ</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto admin-scrollbar">
            {backupCenter.jobs.length > 0 ? (
              backupCenter.jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80">
                      {job.type === "DATABASE"
                        ? "قاعدة البيانات"
                        : job.type === "UPLOADS"
                          ? "الملفات المرفوعة"
                          : "نسخة كاملة"}
                    </p>
                    <AdminStatusBadge
                      tone={
                        job.status === "COMPLETED"
                          ? "success"
                          : job.status === "FAILED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {job.status === "COMPLETED"
                        ? "مكتملة"
                        : job.status === "FAILED"
                          ? "فشلت"
                          : job.status === "RUNNING"
                            ? "قيد التشغيل"
                            : "معلقة"}
                    </AdminStatusBadge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-white/40">
                    <p>{job.createdAt}</p>
                    {job.sizeBytes && (
                      <p>الحجم: {formatBytes(job.sizeBytes)}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/35">
                لا توجد نسخ بعد
              </p>
            )}
          </div>
        </div>

        {/* Restore History */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">
            سجل الاستعادة
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto admin-scrollbar">
            {backupCenter.restores.length > 0 ? (
              backupCenter.restores.map((restore) => (
                <div
                  key={restore.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80 font-mono">
                      {restore.backupId.slice(0, 16)}...
                    </p>
                    <AdminStatusBadge
                      tone={
                        restore.status === "COMPLETED"
                          ? "success"
                          : restore.status === "FAILED" ||
                              restore.status === "VALIDATION_FAILED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {restore.status === "COMPLETED"
                        ? "نجحت"
                        : restore.status === "FAILED"
                          ? "فشلت"
                          : restore.status === "VALIDATION_FAILED"
                            ? "فشل التحقق"
                            : restore.status}
                    </AdminStatusBadge>
                  </div>
                  <div className="mt-2 text-xs text-white/40">
                    <p>{restore.createdAt}</p>
                    {restore.errorMessage && (
                      <p className="text-red-400">{restore.errorMessage}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/35">
                لا توجد عمليات استعادة
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}

function HealthCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "success" | "danger" | "warning" | "default";
}) {
  const borderColors: Record<string, string> = {
    success: "border-emerald-500/10 bg-emerald-500/5",
    danger: "border-red-500/10 bg-red-500/5",
    warning: "border-amber-500/10 bg-amber-500/5",
    default: "border-white/[0.06] bg-white/[0.02]",
  };

  const valueColors: Record<string, string> = {
    success: "text-emerald-400",
    danger: "text-red-400",
    warning: "text-amber-400",
    default: "text-white",
  };

  return (
    <div
      className={`rounded-xl border p-3.5 ${borderColors[tone] || borderColors.default}`}
    >
      <p className="text-xs text-white/40 mb-0.5">{label}</p>
      <p className={`text-xl font-semibold ${valueColors[tone] || valueColors.default}`}>
        {value}
      </p>
    </div>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024)
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
