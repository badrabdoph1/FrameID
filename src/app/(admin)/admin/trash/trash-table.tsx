"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { restoreFromTrashAction, permanentDeleteAction } from "@/app/(admin)/admin/trash/actions";

export type TrashRow = {
  id: string;
  displayName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  ownerId: string;
  previousStatus: string;
  sitesCount: number;
  paymentsCount: number;
  mediaCount: number;
  deletedAt: string | null;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  TRIAL: "تجريبي",
  EXPIRED: "منتهي",
  TRIAL_EXPIRED: "انتهت التجربة",
  SUSPENDED: "موقوف",
};

const toneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  TRIAL: "warning",
  EXPIRED: "danger",
  TRIAL_EXPIRED: "danger",
  SUSPENDED: "danger",
};

type Props = {
  data: TrashRow[];
  page: number;
  totalPages: number;
  buildLink: (params: Record<string, string | undefined>) => string;
  search: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function timeSinceDeleted(value: string | null) {
  if (!value) return "—";
  const deletedDate = new Date(value);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - deletedDate.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "منذ يوم";
  if (diffDays < 30) return `منذ ${diffDays} يوم`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "منذ شهر";
  if (diffMonths < 12) return `منذ ${diffMonths} شهر`;
  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return "منذ سنة";
  return `منذ ${diffYears} سنة`;
}

export function TrashTable({
  data,
  page,
  totalPages,
  buildLink,
  search,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.03] px-4 py-10 text-center text-sm font-bold text-white/35">
        لا يوجد عملاء محذوفون مطابقون للبحث
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">
                العميل
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">
                الحالة السابقة
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">
                تاريخ الحذف
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">
                المدة في السلة
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">
                المحتوى
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <TrashTableRow
                key={row.id}
                row={row}
                confirmDeleteId={confirmDeleteId}
                setConfirmDeleteId={setConfirmDeleteId}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div role="list" aria-label="قائمة المحذوفات للموبايل" className="grid gap-3 md:hidden">
        {data.map((row) => (
          <TrashCard
            key={row.id}
            row={row}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/35">
            صفحة {page} من {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildLink({ page: String(page - 1), search })}
                className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.04] hover:text-white/80"
              >
                <ChevronRight className="size-3" /> السابق
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildLink({ page: String(page + 1), search })}
                className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.04] hover:text-white/80"
              >
                التالي <ChevronLeft className="size-3" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TrashTableRow({
  row,
  confirmDeleteId,
  setConfirmDeleteId,
}: {
  row: TrashRow;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}) {
  return (
    <tr className="border-b border-white/[0.06] transition hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <div className="font-medium text-white/80">{row.displayName}</div>
        <div className="text-xs text-white/40">{row.ownerEmail}</div>
        {row.ownerPhone && (
          <div className="text-xs text-white/30">{row.ownerPhone}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <AdminStatusBadge tone={toneMap[row.previousStatus] || "neutral"}>
          {statusLabels[row.previousStatus] ?? row.previousStatus}
        </AdminStatusBadge>
      </td>
      <td className="px-4 py-3 text-white/55 text-xs">
        {formatDate(row.deletedAt)}
      </td>
      <td className="px-4 py-3 text-white/45 text-xs">
        {timeSinceDeleted(row.deletedAt)}
      </td>
      <td className="px-4 py-3 text-white/45 text-xs">
        {row.sitesCount > 0 && (
          <span className="ml-2">{row.sitesCount} مواقع</span>
        )}
        {row.paymentsCount > 0 && (
          <span className="ml-2">{row.paymentsCount} مدفوعات</span>
        )}
        {row.mediaCount > 0 && (
          <span>{row.mediaCount} وسائط</span>
        )}
        {row.sitesCount === 0 && row.paymentsCount === 0 && row.mediaCount === 0 && "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 justify-end">
          {confirmDeleteId === row.id ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-red-400/80">
                متأكد؟
              </span>
              <form action={permanentDeleteAction}>
                <input type="hidden" name="customerId" value={row.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-red-600/80 px-2.5 py-1 text-xs font-black text-white transition hover:bg-red-600"
                >
                  نعم احذف
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-black text-white/50 transition hover:bg-white/[0.05]"
              >
                لا
              </button>
            </div>
          ) : (
            <>
              <form action={restoreFromTrashAction}>
                <input type="hidden" name="customerId" value={row.id} />
                <button
                  type="submit"
                  title="استعادة العميل"
                  className="flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-black text-emerald-400 transition hover:bg-emerald-500/20"
                >
                  <RotateCcw className="size-3" />
                  استعادة
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(row.id)}
                title="حذف نهائي"
                className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/8 px-2.5 py-1.5 text-xs font-black text-red-400 transition hover:bg-red-500/15"
              >
                <Trash2 className="size-3" />
                حذف نهائي
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function TrashCard({
  row,
  confirmDeleteId,
  setConfirmDeleteId,
}: {
  row: TrashRow;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
}) {
  return (
    <article
      role="listitem"
      aria-label={row.displayName}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-black text-[#fff7e8]">
            {row.displayName}
          </h2>
          <p className="mt-1 truncate text-sm font-bold text-white/65">
            {row.ownerName}
          </p>
          <p className="truncate text-xs font-bold text-white/38">
            {row.ownerEmail}
          </p>
          {row.ownerPhone && (
            <p className="truncate text-xs font-bold text-white/25">
              {row.ownerPhone}
            </p>
          )}
        </div>
        <AdminStatusBadge tone={toneMap[row.previousStatus] || "neutral"}>
          {statusLabels[row.previousStatus] ?? row.previousStatus}
        </AdminStatusBadge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <Info label="تاريخ الحذف" value={formatDate(row.deletedAt)} />
        <Info label="المدة في السلة" value={timeSinceDeleted(row.deletedAt)} />
        <Info
          label="مواقع"
          value={`${row.sitesCount} موقع`}
        />
        <Info
          label="مدفوعات"
          value={`${row.paymentsCount} طلب`}
        />
      </dl>

      <div className="mt-4 flex gap-2">
        {confirmDeleteId === row.id ? (
          <div className="flex w-full items-center gap-2">
            <span className="text-xs font-bold text-red-400/80">تأكيد الحذف النهائي؟</span>
            <form action={permanentDeleteAction} className="flex-1">
              <input type="hidden" name="customerId" value={row.id} />
              <button
                type="submit"
                className="w-full rounded-xl bg-red-600/80 px-3 py-2 text-xs font-black text-white"
              >
                نعم احذف نهائيًا
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/50"
            >
              تراجع
            </button>
          </div>
        ) : (
          <>
            <form action={restoreFromTrashAction} className="flex-1">
              <input type="hidden" name="customerId" value={row.id} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 py-2.5 text-sm font-black text-emerald-400"
              >
                <RotateCcw className="size-4" />
                استعادة
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirmDeleteId(row.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 py-2.5 text-sm font-black text-red-400"
            >
              <Trash2 className="size-4" />
              حذف نهائي
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3">
      <dt className="text-[0.68rem] font-black text-white/35">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-white/70">{value}</dd>
    </div>
  );
}
