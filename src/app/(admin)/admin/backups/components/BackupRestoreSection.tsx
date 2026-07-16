"use client";

import { PendingForm, PendingButton } from "@/components/admin/pending-button";
import { getBackupTypeLabel } from "@/modules/backups/backup-policy";
import type { BackupJobRow } from "@/app/(admin)/admin/backups/page";

interface BackupRestoreSectionProps {
  latestCompleted: BackupJobRow | undefined;
  migrationActionLabel?: string;
  onPrepareMigrationBackup: () => Promise<void>;
  onRestoreLatestGitHubBackup: () => Promise<void>;
  onRestoreWorkspaceBackup: (backupJobId: string) => Promise<void>;
}

export function BackupRestoreSection({
  latestCompleted,
  migrationActionLabel = "ذهاب طوارئ",
  onPrepareMigrationBackup,
  onRestoreLatestGitHubBackup,
  onRestoreWorkspaceBackup,
}: BackupRestoreSectionProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="mb-3">
        <h2 className="text-sm font-black text-[#fff7e8]">الذهاب والعودة</h2>
        <p className="mt-0.5 text-[11px] font-bold text-white/35">
          ذهاب ينشئ FULL عبر Pipeline الرسمية، وعودة تستعيد أحدث FULL من GitHub.
        </p>
      </div>
      <div className="mb-2.5 grid gap-2.5 md:grid-cols-2">
        <PendingForm action={onPrepareMigrationBackup} className="rounded-xl border border-sky-300/15 bg-sky-300/[0.03] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-sky-300">{migrationActionLabel}</p>
              <p className="mt-0.5 text-[11px] font-bold text-white/35">
                FULL كاملة مع Remote Verify قبل الانتقال.
              </p>
            </div>
            <PendingButton
              pendingText="جاري تجهيز الذهاب..."
              className="rounded-lg bg-sky-300 px-4 py-2 text-xs font-black text-[#101820]"
            >
              ذهاب
            </PendingButton>
          </div>
        </PendingForm>
        <PendingForm action={onRestoreLatestGitHubBackup} className="rounded-xl border border-amber-300/15 bg-amber-300/[0.03] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#f3cf73]">عودة طوارئ من GitHub</p>
              <p className="mt-0.5 text-[11px] font-bold text-white/35">
                استعادة أحدث FULL مع مطابقة الأعداد والملفات.
              </p>
            </div>
            <PendingButton
              pendingText="جاري العودة..."
              className="rounded-lg bg-[#f3cf73] px-4 py-2 text-xs font-black text-[#17120a]"
            >
              عودة
            </PendingButton>
          </div>
        </PendingForm>
      </div>
      {latestCompleted ? (
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-emerald-300">
                آخر نسخة مكتملة: {getBackupTypeLabel(latestCompleted.type)}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-white/35">
                {formatDate(latestCompleted.createdAt)} · {translateTrigger(latestCompleted.trigger)} · {latestCompleted.sizeBytes ? formatBytes(latestCompleted.sizeBytes) : "—"}
              </p>
              <p className="mt-1 text-[10px] font-bold text-white/20">
                {latestCompleted.githubBranch ? `الفرع: ${latestCompleted.githubBranch}` : null}
                {latestCompleted.githubBranch && latestCompleted.githubCommitSha ? " · " : null}
                {latestCompleted.githubCommitSha ? `Commit: ${latestCompleted.githubCommitSha.slice(0, 12)}` : null}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <PendingForm action={async () => await onRestoreWorkspaceBackup(latestCompleted.id)}>
                <PendingButton
                  pendingText="جاري الاستعادة..."
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-400"
                >
                  استعادة
                </PendingButton>
              </PendingForm>
              <p className="text-[10px] font-black text-red-300/60">
                تحذير: تستبدل البيانات الحالية بالكامل
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
          <p className="text-xs font-black text-white/50">لا توجد نسخ مكتملة للاستعادة منها.</p>
        </div>
      )}
    </section>
  );
}

function translateTrigger(trigger: string) {
  if (trigger === "MANUAL") return "يدوي";
  if (trigger === "AUTO") return "تلقائي";
  if (trigger === "MIGRATION") return "هجرة";
  if (trigger === "CLI") return "CLI";
  if (trigger === "GITHUB_ACTIONS") return "GitHub Actions";
  return "غير محدد";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}
