import Link from "next/link";
import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export const dynamic = "force-dynamic";

export default async function AdminSitesPage() {
  await requireSuperAdminSession();

  const sites = await prisma.site.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      locale: true,
      isPublished: true,
      createdAt: true,
      tenant: {
        select: { displayName: true },
      },
      theme: {
        select: { name: true, code: true },
      },
    },
  });

  type SiteRow = {
    id: string;
    slug: string;
    title: string;
    status: string;
    locale: string;
    isPublished: boolean;
    createdAt: Date;
    tenantName: string;
    themeName: string;
  };

  const columns: Column<SiteRow>[] = [
    {
      key: "title",
      header: "الموقع",
      render: (r) => (
        <div>
          <p className="font-medium text-white">{r.title}</p>
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
      render: (r) => {
        const toneMap: Record<string, "success" | "warning" | "danger" | "neutral"> = {
          PUBLISHED: "success",
          DRAFT: "neutral",
          EXPIRED: "danger",
          SUSPENDED: "danger",
        };
        return <Badge tone={toneMap[r.status] || "neutral"}>{r.status}</Badge>;
      },
    },
    {
      key: "locale",
      header: "اللغة",
      render: (r) => (r.locale === "ar" ? "العربية" : r.locale),
    },
    {
      key: "createdAt",
      header: "تاريخ الإنشاء",
      render: (r) => r.createdAt.toLocaleDateString("ar-EG"),
    },
  ];

  return (
    <CenterPageShell
      badge="إدارة المواقع"
      title="المواقع"
      description="جميع مواقع المصورين على المنصة."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "المواقع" }]}
    >
      <DataTable
        columns={columns}
        data={sites.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          status: s.status,
          locale: s.locale,
          isPublished: s.isPublished,
          createdAt: s.createdAt,
          tenantName: s.tenant.displayName,
          themeName: s.theme.name,
        }))}
        keyField="id"
        pageSize={20}
      />
    </CenterPageShell>
  );
}
