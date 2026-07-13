"use client";

import { PendingForm, PendingButton } from "@/components/admin/pending-button";
import { getBackupTypeLabel } from "@/modules/backups/backup-policy";
import type { BackupJobRow } from "@/app/(admin)/admin/backups/page";

interface BackupRestoreSectionProps {
  latestCompleted: BackupJobRow | undefined;
  onPrepareMigrationBackup: () => Promise<void>;
  onRestoreLatestGitHubBackup: () => Promise<void>;
  onRestoreWorkspaceBackup: (backupJobId: string) => Promise<void>;
}

export function BackupRestoreSection({
  latestCompleted,
  onPrepareMigrationBackup,
  onRestoreLatestGitHubBackup,
  onRestoreWorkspaceBackup,
}: BackupRestoreSectionProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">الذهاب والعودة</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          ذهاب ينشئ FULL عبر Pipeline الرسمية وينتظر رفعها والتحقق منها، وعودة تستعيد أحدث FULL من GitHub.
        </p>
      </div>
      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <PendingForm action={onPrepareMigrationBackup} className="rounded-2xl border border-sky-300/20 bg-sky-300/5 p-5">
          <div className="flex h-full flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-sky-300">ذهاب طوارئ</p>
              <p className="mt-1 text-xs font-bold text-white/45">
                إنشاء FULL كاملة، ولا يسمح بالانتقال إلا بعد Remote Verify.
              </p>
            </div>
            <PendingButton
              pendingText="جاري تجهيز الذهاب..."
              className="rounded-xl bg-sky-300 px-6 py-3 text-sm font-black text-[#101820]"
            >
              ذهاب
            </PendingButton>
          </div>
        </PendingForm>
        <PendingForm action={onRestoreLatestGitHubBackup} className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5">
          <div className="flex h-full flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-[#f3cf73]">عودة طوارئ من GitHub</p>
              <p className="mt-1 text-xs font-bold text-white/45">
                استعادة أحدث FULL تحتوي بيانات العملاء، مع مطابقة الأعداد والملفات بعد العودة.
              </p>
            </div>
            <PendingButton
              pendingText="جاري العودة..."
              className="rounded-xl bg-[#f3cf73] px-6 py-3 text-sm font-black text-[#17120a]"
            >
              عودة
            </PendingButton>
          </div>
        </PendingForm>
      </div>
      {latestCompleted ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-emerald-300">
                آخر نسخة مكتملة: {getBackupTypeLabel(latestCompleted.type)}
              </p>
              <p className="mt-1 text-xs font-bold text-white/45">
                {formatDate(latestCompleted.createdAt)} · {latestCompleted.sizeBytes ? formatBytes(latestCompleted.sizeBytes) : "—"}
              </p>
            </div>
            <PendingForm action={async () => await onRestoreWorkspaceBackup(latestCompleted.id)} className="flex gap-2">
              <PendingButton
                pendingText="جاري الاستعادة..."
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-400"
              >
                استعادة هذه النسخة
              </PendingButton>
            </PendingForm>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center">
          <p className="text-sm font-black text-white/60">لا توجد نسخ مكتملة للاستعادة منها.</p>
          <p className="mt-1 text-xs font-bold text-white/35">أنشئ نسخة أولاً من القسم الموجود بالأعلى.</p>
        </div>
      )}
    </section>
  );
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