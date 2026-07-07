"use client";

import { DataTable, type Column } from "@/components/admin/shared/data-table";

export type LogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  createdAt: string;
};

const columns: Column<LogRow>[] = [
  { key: "action", header: "الإجراء", searchable: true },
  { key: "entityType", header: "الكيان" },
  {
    key: "entityId",
    header: "المعرف",
    render: (r) => r.entityId ?? "—",
  },
  { key: "actorEmail", header: "المستخدم", render: (r) => r.actorEmail ?? "system" },
  {
    key: "createdAt",
    header: "التاريخ",
    render: (r) => new Date(r.createdAt).toLocaleString("ar-EG"),
  },
];

export function SecurityTable({ data }: { data: LogRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyField="id"
      pageSize={25}
    />
  );
}
