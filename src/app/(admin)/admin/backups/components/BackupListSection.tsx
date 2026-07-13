"use client";

import { PendingForm, PendingButton } from "@/components/admin/pending-button";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { getBackupTypeLabel } from "@/modules/backups/backup-policy";
import type { BackupJobRow } from "@/app/(admin)/admin/backups/page";

interface BackupListSectionProps {
  jobs: BackupJobRow[];
  latestCompleted: BackupJobRow | undefined;
  onRestoreWorkspaceBackup: (backupJobId: string) => Promise<void>;
  onVerifyWorkspaceBackup: (backupJobId: string) => Promise<void>;
  onDeleteWorkspaceBackup: (backupJobId: string) => Promise<void>;
}

export function BackupListSection({
  jobs,
  latestCompleted,
  onRestoreWorkspaceBackup,
  onVerifyWorkspaceBackup,
  onDeleteWorkspaceBackup,
}: BackupListSectionProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">النسخ الاحتياطية</h2>
        <p className="mt-1 text-xs font-bold text-white/40">كل نسخة لها إجراءات واضحة.</p>
      </div>
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <EmptyState />
        ) : (
          jobs.map((job) => {
            const artifactId = job.localPath ? basename(job.localPath) : null;
            const ready = job.status === "COMPLETED" && Boolean(artifactId);
            const isLatest = job.id === latestCompleted?.id;
            return (
              <article
                key={job.id}
                className={`rounded-2xl border p-4 ${isLatest ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/[0.07] bg-black/20"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">
                        {getBackupTypeLabel(job.type)}
                      </h3>
                      {isLatest ? (
                        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                          الأحدث
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs font-bold text-white/35">
                      {formatDate(job.createdAt)} · {translateTrigger(job.trigger)}
                    </p>
                  </div>
                  <AdminStatusBadge tone={statusTone(job.status)}>
                    {translateStatus(job.status)}
                  </AdminStatusBadge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                  <Info label="الحجم" value={job.sizeBytes ? formatBytes(job.sizeBytes) : "—"} />
                  <Info label="المدة" value={formatDuration(job.createdAt, job.completedAt)} />
                  <Info label="الملف" value={artifactId ?? "غير متاح"} />
                  <Info label="التحقق" value={job.checksumSha256 ? "Checksum مسجل" : "غير مسجل"} />
                </div>
                {job.status === "COMPLETED" ? (
                  <div className="mt-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                    <div className="grid gap-2 text-[11px] font-bold text-white/55 sm:grid-cols-3">
                      <Info label="فرع GitHub" value={job.githubBranch ?? "غير مسجل"} />
                      <Info label="Commit النسخة" value={job.githubCommitSha?.slice(0, 12) ?? "نسخة قديمة"} />
                      <Info label="المراحل" value={formatPipelineStages(job)} />
                    </div>
                    {job.githubPath ? (
                      <a
                        href={job.githubPath}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-lg border border-emerald-400/25 px-3 py-2 text-[11px] font-black text-emerald-300 transition hover:bg-emerald-400/10"
                      >
                        فتح النسخة الفعلية على GitHub
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {job.errorMessage ? (
                  <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-300">
                    {job.errorMessage}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {ready ? (
                    <PendingForm action={async () => await onRestoreWorkspaceBackup(job.id)}>
                      <input type="hidden" name="backupJobId" value={job.id} />
                      <PendingButton
                        pendingText="..."
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-400"
                      >
                        استعادة
                      </PendingButton>
                    </PendingForm>
                  ) : (
                    <button
                      disabled
                      className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/35 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      استعادة
                    </button>
                  )}
                  {ready ? (
                    <PendingForm action={async () => await onVerifyWorkspaceBackup(job.id)}>
                      <input type="hidden" name="backupJobId" value={job.id} />
                      <PendingButton
                        pendingText="..."
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white/70 transition hover:border-amber-300/30 hover:text-white"
                      >
                        تحقق
                      </PendingButton>
                    </PendingForm>
                  ) : null}
                  <PendingForm action={async () => await onDeleteWorkspaceBackup(job.id)} className="ms-auto">
                    <input type="hidden" name="backupJobId" value={job.id} />
                    <PendingButton
                      pendingText="..."
                      disabled={!artifactId && !ready}
                      className="rounded-xl border border-red-500/30 px-4 py-2 text-xs font-bold text-red-300 transition hover:border-red-500/50 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      حذف
                    </PendingButton>
                  </PendingForm>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center">
      <p className="text-sm font-black text-white/60">لا توجد نسخ احتياطية بعد</p>
      <p className="mt-1 text-xs font-bold text-white/35">أنشئ أول نسخة من القسم الموجود بالأعلى.</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/30">{label}</p>
      <p className="mt-1 break-all font-bold text-white/65">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

function formatDuration(start: string, end: string | null) {
  if (!end) return "—";
  const ms = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)} ثانية`;
  return `${Math.round(ms / 60000)} دقيقة`;
}

function translateStatus(status: string) {
  if (status === "COMPLETED") return "مكتملة";
  if (status === "FAILED") return "فشلت";
  if (status === "RUNNING") return "قيد التشغيل";
  if (status === "PENDING") return "معلقة";
  return status;
}

function translateTrigger(trigger: string) {
  if (trigger === "MANUAL") return "يدوي";
  if (trigger === "AUTO") return "تلقائي";
  if (trigger === "MIGRATION") return "عودة/هجرة";
  if (trigger === "CLI") return "CLI";
  if (trigger === "GITHUB_ACTIONS") return "GitHub Actions";
  if (trigger === "GITHUB_REINDEX") return "مستعاد من فهرس GitHub";
  return "غير محدد";
}

function statusTone(status: string): "success" | "danger" | "warning" | "default" {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "danger";
  if (status === "RUNNING" || status === "PENDING") return "warning";
  return "default";
}

function formatPipelineStages(job: BackupJobRow): string {
  const flags = [job.localVerified, job.githubUploaded, job.remoteVerified, job.retentionApplied, job.auditLogged];
  return flags.every(Boolean) ? "5/5 مكتملة" : `${flags.filter(Boolean).length}/5`;
}

function basename(path: string): string {
  return path.split(/[\\/]/).pop() || "";
}