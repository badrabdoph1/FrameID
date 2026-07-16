"use client";

import { useState } from "react";
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

const TYPE_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "FULL", label: "نسخ كامل" },
  { value: "DATABASE", label: "داتا فقط" },
  { value: "UPLOADS", label: "ملفات" },
];

const STATUS_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "COMPLETED", label: "مكتملة" },
  { value: "FAILED", label: "فشلت" },
  { value: "RUNNING", label: "قيد التشغيل" },
  { value: "PENDING", label: "معلقة" },
];

const TRIGGER_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "AUTO", label: "تلقائي" },
  { value: "MANUAL", label: "يدوي" },
  { value: "MIGRATION", label: "هجرة" },
  { value: "GITHUB_ACTIONS", label: "GitHub Actions" },
];

export function BackupListSection({
  jobs,
  latestCompleted,
  onRestoreWorkspaceBackup,
  onVerifyWorkspaceBackup,
  onDeleteWorkspaceBackup,
}: BackupListSectionProps) {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("");

  const filtered = jobs.filter((job) => {
    if (typeFilter && job.type !== typeFilter) return false;
    if (statusFilter && job.status !== statusFilter) return false;
    if (triggerFilter && job.trigger !== triggerFilter) return false;
    return true;
  });

  const hasFilters = Boolean(typeFilter || statusFilter || triggerFilter);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="mb-3">
        <h2 className="text-sm font-black text-[#fff7e8]">النسخ الاحتياطية</h2>
        <p className="mt-0.5 text-[11px] font-bold text-white/35">كل نسخة لها إجراءات واضحة.</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <FilterSelect label="النوع" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
        <FilterSelect label="الحالة" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        <FilterSelect label="المصدر" value={triggerFilter} onChange={setTriggerFilter} options={TRIGGER_OPTIONS} />
        {hasFilters ? (
          <button
            onClick={() => { setTypeFilter(""); setStatusFilter(""); setTriggerFilter(""); }}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/50 transition hover:border-red-500/30 hover:text-red-300"
          >
            مسح الفلاتر
          </button>
        ) : null}
        <span className="me-auto text-[10px] font-bold text-white/25">
          {filtered.length} من {jobs.length}
        </span>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          filtered.map((job) => {
            const artifactId = job.localPath ? basename(job.localPath) : null;
            const ready = job.status === "COMPLETED" && Boolean(artifactId);
            const isLatest = job.id === latestCompleted?.id;
            return (
              <article
                key={job.id}
                className={`rounded-xl border p-3 ${isLatest ? "border-emerald-500/15 bg-emerald-500/[0.03]" : "border-white/[0.06] bg-black/15"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-black text-white">
                        {getBackupTypeLabel(job.type)}
                      </h3>
                      {isLatest ? (
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black text-emerald-300">
                          الأحدث
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] font-bold text-white/30">
                      {formatDate(job.createdAt)} · {translateTrigger(job.trigger)}
                    </p>
                  </div>
                  <AdminStatusBadge tone={statusTone(job.status)}>
                    {translateStatus(job.status)}
                  </AdminStatusBadge>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4">
                  <Info label="الحجم" value={job.sizeBytes ? formatBytes(job.sizeBytes) : "—"} />
                  <Info label="المدة" value={formatDuration(job.createdAt, job.completedAt)} />
                  <Info label="الملف" value={artifactId ?? "غير متاح"} />
                  <Info label="التحقق" value={job.checksumSha256 ? "Checksum مسجل" : "غير مسجل"} />
                </div>
                {job.status === "COMPLETED" ? (
                  <div className="mt-2 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] p-2">
                    <div className="grid gap-1.5 text-[10px] font-bold text-white/45 sm:grid-cols-3">
                      <Info label="فرع GitHub" value={job.githubBranch ?? "غير مسجل"} />
                      <Info label="Commit" value={job.githubCommitSha?.slice(0, 12) ?? "قديم"} />
                      <Info label="المراحل" value={formatPipelineStages(job)} />
                    </div>
                    {job.githubPath ? (
                      <a
                        href={job.githubPath}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex rounded-md border border-emerald-400/20 px-2.5 py-1 text-[10px] font-black text-emerald-300 transition hover:bg-emerald-400/10"
                      >
                        فتح على GitHub
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {job.errorMessage ? (
                  <p className="mt-2 rounded-lg border border-red-500/15 bg-red-500/5 p-2 text-[11px] font-bold text-red-300">
                    {job.errorMessage}
                  </p>
                ) : null}

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {ready ? (
                    <PendingForm action={async () => await onRestoreWorkspaceBackup(job.id)}>
                      <input type="hidden" name="backupJobId" value={job.id} />
                      <PendingButton
                        pendingText="..."
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-emerald-400"
                      >
                        استعادة
                      </PendingButton>
                    </PendingForm>
                  ) : (
                    <button
                      disabled
                      className="rounded-lg border border-white/8 px-3 py-1.5 text-[11px] font-bold text-white/25 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      استعادة
                    </button>
                  )}
                  {ready ? (
                    <PendingForm action={async () => await onVerifyWorkspaceBackup(job.id)}>
                      <input type="hidden" name="backupJobId" value={job.id} />
                      <PendingButton
                        pendingText="..."
                        className="rounded-lg border border-white/8 px-3 py-1.5 text-[11px] font-black text-white/60 transition hover:border-amber-300/25 hover:text-white"
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
                      className="rounded-lg border border-red-500/25 px-3 py-1.5 text-[11px] font-bold text-red-300/70 transition hover:border-red-500/40 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-35"
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

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[10px] font-black text-white/30">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/[0.08] bg-black/30 px-2 py-1.5 text-[11px] font-bold text-white/70 outline-none focus:border-amber-300/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center">
      <p className="text-sm font-black text-white/60">
        {hasFilters ? "لا نتائج مطابقة للفلاتر" : "لا توجد نسخ احتياطية بعد"}
      </p>
      <p className="mt-1 text-xs font-bold text-white/35">
        {hasFilters ? "جرّب تغيير أو مسح الفلاتر." : "أنشئ أول نسخة من القسم الموجود بالأعلى."}
      </p>
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

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

function basename(path: string): string {
  return path.split(/[\\/]/).pop() || "";
}
