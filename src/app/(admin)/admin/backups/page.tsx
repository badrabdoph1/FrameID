import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { runBackupAction, restoreBackupAction, verifyBackupAction, deleteBackupAction, createSnapshotAction, updateBackupSettingsAction } from "@/app/(admin)/admin/backups/actions";
import { createPrismaAdminBackupCenterRepository } from "@/modules/admin/prisma-admin-backup-center-repository";
import { BACKUP_TYPE_DESCRIPTIONS, BACKUP_TYPE_LABELS, SUPPORTED_BACKUP_TYPES, getBackupPolicy, getBackupTypeLabel, type SupportedBackupType } from "@/modules/backups/backup-policy";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | undefined>> };
type BackupJobRow = { id: string; type: string; status: string; trigger: string; sizeBytes: number | null; localPath: string | null; createdAt: string };
type RestoreRow = { id: string; backupId: string; type: string; status: string; errorMessage: string | null; createdAt: string };
type BackupSettingRow = { type: string; enabled: boolean; schedule: string; retentionCount: number; lastRunAt: Date | null; nextRunAt: Date | null };

export default async function AdminBackupsPage({ searchParams }: Props) {
  await requireSuperAdminSession();
  const params = await searchParams;
  const repository = createPrismaAdminBackupCenterRepository(prisma);
  const backupCenter = await repository.getBackupCenter() as { settings: BackupSettingRow[]; jobs: BackupJobRow[]; restores: RestoreRow[] };

  const settings = SUPPORTED_BACKUP_TYPES.map((type) => {
    const policy = getBackupPolicy(type);
    const existing = backupCenter.settings.find((item) => item.type === type);
    return { type, enabled: existing?.enabled ?? true, schedule: existing?.schedule ?? policy.schedule, retentionCount: existing?.retentionCount ?? policy.retentionCount, lastRunAt: existing?.lastRunAt ?? null, nextRunAt: existing?.nextRunAt ?? null };
  });
  const jobs = backupCenter.jobs.filter((job) => SUPPORTED_BACKUP_TYPES.includes(job.type as SupportedBackupType));
  const restores = backupCenter.restores.filter((item) => SUPPORTED_BACKUP_TYPES.includes(item.type as SupportedBackupType));
  const lastBackup = jobs[0];
  const lastRestore = restores[0];
  const successful = jobs.filter((job) => job.status === "COMPLETED").length;
  const failed = jobs.filter((job) => job.status !== "COMPLETED" && job.status !== "PENDING" && job.status !== "RUNNING").length;
  const successRate = jobs.length ? `${Math.round((successful / jobs.length) * 100)}%` : "N/A";
  const storageUsedBytes = jobs.reduce((sum, job) => sum + (job.sizeBytes ?? 0), 0);
  const latestFullBackup = jobs.find((job) => job.type === "FULL");

  return (
    <AdminPageShell badge="النسخ الاحتياطي" title="Backup Center" description="Data Backup لقاعدة البيانات فقط، وFull Backup لقاعدة البيانات مع كل uploads. كود المنصة مصدره GitHub وليس النسخ الاحتياطية.">
      {params.error ? <Banner tone="danger">{params.details ?? params.error}</Banner> : null}
      {params.started ? <Banner tone="success">تم إنشاء النسخة.</Banner> : null}
      {params.restored ? <Banner tone="success">تمت الاستعادة.</Banner> : null}
      {params.deleted ? <Banner tone="success">تم حذف النسخة.</Banner> : null}
      {params.snapshot ? <Banner tone="success">تم إنشاء حزمة انتقال.</Banner> : null}
      {params["settings-updated"] ? <Banner tone="success">تم تحديث الجدولة.</Banner> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="آخر Backup" value={lastBackup ? formatDate(lastBackup.createdAt) : "لم يتم"} tone={lastBackup?.status === "COMPLETED" ? "success" : "default"} />
        <Metric label="آخر Restore" value={lastRestore ? formatDate(lastRestore.createdAt) : "لم يتم"} tone={lastRestore?.status === "COMPLETED" ? "success" : "default"} />
        <Metric label="آخر Migration" value={latestFullBackup ? formatDate(latestFullBackup.createdAt) : "لم يتم"} />
        <Metric label="حجم النسخ" value={formatBytes(storageUsedBytes)} />
        <Metric label="حالة النسخ" value={failed ? `${failed} أخطاء` : "سليم"} tone={failed ? "danger" : "success"} />
        <Metric label="نسبة النجاح" value={successRate} tone={failed ? "warning" : "success"} />
        <Metric label="احتفاظ Data" value={`آخر ${getBackupPolicy("DATABASE").retentionCount}`} />
        <Metric label="احتفاظ Full" value={`آخر ${getBackupPolicy("FULL").retentionCount}`} />
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="mb-4 text-base font-black text-[#fff7e8]">النسخ اليدوي</h2>
        <div className="flex flex-wrap gap-3">
          {SUPPORTED_BACKUP_TYPES.map((type) => <form key={type} action={runBackupAction}><input type="hidden" name="type" value={type} /><button className="rounded-xl bg-[#f3cf73] px-4 py-2 text-sm font-black text-[#17120a]">{BACKUP_TYPE_LABELS[type]}</button></form>)}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="mb-4 text-base font-black text-[#fff7e8]">النسخ التلقائي</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {settings.map((setting) => <form key={setting.type} action={updateBackupSettingsAction} className="rounded-2xl border border-white/[0.06] bg-black/20 p-4"><input type="hidden" name="type" value={setting.type} /><div className="mb-3 flex justify-between gap-3"><div><h3 className="text-sm font-black text-white">{BACKUP_TYPE_LABELS[setting.type]}</h3><p className="mt-1 text-xs font-bold text-white/45">{BACKUP_TYPE_DESCRIPTIONS[setting.type]}</p></div><AdminStatusBadge tone={setting.enabled ? "success" : "default"}>{setting.enabled ? "مفعل" : "متوقف"}</AdminStatusBadge></div><div className="grid gap-2 md:grid-cols-3"><Field label="الحالة"><select name="enabled" defaultValue={setting.enabled ? "true" : "false"} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs text-white/80"><option value="true">مفعل</option><option value="false">متوقف</option></select></Field><Field label="الجدول"><input name="schedule" defaultValue={setting.schedule} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 font-mono text-xs text-white/80" /></Field><Field label="الاحتفاظ"><input name="retentionCount" type="number" min="1" max="100" defaultValue={setting.retentionCount} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-xs text-white/80" /></Field></div><p className="mt-3 text-xs font-bold text-white/40">آخر تنفيذ: {setting.lastRunAt ? formatDate(setting.lastRunAt.toISOString()) : "لم يتم"} · القادم: {setting.nextRunAt ? formatDate(setting.nextRunAt.toISOString()) : "غير محسوب"}</p><button className="mt-3 w-full rounded-xl border border-amber-300/20 px-3 py-2 text-xs font-black text-[#f3cf73]">حفظ</button></form>)}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="mb-4 text-base font-black text-[#fff7e8]">السجلات</h2>
        <div className="space-y-3">
          {jobs.length === 0 ? <Empty /> : jobs.map((job) => <article key={job.id} className="rounded-2xl border border-white/[0.06] bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-black text-white">{getBackupTypeLabel(job.type)}</h3><p className="mt-1 text-xs font-mono text-white/35">{job.id}</p></div><AdminStatusBadge tone={job.status === "COMPLETED" ? "success" : job.status === "FAILED" ? "danger" : "warning"}>{translateStatus(job.status)}</AdminStatusBadge></div><div className="mt-3 grid gap-2 text-xs font-bold text-white/45 md:grid-cols-5"><Info label="التاريخ" value={formatDate(job.createdAt)} /><Info label="الحجم" value={job.sizeBytes ? formatBytes(job.sizeBytes) : "—"} /><Info label="المدة" value="—" /><Info label="الحالة" value={translateStatus(job.status)} /><Info label="سبب الفشل" value={job.status === "FAILED" ? "راجع Error logs" : "—"} /></div><div className="mt-3 flex flex-wrap gap-2"><form action={restoreBackupAction}><input type="hidden" name="backupId" value={job.id} /><input type="hidden" name="type" value={job.type} /><button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/60">استعادة</button></form><form action={verifyBackupAction}><input type="hidden" name="backupId" value={job.id} /><button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/60">تحقق</button></form><form action={deleteBackupAction}><input type="hidden" name="backupId" value={job.id} /><button className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-300">حذف</button></form></div></article>)}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="text-base font-black text-[#fff7e8]">Migration Center — الذهاب والعودة</h2>
        <p className="mt-2 text-xs font-bold leading-6 text-white/45">للطوارئ فقط: الكود ينتقل من GitHub، والبيانات تنتقل من Full Backup الذي يحتوي PostgreSQL وuploads. قبل العودة يجب عرض Preview بعدد العملاء والمواقع والصور والملفات والحجم والتاريخ.</p>
        <form action={createSnapshotAction} className="mt-4"><button className="rounded-xl bg-violet-600/80 px-4 py-2 text-sm font-black text-white">إنشاء حزمة انتقال</button></form>
      </section>
    </AdminPageShell>
  );
}

function Banner({ tone, children }: { tone: "success" | "danger"; children: React.ReactNode }) { return <div className={tone === "success" ? "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300" : "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"}>{children}</div>; }
function Metric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "success" | "danger" | "warning" | "default" }) { const cls = tone === "success" ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-300" : tone === "danger" ? "border-red-500/10 bg-red-500/5 text-red-300" : tone === "warning" ? "border-amber-500/10 bg-amber-500/5 text-amber-300" : "border-white/[0.06] bg-white/[0.02] text-white"; return <div className={`rounded-xl border p-4 ${cls}`}><p className="text-xs font-bold opacity-60">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1 text-xs font-bold text-white/45"><span>{label}</span>{children}</label>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-white/30">{label}</p><p className="mt-1 text-white/65">{value}</p></div>; }
function Empty() { return <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center text-sm font-bold text-white/40">لا توجد نسخ بعد.</div>; }
function formatDate(value: string) { return new Date(value).toLocaleString("ar-EG"); }
function translateStatus(status: string) { if (status === "COMPLETED") return "مكتملة"; if (status === "FAILED") return "فشلت"; if (status === "RUNNING") return "قيد التشغيل"; if (status === "PENDING") return "معلقة"; return status; }
function formatBytes(value: number): string { if (value < 1024) return `${value} B`; if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`; if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`; return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`; }
