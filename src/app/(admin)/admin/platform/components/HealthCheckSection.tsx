"use client";

import { AdminStatusBadge } from "@/components/layout/admin-status-badge";

interface HealthCheckSectionProps {
  checks: {
    id: string;
    label: string;
    status: "ok" | "warning" | "error" | "unknown";
    latencyMs?: number;
    detail?: string;
    reason?: string;
  }[];
}

const borderColor: Record<HealthCheckSectionProps["checks"][number]["status"], string> = {
  ok: "border-emerald-500/20",
  warning: "border-amber-500/20",
  error: "border-red-500/20",
  unknown: "border-white/[0.06]",
};

const bgColor: Record<HealthCheckSectionProps["checks"][number]["status"], string> = {
  ok: "bg-emerald-500/[0.03]",
  warning: "bg-amber-500/[0.03]",
  error: "bg-red-500/[0.03]",
  unknown: "bg-white/[0.02]",
};

const badgeTone: Record<HealthCheckSectionProps["checks"][number]["status"], "success" | "warning" | "danger" | "neutral"> = {
  ok: "success",
  warning: "warning",
  error: "danger",
  unknown: "neutral",
};

function statusLabel(status: HealthCheckSectionProps["checks"][number]["status"]) {
  if (status === "ok") return "سليم";
  if (status === "warning") return "تحذير";
  if (status === "error") return "خطأ";
  return "غير معروف";
}

function formatLatency(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function HealthCheckSection({ checks }: HealthCheckSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-[#fff7e8]">فحص الخدمات</h2>
        <span className="text-xs font-bold text-white/40">{checks.length} خدمة</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`rounded-xl border p-4 transition-colors ${borderColor[check.status]} ${bgColor[check.status]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-black text-[#fff7e8]">{check.label}</h3>
              <AdminStatusBadge tone={badgeTone[check.status]}>{statusLabel(check.status)}</AdminStatusBadge>
            </div>

            {check.latencyMs !== undefined && (
              <p className="mt-2 text-xs font-bold text-[#f3cf73]">{formatLatency(check.latencyMs)}</p>
            )}

            {check.detail && (
              <p className="mt-2 text-xs font-bold text-white/40">{check.detail}</p>
            )}

            {check.reason && (
              <p className="mt-2 text-xs font-bold text-red-400">{check.reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
