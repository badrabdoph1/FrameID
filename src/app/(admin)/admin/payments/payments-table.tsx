"use client";

import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { Badge } from "@/components/ui/badge";

export type PaymentRow = {
  id: string;
  tenantName: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewerName: string | null;
};

const toneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  EXPIRED: "neutral",
};

function formatMethod(method: string): string {
  switch (method) {
    case "INSTAPAY":
      return "إنستا باي";
    case "VODAFONE_CASH":
      return "فودافون كاش";
    case "STRIPE":
      return "Stripe";
    case "PAYPAL":
      return "PayPal";
    default:
      return method;
  }
}

const columns: Column<PaymentRow>[] = [
  { key: "tenantName", header: "العميل", searchable: true },
  {
    key: "amount",
    header: "المبلغ",
    render: (r) => `${r.amount} ج.م`,
  },
  {
    key: "method",
    header: "طريقة الدفع",
    render: (r) => formatMethod(r.method),
  },
  {
    key: "status",
    header: "الحالة",
    render: (r) => (
      <Badge tone={toneMap[r.status] || "neutral"}>{r.status}</Badge>
    ),
  },
  {
    key: "createdAt",
    header: "التاريخ",
    render: (r) => new Date(r.createdAt).toLocaleDateString("ar-EG"),
  },
];

export function PaymentsTable({ data }: { data: PaymentRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyField="id"
      pageSize={15}
    />
  );
}
