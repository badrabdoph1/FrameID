import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminTrashPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const where = { deletedAt: { not: null } };
  
  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { deletedAt: "desc" },
      take: 25,
      select: {
        id: true,
        displayName: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: { sites: true, payments: true, mediaAssets: true },
        },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  return (
    <AdminPageShell
      badge="سلة المحذوفات"
      title="سلة المحذوفات"
      description={`${total.toLocaleString("ar-EG")} عميل في سلة المحذوفات`}
    >
      <div style={{ padding: "1rem", color: "white" }}>
        <p>✅ AdminPageShell import OK</p>
        <p>Total deleted tenants: {total}</p>
        <ul style={{ listStyle: "disc", marginTop: "1rem" }}>
          {tenants.map(t => (
            <li key={t.id}>{t.displayName} - {t.owner.name}</li>
          ))}
        </ul>
      </div>
    </AdminPageShell>
  );
}
