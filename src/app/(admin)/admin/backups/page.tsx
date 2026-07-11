import { basename } from "node:path";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import {
  createSnapshotAction,
  runBackupAction,
  updateBackupSettingsAction,
  verifyAllBackupsAction,
} from "@/app/(admin)/admin/backups/actions";
import {
  deleteWorkspaceBackupAction,
  restoreWorkspaceBackupAction,
  verifyWorkspaceBackupAction,
} from "@/app/(admin)/admin/backups/workspace-actions";
import { createPrismaAdminBackupCenterRepository } from "@/modules/admin/prisma-admin-backup-center-repository";
import {
  BACKUP_TYPE_DESCRIPTIONS,
  BACKUP_TYPE_LABELS,
  SUPPORTED_BACKUP_TYPES,
  getBackupPolicy,
  getBackupTypeLabel,
  type SupportedBackupType,
} from "@/modules/backups/backup-policy";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | undefined>> };
type BackupJobRow = {
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
  type: string;
  enabled: boolean;
  schedule: string;
  retentionCount: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
};

const inputClass = "rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-amber-300/30";

export default async function AdminBackupsPage({ searchParams }: Props) {
  await requireSuperAdminSession();
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

  return (
    <AdminPageShell badge="النظام" title="مركز النسخ الاحتياطي" description="إنشاء النسخ والتحقق منها واستعادتها من مساحة عمل واحدة آمنة وواضحة.">
      <Feedback params={params} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="آخر نسخة" value={jobs[0] ? formatDate(jobs[0].createdAt) : "لم يتم"} />
        <Metric label="آخر استعادة" value={restores[0] ? formatDate(restores[0].createdAt) : "لم يتم"} />
        <Metric label="نسخ سليمة" value={completed} tone="success" />
        <Metric label="المساحة المسجلة" value={formatBytes(storageUsed)} tone={failed ? "warning" : "default"} />
      </section>

      <WorkspaceSection title="إنشاء نسخة" description="إجراء رئيسي واضح لكل نوع من أنواع النسخ الحالية.">
        <div className="grid gap-3 md:grid-cols-2">
          {SUPPORTED_BACKUP_TYPES.map((type) => (
            <form key={type} action={runBackupAction} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <input type="hidden" name="type" value={type} />
              <h3 className="text-sm font-black text-white">{BACKUP_TYPE_LABELS[type]}</h3>
              <p className="mt-2 min-h-10 text-xs font-bold leading-5 text-white/45">{BACKUP_TYPE_DESCRIPTIONS[type]}</p>
              <button className="mt-4 w-full rounded-xl bg-[#f3cf73] px-4 py-2.5 text-sm font-black text-[#17120a]">إنشاء النسخة</button>
            </form>
          ))}
        </div>
      </WorkspaceSection>

      <WorkspaceSection title="النسخ الحالية" description="كل نسخة لها بطاقة واحدة وقائمة إجراءات واحدة.">
        <div className="space-y-3">
          {jobs.length === 0 ? <EmptyState /> : jobs.map((job) => {
            const artifactId = job.localPath ? basename(job.localPath) : null;
            const ready = job.status === "COMPLETED" && Boolean(artifactId);
            return (
              <article key={job.id} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{getBackupTypeLabel(job.type)}</h3>
                    <p className="mt-1 text-xs font-bold text-white/35">{formatDate(job.createdAt)} · {translateTrigger(job.trigger)}</p>
                  </div>
                  <AdminStatusBadge tone={statusTone(job.status)}>{translateStatus(job.status)}</AdminStatusBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                  <Info label="الحجم" value={job.sizeBytes ? formatBytes(job.sizeBytes) : "—"} />
                  <Info label="المدة" value={formatDuration(job.createdAt, job.completedAt)} />
                  <Info label="الملف" value={artifactId ?? "غير متاح"} />
                  <Info label="سلامة السجل" value={job.checksumSha256 ? "Checksum مسجل" : "غير مسجل"} />
                </div>
                {job.errorMessage ? <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-300">{job.errorMessage}</p> : null}
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-black text-[#f3cf73]">الإجراءات</summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={restoreWorkspaceBackupAction}>
                      <input type="hidden" name="backupJobId" value={job.id} />
                      <button disabled={!ready} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/70 disabled:cursor-not-allowed disabled:opacity-35">استعادة</button>
                    </form>
                    <form action={verifyWorkspaceBackupAction}>
                      <input type="hidden" name="backupJobId" value={job.id} />
                      <button disabled={!ready} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/70 disabled:cursor-not-allowed disabled:opacity-35">تحقق</button>
                    </form>
                    <form action={deleteWorkspaceBackupAction}>
                      <input type="hidden" name="backupJobId" value={job.id} />
                      <button disabled={!artifactId} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 disabled:cursor-not-allowed disabled:opacity-35">حذف</button>
                    </form>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      </WorkspaceSection>

      <details className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <summary className="cursor-pointer text-base font-black text-[#fff7e8]">خيارات متقدمة</summary>
        <div className="mt-5 space-y-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-sm font-black text-white">الجدولة والاحتفاظ</h2><p className="mt-1 text-xs font-bold text-white/40">لا تظهر في الاستخدام اليومي إلا عند الطلب.</p></div>
              <form action={verifyAllBackupsAction}><button className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/70">تحقق من الجميع</button></form>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {settings.map((setting) => (
                <form key={setting.type} action={updateBackupSettingsAction} className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                  <input type="hidden" name="type" value={setting.type} />
                  <div className="mb-3 flex justify-between gap-3"><h3 className="text-sm font-black text-white">{BACKUP_TYPE_LABELS[setting.type]}</h3><AdminStatusBadge tone={setting.enabled ? "success" : "default"}>{setting.enabled ? "مفعل" : "متوقف"}</AdminStatusBadge></div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="الحالة"><select name="enabled" defaultValue={setting.enabled ? "true" : "false"} className={inputClass}><option value="true">مفعل</option><option value="false">متوقف</option></select></Field>
                    <Field label="الجدول"><input name="schedule" defaultValue={setting.schedule} className={`${inputClass} font-mono`} /></Field>
                    <Field label="الاحتفاظ"><input name="retentionCount" type="number" min="1" max="100" defaultValue={setting.retentionCount} className={inputClass} /></Field>
                  </div>
                  <p className="mt-3 text-xs font-bold text-white/35">آخر تشغيل: {setting.lastRunAt ? formatDate(setting.lastRunAt.toISOString()) : "لم يتم"} · القادم: {setting.nextRunAt ? formatDate(setting.nextRunAt.toISOString()) : "غير محسوب"}</p>
                  <button className="mt-3 w-full rounded-xl border border-amber-300/20 px-3 py-2 text-xs font-black text-[#f3cf73]">حفظ الإعدادات</button>
                </form>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-400/15 bg-violet-500/5 p-4">
            <h2 className="text-sm font-black text-white">حزمة انتقال طارئة</h2>
            <p className="mt-2 text-xs font-bold leading-6 text-white/45">الكود ينتقل من GitHub، والبيانات والملفات تنتقل من النسخة الكاملة.</p>
            <form action={createSnapshotAction} className="mt-3"><button className="rounded-xl bg-violet-600/80 px-4 py-2 text-xs font-black text-white">إنشاء حزمة انتقال</button></form>
          </div>
        </div>
      </details>
    </AdminPageShell>
  );
}

function Feedback({ params }: { params: Record<string, string | undefined> }) {
  if (params.error) return <Banner tone="danger">{params.details ?? params.error}</Banner>;
  if (params.started) return <Banner tone="success">تم إنشاء النسخة بنجاح.</Banner>;
  if (params.restored) return <Banner tone="success">تمت الاستعادة بنجاح.</Banner>;
  if (params.deleted) return <Banner tone="success">تم حذف النسخة.</Banner>;
  if (params.snapshot) return <Banner tone="success">تم إنشاء حزمة الانتقال.</Banner>;
  if (params.verified) return <Banner tone={params.verified === "1" ? "success" : "danger"}>{params.verified === "1" ? "النسخة سليمة." : "فشل التحقق من النسخة."}</Banner>;
  if (params["settings-updated"]) return <Banner tone="success">تم تحديث إعدادات النسخ.</Banner>;
  return null;
}
function WorkspaceSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"><div className="mb-4"><h2 className="text-base font-black text-[#fff7e8]">{title}</h2><p className="mt-1 text-xs font-bold text-white/40">{description}</p></div>{children}</section>; }
function Banner({ tone, children }: { tone: "success" | "danger"; children: React.ReactNode }) { return <div className={tone === "success" ? "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300" : "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300"}>{children}</div>; }
function Metric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "success" | "warning" | "default" }) { const cls = tone === "success" ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-300" : tone === "warning" ? "border-amber-500/10 bg-amber-500/5 text-amber-300" : "border-white/[0.06] bg-white/[0.02] text-white"; return <div className={`rounded-xl border p-4 ${cls}`}><p className="text-xs font-bold opacity-60">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1 text-xs font-bold text-white/45"><span>{label}</span>{children}</label>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-white/30">{label}</p><p className="mt-1 break-all font-bold text-white/65">{value}</p></div>; }
function EmptyState() { return <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center"><p className="text-sm font-black text-white/60">لا توجد نسخ احتياطية بعد</p><p className="mt-1 text-xs font-bold text-white/35">أنشئ أول نسخة من القسم الموجود بالأعلى.</p></div>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG"); }
function formatDuration(start: string, end: string | null) { if (!end) return "—"; const ms = Math.max(0, new Date(end).getTime() - new Date(start).getTime()); if (ms < 1000) return `${ms} ms`; if (ms < 60000) return `${Math.round(ms / 1000)} ثانية`; return `${Math.round(ms / 60000)} دقيقة`; }
function translateStatus(status: string) { if (status === "COMPLETED") return "مكتملة"; if (status === "FAILED") return "فشلت"; if (status === "RUNNING") return "قيد التشغيل"; if (status === "PENDING") return "معلقة"; return status; }
function translateTrigger(trigger: string) { if (trigger === "MANUAL") return "يدوي"; if (trigger === "AUTO") return "تلقائي"; return "غير محدد"; }
function statusTone(status: string): "success" | "danger" | "warning" | "default" { if (status === "COMPLETED") return "success"; if (status === "FAILED") return "danger"; if (status === "RUNNING" || status === "PENDING") return "warning"; return "default"; }
function formatBytes(value: number): string { if (value < 1024) return `${value} B`; if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`; if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`; return `${(value / 1024 ** 3).toFixed(2)} GB`; }
