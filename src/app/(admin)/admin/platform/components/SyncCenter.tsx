"use client";

import { AdminStatusBadge } from "@/components/layout/admin-status-badge";

interface SyncPoint {
  id: string;
  label: string;
  timestamp: string | null;
  status: "ok" | "warning" | "error" | "unknown";
  detail?: string;
}

interface SyncCenterProps {
  points: SyncPoint[];
}

function statusTone(status: SyncPoint["status"]): "success" | "danger" | "warning" | "default" {
  if (status === "ok") return "success";
  if (status === "error") return "danger";
  if (status === "warning") return "warning";
  return "default";
}

function statusLabel(status: SyncPoint["status"]) {
  if (status === "ok") return "مزامن";
  if (status === "error") return "فشل";
  if (status === "warning") return "متأخر";
  return "غير محدد";
}

function formatTimestamp(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

export function SyncCenter({ points }: SyncCenterProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">مركز المزامنة</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          حالة آخر مزامنة لكل نقطة اتصال.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 start-3 hidden w-px bg-white/[0.06] lg:block" style={{ insetInlineStart: "calc(50% - 0.5px)" }} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {points.map((point) => {
            const ts = formatTimestamp(point.timestamp);
            return (
              <div
                key={point.id}
                className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-white">{point.label}</p>
                  <AdminStatusBadge tone={statusTone(point.status)}>
                    {statusLabel(point.status)}
                  </AdminStatusBadge>
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <span className="size-[6px] shrink-0 rounded-full bg-[#f3cf73]" />
                  <span className="text-[11px] font-bold text-white/45">
                    {ts ?? "لم يتم"}
                  </span>
                </div>

                {point.detail ? (
                  <p className="text-[11px] font-bold text-white/30">{point.detail}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
