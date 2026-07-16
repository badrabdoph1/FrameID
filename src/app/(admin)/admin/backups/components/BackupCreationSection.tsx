"use client";

import { PendingForm, PendingButton } from "@/components/admin/pending-button";
import { BACKUP_TYPE_DESCRIPTIONS, BACKUP_TYPE_LABELS, SUPPORTED_BACKUP_TYPES, type SupportedBackupType } from "@/modules/backups/backup-policy";

interface BackupCreationSectionProps {
  onCreateBackup: (type: SupportedBackupType) => Promise<void>;
  latestPerType: Record<string, string | null>;
}

export function BackupCreationSection({ onCreateBackup, latestPerType }: BackupCreationSectionProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="mb-3">
        <h2 className="text-sm font-black text-[#fff7e8]">إنشاء نسخة</h2>
        <p className="mt-0.5 text-[11px] font-bold text-white/35">
          اختر النوع واضغط الزر — لا تُعد النسخة مكتملة إلا بعد الرفع والتحقق على GitHub.
        </p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {SUPPORTED_BACKUP_TYPES.map((type) => (
          <PendingForm
            key={type}
            action={async () => await onCreateBackup(type)}
            className="flex flex-col rounded-xl border border-white/[0.06] bg-black/20 p-3"
          >
            <input type="hidden" name="type" value={type} />
            <h3 className="text-xs font-black text-white">{BACKUP_TYPE_LABELS[type]}</h3>
            <p className="mt-1.5 text-[11px] font-bold leading-4 text-white/35">
              {BACKUP_TYPE_DESCRIPTIONS[type]}
            </p>
            {latestPerType[type] ? (
              <p className="mt-2 rounded-md border border-emerald-500/10 bg-emerald-500/5 px-2 py-1 text-[10px] font-bold text-emerald-300/70">
                آخر نسخة: {latestPerType[type]}
              </p>
            ) : (
              <p className="mt-2 rounded-md border border-dashed border-white/8 px-2 py-1 text-[10px] font-bold text-white/20">
                لا توجد نسخة سابقة
              </p>
            )}
            <PendingButton
              pendingText="جاري الإنشاء..."
              className="mt-3 w-full rounded-lg bg-[#f3cf73] px-3 py-2 text-xs font-black text-[#17120a] transition hover:brightness-110"
            >
              إنشاء النسخة
            </PendingButton>
          </PendingForm>
        ))}
      </div>
    </section>
  );
}
