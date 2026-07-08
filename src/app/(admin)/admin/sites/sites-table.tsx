"use client";

import Link from "next/link";

import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { Badge } from "@/components/ui/badge";

export type SiteRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  locale: string;
  isPublished: boolean;
  createdAt: string;
  tenantName: string;
  themeName: string;
};

const toneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  PUBLISHED: "success",
  DRAFT: "neutral",
  EXPIRED: "danger",
  SUSPENDED: "danger",
};

const columns: Column<SiteRow>[] = [
  {
    key: "title",
    header: "الموقع",
    render: (r) => (
      <div>
        <Link href={`/admin/sites/${r.id}`} className="font-bold text-white no-underline transition hover:text-amber-200">
          {r.title}
        </Link>
        <p className="text-xs text-white/50" dir="ltr">
          {r.slug}.frameid.app
        </p>
      </div>
    ),
    searchable: true,
  },
  {
    key: "tenantName",
    header: "العميل",
    render: (r) => (
      <span className="text-sm text-white/70">{r.tenantName}</span>
    ),
  },
  {
    key: "themeName",
    header: "القالب",
    render: (r) => (
      <span className="text-sm text-white/60">{r.themeName}</span>
    ),
  },
  {
    key: "status",
    header: "الحالة",
    render: (r) => (
      <Badge tone={toneMap[r.status] || "neutral"}>{r.status}</Badge>
    ),
  },
  {
    key: "locale",
    header: "اللغة",
    render: (r) => (r.locale === "ar" ? "العربية" : r.locale),
  },
  {
    key: "createdAt",
    header: "تاريخ الإنشاء",
    render: (r) => new Date(r.createdAt).toLocaleDateString("ar-EG"),
  },
];

export function SitesTable({ data }: { data: SiteRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      keyField="id"
      pageSize={20}
      actions={(site) => (
        <Link href={`/admin/sites/${site.id}`} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-200 no-underline transition hover:bg-amber-500/20">
          Workspace
        </Link>
      )}
    />
  );
}
