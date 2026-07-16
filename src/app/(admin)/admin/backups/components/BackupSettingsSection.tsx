"use client";

import { useState } from "react";
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
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[#fff7e8]">الجدولة والاحتفاظ</h2>
          <p className="mt-0.5 text-[11px] font-bold text-white/35">
            تحكم في تشغيل النسخ التلقائية لكل نوع.
          </p>
        </div>
        <PendingForm action={onVerifyAllBackups}>
          <PendingButton
            pendingText="جاري التحقق..."
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-black text-white/60 transition hover:border-amber-300/30"
          >
            تحقق من الجميع
          </PendingButton>
        </PendingForm>
      </div>

      <div className="space-y-1.5">
        {settings.map((setting) => {
          const policy = getBackupPolicy(setting.type);
          const isOpen = expanded === setting.type;
          return (
            <div
              key={setting.type}
              className={`rounded-xl border transition ${isOpen ? "border-amber-300/15 bg-amber-300/[0.02]" : "border-white/[0.05] bg-black/15"}`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : setting.type)}
                className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-3.5 py-2.5 text-start"
              >
                <span className="min-w-[80px] text-xs font-black text-white">{BACKUP_TYPE_LABELS[setting.type]}</span>
                <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-white/50">{policy.schedule}</span>
                <span className="text-[10px] font-bold text-white/30">{policy.retentionCount} نسخ</span>
                <AdminStatusBadge tone={setting.enabled ? "success" : "default"}>
                  {setting.enabled ? "مفعل" : "متوقف"}
                </AdminStatusBadge>
                <span className="ms-auto text-[10px] font-bold text-white/20">
                  {setting.lastRunAt ? `آخر: ${formatShort(setting.lastRunAt.toISOString())}` : "لم يُشغّل"}
                </span>
                <svg className={`h-3.5 w-3.5 text-white/30 transition ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>

              {isOpen ? (
                <div className="border-t border-white/[0.05] px-3.5 py-3">
                  <PendingForm
                    action={async (formData: FormData) => {
                      const enabled = formData.get("enabled") === "true";
                      await onUpdateBackupSettings(setting.type, enabled, setting.schedule, setting.retentionCount);
                    }}
                  >
                    <input type="hidden" name="type" value={setting.type} />
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="grid gap-1">
                        <span className="text-[10px] font-bold text-white/35">الحالة</span>
                        <select
                          name="enabled"
                          defaultValue={setting.enabled ? "true" : "false"}
                          className="rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-300/30"
                        >
                          <option value="true">مفعل</option>
                          <option value="false">متوقف</option>
                        </select>
                      </label>
                      <div className="grid gap-1">
                        <span className="text-[10px] font-bold text-white/35">آخر تشغيل</span>
                        <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs font-bold text-white/40">
                          {setting.lastRunAt ? formatDate(setting.lastRunAt.toISOString()) : "لم يتم"}
                        </span>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[10px] font-bold text-white/35">التشغيل القادم</span>
                        <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs font-bold text-white/40">
                          {setting.nextRunAt ? formatDate(setting.nextRunAt.toISOString()) : "غير محسوب"}
                        </span>
                      </div>
                      <PendingButton
                        pendingText="جاري الحفظ..."
                        className="rounded-lg bg-[#f3cf73]/10 px-3 py-1.5 text-xs font-black text-[#f3cf73] transition hover:bg-[#f3cf73]/20"
                      >
                        حفظ
                      </PendingButton>
                    </div>
                  </PendingForm>
                </div>
              ) : null}
            </div>
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

function formatShort(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "short", timeStyle: "short" });
}
