"use client";

import { PendingForm, PendingButton } from "@/components/admin/pending-button";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { getBackupPolicy, BACKUP_TYPE_LABELS, BACKUP_TYPE_DESCRIPTIONS, type SupportedBackupType } from "@/modules/backups/backup-policy";

interface BackupSettingRow {
  type: SupportedBackupType;
  enabled: boolean;
  schedule: string;
  retentionCount: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
}

interface BackupSettingsSectionProps {
  settings: BackupSettingRow[];
  onUpdateBackupSettings: (type: SupportedBackupType, enabled: boolean, schedule: string, retentionCount: number) => Promise<void>;
  onVerifyAllBackups: () => Promise<void>;
}

export function BackupSettingsSection({
  settings,
  onUpdateBackupSettings,
  onVerifyAllBackups,
}: BackupSettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">الجدولة والاحتفاظ</h2>
          <p className="mt-1 text-xs font-bold text-white/40">
            تحكم في تشغيل النسخ التلقائية. الجدولة والاحتفاظ محددة رسمياً ولا يمكن تعديلها.
          </p>
        </div>
        <PendingForm action={onVerifyAllBackups}>
          <PendingButton
            pendingText="جاري التحقق..."
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/70 transition hover:border-amber-300/30"
          >
            تحقق من الجميع
          </PendingButton>
        </PendingForm>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {settings.map((setting) => {
          const policy = getBackupPolicy(setting.type);
          return (
            <PendingForm
              key={setting.type}
              action={async (formData: FormData) => {
                const enabled = formData.get("enabled") === "true";
                await onUpdateBackupSettings(setting.type, enabled, setting.schedule, setting.retentionCount);
              }}
              className="rounded-2xl border border-white/[0.06] bg-black/20 p-4"
            >
              <input type="hidden" name="type" value={setting.type} />
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-white">
                    {BACKUP_TYPE_LABELS[setting.type]}
                  </h3>
                  <p className="mt-1 text-[11px] font-bold text-white/30">
                    {BACKUP_TYPE_DESCRIPTIONS[setting.type]}
                  </p>
                </div>
                <AdminStatusBadge tone={setting.enabled ? "success" : "default"}>
                  {setting.enabled ? "مفعل" : "متوقف"}
                </AdminStatusBadge>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  <p className="text-[10px] font-bold text-white/30">الجدول</p>
                  <p className="text-xs font-black text-white/70">{policy.schedule}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  <p className="text-[10px] font-bold text-white/30">الاحتفاظ</p>
                  <p className="text-xs font-black text-white/70">{policy.retentionCount} نسخ</p>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/45">الحالة:</span>
                  <select
                    name="enabled"
                    defaultValue={setting.enabled ? "true" : "false"}
                    className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-amber-300/30"
                  >
                    <option value="true">مفعل</option>
                    <option value="false">متوقف</option>
                  </select>
                </label>
              </div>
              <p className="mb-3 text-[11px] font-bold text-white/30">
                آخر تشغيل: {setting.lastRunAt ? formatDate(setting.lastRunAt.toISOString()) : "لم يتم"} · القادم: {setting.nextRunAt ? formatDate(setting.nextRunAt.toISOString()) : "غير محسوب"}
              </p>
              <PendingButton
                pendingText="جاري الحفظ..."
                className="w-full rounded-xl border border-amber-300/20 px-3 py-2 text-xs font-black text-[#f3cf73] transition hover:bg-[#f3cf73]/10"
              >
                حفظ
              </PendingButton>
            </PendingForm>
          );
        })}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}
