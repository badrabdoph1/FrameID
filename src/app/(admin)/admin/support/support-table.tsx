"use client";

import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { Badge } from "@/components/ui/badge";

export type CaseRow = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  tenantName: string;
  createdAt: string;
};

const statusToneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  OPEN: "warning",
  PENDING_CUSTOMER: "neutral",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const priorityToneMap: Record<string, "danger" | "warning" | "neutral"> = {
  urgent: "danger",
  high: "warning",
  normal: "neutral",
  low: "neutral",
};

const columns: Column<CaseRow>[] = [
  {
    key: "subject",
    header: "الموضوع",
    render: (r) => (
      <div>
        <p className="font-medium text-white">{r.subject}</p>
        <p className="text-xs text-white/50">{r.tenantName}</p>
      </div>
    ),
    searchable: true,
  },
  {
    key: "status",
    header: "الحالة",
    render: (r) => (
      <Badge tone={statusToneMap[r.status] || "neutral"}>{r.status}</Badge>
    ),
  },
  {
    key: "priority",
    header: "الأولوية",
    render: (r) => (
      <Badge tone={priorityToneMap[r.priority] || "neutral"}>{r.priority}</Badge>
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
