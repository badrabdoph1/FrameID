"use client";

import { AdminStatusBadge } from "@/components/layout/admin-status-badge";

interface IntegrityCardProps {
  score: number;
  checks: {
    id: string;
    label: string;
    status: "ok" | "warning" | "error" | "unknown";
    detail?: string;
    reason?: string;
  }[];
  lastCheckAt: string;
  lastUpdatedAt: string | null;
}

const statusDotColor: Record<IntegrityCardProps["checks"][number]["status"], string> = {
  ok: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  unknown: "bg-white/30",
};

const statusTone: Record<IntegrityCardProps["checks"][number]["status"], "success" | "warning" | "danger" | "neutral"> = {
  ok: "success",
  warning: "warning",
  error: "danger",
  unknown: "neutral",
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

function getScoreColor(score: number) {
  if (score >= 80) return { ring: "text-emerald-400", stroke: "#34d399", glow: "shadow-emerald-500/20" };
  if (score >= 50) return { ring: "text-amber-400", stroke: "#fbbf24", glow: "shadow-amber-500/20" };
  return { ring: "text-red-400", stroke: "#f87171", glow: "shadow-red-500/20" };
}

export function IntegrityCard({ score, checks, lastCheckAt, lastUpdatedAt }: IntegrityCardProps) {
  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
        <div className="relative flex flex-col items-center">
          <svg width="140" height="140" viewBox="0 0 120 120" className="drop-shadow-lg">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-white/[0.06]"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={colors.stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${colors.ring}`}>{score}%</span>
            <span className="text-[10px] font-bold text-white/40">السلامة</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <AdminStatusBadge
              tone={score >= 80 ? "success" : score >= 50 ? "warning" : "danger"}
            >
              {score >= 80 ? "سليم" : score >= 50 ? "يحتاج مراجعة" : "حرج"}
            </AdminStatusBadge>
            <span className="text-xs font-bold text-white/40">
              آخر فحص: {formatTimestamp(lastCheckAt)}
            </span>
            {lastUpdatedAt && (
              <span className="text-xs font-bold text-white/40">
                آخر تحديث: {formatTimestamp(lastUpdatedAt)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {checks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3"
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${statusDotColor[check.status]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-[#fff7e8]">{check.label}</span>
                    <AdminStatusBadge tone={statusTone[check.status]}>
                      {check.status === "ok"
                        ? "سليم"
                        : check.status === "warning"
                          ? "تحذير"
                          : check.status === "error"
                            ? "خطأ"
                            : "غير معروف"}
                    </AdminStatusBadge>
                  </div>
                  {(check.detail || check.reason) && (
                    <p className="mt-1 text-xs font-bold text-white/40">
                      {check.detail ?? check.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
