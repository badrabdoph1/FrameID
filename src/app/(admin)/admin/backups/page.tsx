import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import {
  runBackupAction,
  restoreBackupAction,
} from "@/app/(admin)/admin/backups/actions";
import { createPrismaAdminBackupCenterRepository } from "@/modules/admin/prisma-admin-backup-center-repository";
import { listBackupDirs } from "@/modules/backups/local-backup-artifact-writer";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    started?: string;
    restored?: string;
    backup?: string;
    error?: string;
    details?: string;
  }>;
};

export default async function AdminBackupsPage({ searchParams }: Props) {
  await requireSuperAdminSession();
  const params = await searchParams;
  const repository = createPrismaAdminBackupCenterRepository(prisma);
  const backupCenter = await repository.getBackupCenter();
  const localBackups = await listBackupDirs();

  return (
    <AdminPageShell
      badge="التشغيل"
      title="النسخ الاحتياطي"
      description="إدارة النسخ الاحتياطي والتحقق منها واستعادتها"
    >
      {params.started && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          تم إنشاء نسخة احتياطية والتحقق منها
        </div>
      )}

      {params.restored && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          تمت استعادة النسخة: {params.backup}
        </div>
      )}

      {params.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {params.error === "restore-validation-failed"
            ? "فشل التحقق من النسخة الاحتياطية"
            : params.error === "restore-failed"
              ? `فشلت الاستعادة: ${params.details || "خطأ غير معروف"}`
              : params.error === "missing-backup-id"
                ? "لم يتم تحديد معرف النسخة"
                : "تعذر تشغيل النسخ الاحتياطي"}
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
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
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">
            الإعدادات
          </h3>
          <div className="space-y-3">
            {backupCenter.settings.map((setting) => (
              <div
                key={setting.type}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {setting.type}
                  </p>
                  <p className="text-xs text-white/40">
                    {setting.schedule} · الاحتفاظ بآخر {setting.retentionCount}
                  </p>
                </div>
                <AdminStatusBadge
                  tone={setting.enabled ? "success" : "default"}
                >
                  {setting.enabled ? "مفعل" : "متوقف"}
                </AdminStatusBadge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">
            النسخ المحلية
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto admin-scrollbar">
            {localBackups.length > 0 ? (
              localBackups.map((backupId) => (
                <div
                  key={backupId}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white/80 font-mono">
                      {backupId}
                    </p>
                    <AdminStatusBadge tone="success">متوفرة</AdminStatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["DATABASE", "UPLOADS", "FULL"] as const).map(
                      (type) => (
                        <form key={type} action={restoreBackupAction}>
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
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/35">
                لا توجد نسخ محلية
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">السجل</h3>
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
                    {job.checksumSha256 && (
                      <p className="font-mono" dir="ltr">
                        sha256:{job.checksumSha256.slice(0, 16)}...
                      </p>
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
                            : restore.status === "VALIDATED"
                              ? "تم التحقق"
                              : restore.status}
                    </AdminStatusBadge>
                  </div>
                  <div className="mt-2 text-xs text-white/40">
                    <p>{restore.createdAt}</p>
                    {restore.errorMessage && (
                      <p className="text-red-400">
                        {restore.errorMessage}
                      </p>
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

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
