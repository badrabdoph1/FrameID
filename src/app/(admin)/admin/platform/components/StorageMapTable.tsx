"use client";

import { AdminStatusBadge } from "@/components/layout/admin-status-badge";

type StorageLocation = "database" | "git" | "storage" | "generated";

interface StorageMapEntry {
  id: string;
  label: string;
  location: StorageLocation;
  locationLabel: string;
  status: "ok" | "warning" | "error" | "unknown";
  lastUpdatedAt: string | null;
  includedInBackup: boolean;
  restoredOnTransfer: boolean;
  detail?: string;
}

interface StorageMapTableProps {
  entries: StorageMapEntry[];
}

const LOCATION_STYLES: Record<StorageLocation, string> = {
  database: "bg-sky-500/10 text-sky-400",
  git: "bg-purple-500/10 text-purple-400",
  storage: "bg-amber-500/10 text-amber-400",
  generated: "bg-neutral-500/10 text-neutral-400",
};

const LOCATION_ICONS: Record<StorageLocation, string> = {
  database: "◉",
  git: "⎇",
  storage: "▤",
  generated: "⟳",
};

function statusTone(status: StorageMapEntry["status"]): "success" | "danger" | "warning" | "default" {
  if (status === "ok") return "success";
  if (status === "error") return "danger";
  if (status === "warning") return "warning";
  return "default";
}

function statusLabel(status: StorageMapEntry["status"]) {
  if (status === "ok") return "سليم";
  if (status === "error") return "خطأ";
  if (status === "warning") return "تنبيه";
  return "غير محدد";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

export function StorageMapTable({ entries }: StorageMapTableProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">خريطة التخزين</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          موقع كل عنصر وما إذا كان مشمولاً بالنسخ الاحتياطي.
        </p>
      </div>

      <div className="hidden lg:grid lg:grid-cols-[1fr_auto_auto_auto_auto_auto] lg:gap-x-4">
        <div className="border-b border-white/[0.07] pb-2 text-[10px] font-black text-white/30">
          العنصر
        </div>
        <div className="border-b border-white/[0.07] pb-2 text-[10px] font-black text-white/30">
          مكان الحفظ
        </div>
        <div className="border-b border-white/[0.07] pb-2 text-[10px] font-black text-white/30">
          الحالة
        </div>
        <div className="border-b border-white/[0.07] pb-2 text-[10px] font-black text-white/30">
          آخر تحديث
        </div>
        <div className="border-b border-white/[0.07] pb-2 text-center text-[10px] font-black text-white/30">
          ضمن النسخة
        </div>
        <div className="border-b border-white/[0.07] pb-2 text-center text-[10px] font-black text-white/30">
          يعود عند النقل
        </div>
      </div>

      <div className="space-y-2">
        {entries.map((entry, idx) => (
          <div
            key={entry.id}
            className={`rounded-xl border border-white/[0.06] p-3 ${idx % 2 === 0 ? "bg-black/20" : "bg-white/[0.015]"}`}
          >
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto_auto] lg:items-center lg:gap-x-4">
              <div className="min-w-0">
                <p className="text-sm font-black text-white">{entry.label}</p>
                {entry.detail ? (
                  <p className="mt-1 text-[11px] font-bold text-white/30">{entry.detail}</p>
                ) : null}
              </div>

              <div className="hidden lg:block">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${LOCATION_STYLES[entry.location]}`}>
                  <span className="text-[10px]">{LOCATION_ICONS[entry.location]}</span>
                  {entry.locationLabel}
                </span>
              </div>

              <div className="hidden lg:block">
                <AdminStatusBadge tone={statusTone(entry.status)}>
                  {statusLabel(entry.status)}
                </AdminStatusBadge>
              </div>

              <div className="hidden lg:block">
                <span className="text-[11px] font-bold text-white/45">{formatDate(entry.lastUpdatedAt)}</span>
              </div>

              <div className="hidden lg:flex lg:justify-center">
                <BooleanIndicator value={entry.includedInBackup} />
              </div>

              <div className="hidden lg:flex lg:justify-center">
                <BooleanIndicator value={entry.restoredOnTransfer} />
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-3 lg:hidden">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${LOCATION_STYLES[entry.location]}`}>
                  <span className="text-[10px]">{LOCATION_ICONS[entry.location]}</span>
                  {entry.locationLabel}
                </span>
                <AdminStatusBadge tone={statusTone(entry.status)}>
                  {statusLabel(entry.status)}
                </AdminStatusBadge>
                <span className="text-[11px] font-bold text-white/45">{formatDate(entry.lastUpdatedAt)}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-white/30">ضمن النسخة:</span>
                    <BooleanIndicator value={entry.includedInBackup} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-white/30">عند النقل:</span>
                    <BooleanIndicator value={entry.restoredOnTransfer} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BooleanIndicator({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-[13px] font-black text-emerald-400">
      ✓
    </span>
  ) : (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-red-500/10 text-[13px] font-black text-red-400">
      ✗
    </span>
  );
}
