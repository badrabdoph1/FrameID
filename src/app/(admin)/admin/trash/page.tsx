import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminTrashPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  // Test database query
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
    <div style={{ padding: "2rem", color: "white", backgroundColor: "#1a1a1a" }}>
      <h1>Trash Test Page - Step 3</h1>
      <p>✅ prisma import OK</p>
      <p>✅ getCurrentAdmin import OK</p>
      <p>✅ Database query OK</p>
      <p>Logged in as: {admin.name}</p>
      <p>Total deleted tenants: {total}</p>
      <pre style={{ fontSize: "12px", marginTop: "1rem" }}>
        {JSON.stringify(tenants.map(t => ({ id: t.id, name: t.displayName, owner: t.owner.name })), null, 2)}
      </pre>
    </div>
  );
}
