"use client";

import { AdminStatusBadge } from "@/components/layout/admin-status-badge";

interface EmergencyCenterProps {
  estimatedMinutes: number;
  gitRestoreReady: boolean;
  databaseRestoreReady: boolean;
  uploadsRestoreReady: boolean;
  lastValidBackup: string | null;
  details: {
    label: string;
    value: string;
    status: "ok" | "warning" | "error" | "unknown";
  }[];
}

const statusDotColor: Record<EmergencyCenterProps["details"][number]["status"], string> = {
  ok: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  unknown: "bg-white/30",
};

const statusTone: Record<EmergencyCenterProps["details"][number]["status"], "success" | "warning" | "danger" | "neutral"> = {
  ok: "success",
  warning: "warning",
  error: "danger",
  unknown: "neutral",
};

function formatBackupDate(value: string | null) {
  if (!value) return "لا يوجد";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

function ReadyCard({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        ready
          ? "border-emerald-500/20 bg-emerald-500/[0.03]"
          : "border-red-500/20 bg-red-500/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-[#fff7e8]">{label}</span>
        <AdminStatusBadge tone={ready ? "success" : "danger"}>
          {ready ? "جاهز" : "غير جاهز"}
        </AdminStatusBadge>
      </div>
    </div>
  );
}

export function EmergencyCenter({
  estimatedMinutes,
  gitRestoreReady,
  databaseRestoreReady,
  uploadsRestoreReady,
  lastValidBackup,
  details,
}: EmergencyCenterProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-[#fff7e8]">مركز الطوارئ</h2>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-black text-[#f3cf73]">{estimatedMinutes}</span>
            <span className="text-xs font-bold text-white/40">دقيقة</span>
            <span className="mt-1 text-[10px] font-bold text-white/30">الوقت المتوقع للاستعادة</span>
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <ReadyCard label="Git" ready={gitRestoreReady} />
              <ReadyCard label="النسخة الاحتياطية" ready={databaseRestoreReady} />
              <ReadyCard label="الملفات المرفوعة" ready={uploadsRestoreReady} />
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <p className="text-xs font-bold text-white/40">آخر نسخة احتياطية صالحة</p>
              <p className="mt-1 text-sm font-black text-[#fff7e8]">{formatBackupDate(lastValidBackup)}</p>
            </div>
          </div>
        </div>
      </div>

      {details.length > 0 && (
        <div className="space-y-2">
          {details.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3"
            >
              <div className="flex items-center gap-3">
                <span className={`size-2 shrink-0 rounded-full ${statusDotColor[item.status]}`} />
                <span className="text-sm font-bold text-white/65">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#fff7e8]">{item.value}</span>
                <AdminStatusBadge tone={statusTone[item.status]}>
                  {item.status === "ok"
                    ? "سليم"
                    : item.status === "warning"
                      ? "تحذير"
                      : item.status === "error"
                        ? "خطأ"
                        : "غير معروف"}
                </AdminStatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
