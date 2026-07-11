import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { SitesTable, type SiteRow } from "@/app/(admin)/admin/sites/sites-table";

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

  const data: SiteRow[] = sites.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    status: s.status,
    isPublished: s.isPublished,
    createdAt: s.createdAt.toISOString(),
    tenantName: s.tenant.displayName,
    themeName: s.theme.name,
  }));

  return (
    <AdminPageShell
      badge="الإدارة"
      title="المواقع"
      description="جميع مواقع المصورين على المنصة"
    >
      <SitesTable data={data} />
    </AdminPageShell>
  );
}
