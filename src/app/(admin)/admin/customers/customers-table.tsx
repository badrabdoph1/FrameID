"use client";

import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { Badge } from "@/components/ui/badge";

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

const toneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  TRIAL: "warning",
  EXPIRED: "danger",
  SUSPENDED: "danger",
};

const columns: Column<CustomerRow>[] = [
  {
    key: "displayName",
    header: "العميل",
    render: (r) => (
      <div>
        <p className="font-medium text-white">{r.displayName}</p>
        <p className="text-xs text-white/50">{r.ownerEmail}</p>
      </div>
    ),
    searchable: true,
  },
  {
    key: "ownerName",
    header: "المالك",
    render: (r) => r.ownerName || "—",
  },
  {
    key: "status",
    header: "الحالة",
    render: (r) => (
      <Badge tone={toneMap[r.status] || "neutral"}>{r.status}</Badge>
    ),
  },
  { key: "sitesCount", header: "المواقع" },
  { key: "paymentsCount", header: "المدفوعات" },
  {
    key: "trialEndsAt",
    header: "نهاية التجربة",
    render: (r) => r.trialEndsAt ?? "—",
  },
  {
    key: "createdAt",
    header: "تاريخ التسجيل",
  },
];

export function CustomersTable({ data }: { data: CustomerRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyField="id"
      pageSize={20}
      onRowClick={(row) => {
        window.location.href = `/admin/customers/${row.id}`;
      }}
    />
  );
}
