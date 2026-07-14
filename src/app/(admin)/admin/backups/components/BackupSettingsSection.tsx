"use client";

import { PendingForm, PendingButton } from "@/components/admin/pending-button";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { getBackupPolicy, BACKUP_TYPE_LABELS, type SupportedBackupType } from "@/modules/backups/backup-policy";

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
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">الجدولة والاحتفاظ</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          تحكم في جدولة النسخ التلقائية وعدد النسخ المحفوظة.
        </p>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
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
              <div className="mb-3 flex justify-between gap-3">
                <h3 className="text-sm font-black text-white">
                  {BACKUP_TYPE_LABELS[setting.type]}
                </h3>
                <AdminStatusBadge tone={setting.enabled ? "success" : "default"}>
                  {setting.enabled ? "مفعل" : "متوقف"}
                </AdminStatusBadge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="الحالة">
                  <select
                    name="enabled"
                    defaultValue={setting.enabled ? "true" : "false"}
                    className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-amber-300/30"
                  >
                    <option value="true">مفعل</option>
                    <option value="false">متوقف</option>
                  </select>
                </Field>
                <Field label="الجدول الرسمي">
                  <input
                    readOnly
                    value={policy.schedule}
                    className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-amber-300/30 font-mono opacity-70"
                  />
                </Field>
                <Field label="الاحتفاظ الرسمي">
                  <input
                    readOnly
                    value={policy.retentionCount}
                    className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-amber-300/30 opacity-70"
                  />
                </Field>
              </div>
              <p className="mt-3 text-xs font-bold text-white/35">
                آخر تشغيل: {setting.lastRunAt ? formatDate(setting.lastRunAt.toISOString()) : "لم يتم"} · القادم: {setting.nextRunAt ? formatDate(setting.nextRunAt.toISOString()) : "غير محسوب"}
              </p>
              <PendingButton
                pendingText="جاري الحفظ..."
                className="mt-3 w-full rounded-xl border border-amber-300/20 px-3 py-2 text-xs font-black text-[#f3cf73] transition hover:bg-[#f3cf73]/10"
              >
                حفظ الإعدادات
              </PendingButton>
            </PendingForm>
          );
        })}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-white/45">
      <span>{label}</span>
      {children}
    </label>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}
