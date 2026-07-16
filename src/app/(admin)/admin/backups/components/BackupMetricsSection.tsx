"use client";

import { Metric } from "@/components/layout/admin-metric";

interface BackupMetricsSectionProps {
  completed: number;
  failed: number;
  storageUsed: number;
  latestBackupDate: string | null;
  latestRestoreDate: string | null;
  latestAuto: string | null;
  latestManual: string | null;
  latestFull: string | null;
  latestDatabase: string | null;
  latestUploads: string | null;
  successRate: number | null;
  latestRestore: {
    id: string;
    backupJobId: string;
    type: string;
    status: string;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
  } | null;
  avgDurationMs: number | null;
}

export function BackupMetricsSection({
  completed,
  failed,
  storageUsed,
  latestBackupDate,
  latestRestoreDate,
  latestAuto,
  latestManual,
  latestFull,
  latestDatabase,
  latestUploads,
  successRate,
  latestRestore,
  avgDurationMs,
}: BackupMetricsSectionProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <h3 className="mb-3 text-sm font-black text-[#fff7e8]">آخر العمليات</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="آخر نسخة" value={latestBackupDate ?? "لم يتم"} />
          <Metric label="آخر استعادة" value={latestRestoreDate ?? "لم يتم"} />
          <Metric label="آخر نسخة تلقائية" value={latestAuto ?? "لم يتم"} tone="info" />
          <Metric label="آخر نسخة يدوية" value={latestManual ?? "لم يتم"} tone="champagne" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <h3 className="mb-3 text-sm font-black text-[#fff7e8]">حسب النوع</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="آخر نسخة كاملة" value={latestFull ?? "لم يتم"} tone="success" />
          <Metric label="آخر نسخة داتا فقط" value={latestDatabase ?? "لم يتم"} tone="success" />
          <Metric label="آخر نسخة ملفات" value={latestUploads ?? "لم يتم"} />
          <Metric
            label="نسبة النجاح"
            value={successRate !== null ? `${successRate}%` : "—"}
            tone={successRate === null ? "default" : successRate >= 80 ? "success" : successRate >= 50 ? "warning" : "danger"}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 lg:col-span-2">
        <h3 className="mb-3 text-sm font-black text-[#fff7e8]">ملخص عام</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="نسخ سليمة" value={completed} tone="success" />
          <Metric label="نسخ فاشلة" value={failed} tone={failed > 0 ? "danger" : "default"} />
          <Metric label="المساحة المسجلة" value={formatBytes(storageUsed)} tone={failed ? "warning" : "default"} />
          <Metric label="متوسط المدة" value={avgDurationMs !== null ? formatDuration(avgDurationMs) : "—"} tone="info" />
        </div>
        {latestRestore ? (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <p className="text-xs font-bold text-white/40">آخر استعادة مسجلة</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-black text-white/70">{latestRestore.type}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${latestRestore.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" : latestRestore.status === "FAILED" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-white/40"}`}>
                {translateRestoreStatus(latestRestore.status)}
              </span>
              <span className="font-bold text-white/35">{formatDate(latestRestore.createdAt)}</span>
              {latestRestore.errorMessage ? (
                <span className="font-bold text-red-400">{latestRestore.errorMessage}</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)} ثانية`;
  return `${Math.round(ms / 60_000)} دقيقة`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

function translateRestoreStatus(status: string) {
  if (status === "COMPLETED") return "مكتملة";
  if (status === "FAILED") return "فشلت";
  if (status === "RUNNING") return "قيد التشغيل";
  if (status === "PENDING") return "معلقة";
  return status;
}
