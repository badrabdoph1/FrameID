"use client";

import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export type CaseRow = {
  id: string;
  subject: string;
  status: string;
  tenantName: string;
  tenantId: string;
  createdAt: string;
};

const statusToneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  OPEN: "warning",
  PENDING_CUSTOMER: "neutral",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const statusLabelMap: Record<string, string> = {
  OPEN: "مفتوحة",
  PENDING_CUSTOMER: "بانتظار العميل",
  RESOLVED: "تم الحل",
  CLOSED: "مغلقة",
};

const columns: Column<CaseRow>[] = [
  {
    key: "subject",
    header: "الموضوع",
    render: (r) => (
      <div>
        <p className="font-medium text-white">{r.subject}</p>
        <Link href={`/admin/customers/${r.tenantId}?tab=notes`} className="text-xs text-white/50 underline-offset-4 hover:text-amber-200 hover:underline">{r.tenantName}</Link>
      </div>
    ),
    searchable: true,
  },
  {
    key: "status",
    header: "الحالة",
    render: (r) => (
      <Badge tone={statusToneMap[r.status] || "neutral"}>{statusLabelMap[r.status] ?? r.status}</Badge>
    ),
  },
  {
    key: "createdAt",
    header: "التاريخ",
    render: (r) => new Date(r.createdAt).toLocaleDateString("ar-EG"),
  },
];

export function SupportTable({ data }: { data: CaseRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyField="id"
      pageSize={20}
      emptyMessage="لا توجد تذاكر دعم."
    />
  );
}
