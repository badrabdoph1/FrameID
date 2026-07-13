"use client";

import { PendingForm, PendingButton } from "@/components/admin/pending-button";
import { BACKUP_TYPE_DESCRIPTIONS, BACKUP_TYPE_LABELS, SUPPORTED_BACKUP_TYPES, type SupportedBackupType } from "@/modules/backups/backup-policy";

interface BackupCreationSectionProps {
  onCreateBackup: (type: SupportedBackupType) => Promise<void>;
}

export function BackupCreationSection({ onCreateBackup }: BackupCreationSectionProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">إنشاء نسخة</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          اختر النوع واضغط الزر. لا تُعد النسخة مكتملة إلا بعد رفعها والتحقق منها على فرع النسخ الرسمي في GitHub؛ لن يظهر Commit على فرع main.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {SUPPORTED_BACKUP_TYPES.map((type) => (
          <PendingForm
            key={type}
            action={async () => await onCreateBackup(type)}
            className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"
          >
            <input type="hidden" name="type" value={type} />
            <h3 className="text-sm font-black text-white">{BACKUP_TYPE_LABELS[type]}</h3>
            <p className="mt-2 min-h-10 text-xs font-bold leading-5 text-white/45">
              {BACKUP_TYPE_DESCRIPTIONS[type]}
            </p>
            <PendingButton
              pendingText="جاري الإنشاء..."
              className="mt-4 w-full rounded-xl bg-[#f3cf73] px-4 py-2.5 text-sm font-black text-[#17120a] transition hover:brightness-110"
            >
              إنشاء النسخة
            </PendingButton>
          </PendingForm>
        ))}
      </div>
    </section>
  );
}