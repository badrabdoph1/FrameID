"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";

export type CustomerRow = {
  id: string;
  displayName: string;
  ownerName: string;
  ownerEmail: string;
  status: string;
  trialEndsAt: string | null;
  sitesCount: number;
  paymentsCount: number;
  createdAt: string;
};

type Props = {
  data: CustomerRow[];
  page: number;
  totalPages: number;
  basePath: string;
  search: string;
  statusFilter: string;
};

const toneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  TRIAL: "warning",
  EXPIRED: "danger",
  SUSPENDED: "danger",
};

export function CustomersTable({ data, page, totalPages, basePath, search, statusFilter }: Props) {
  const buildPageLink = (p: number) => {
    const url = new URLSearchParams();
    if (search) url.set("search", search);
    if (statusFilter) url.set("status", statusFilter);
    if (p > 1) url.set("page", String(p));
    const qs = url.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">العميل</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">المالك</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">الحالة</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">المواقع</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">نهاية التجربة</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/40">التاريخ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <span className="font-medium text-white/80">{row.displayName}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-white/80">{row.ownerName}</div>
                  <div className="text-xs text-white/40">{row.ownerEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge tone={toneMap[row.status] || "neutral"}>
                    {row.status}
                  </AdminStatusBadge>
                </td>
                <td className="px-4 py-3 text-white/60">{row.sitesCount}</td>
                <td className="px-4 py-3 text-white/60">
                  {row.trialEndsAt
                    ? new Date(row.trialEndsAt).toLocaleDateString("ar-EG")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-white/60">
                  {new Date(row.createdAt).toLocaleDateString("ar-EG")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${row.id}`}
                    className="flex items-center gap-1 text-xs text-champagne/70 hover:text-champagne transition"
                  >
                    فتح
                    <ExternalLink className="size-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-white/35">
                  لا يوجد عملاء
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/35">
            صفحة {page} من {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildPageLink(page - 1)}
                className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/60 hover:text-white/80 hover:bg-white/[0.04] transition"
              >
                <ChevronRight className="size-3" />
                السابق
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildPageLink(page + 1)}
                className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/60 hover:text-white/80 hover:bg-white/[0.04] transition"
              >
                التالي
                <ChevronLeft className="size-3" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
