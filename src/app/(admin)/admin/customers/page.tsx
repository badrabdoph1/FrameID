import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireSuperAdminSession();
  const customers = await prisma.tenant.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      displayName: true,
      status: true,
      trialEndsAt: true,
      owner: { select: { email: true } },
      sites: { take: 1, select: { slug: true, status: true } }
    }
  });

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="luxury">Customers</Badge>
        <h1 className="mt-4 text-3xl font-semibold">إدارة العملاء</h1>
      </section>
      <div className="grid gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="border-white/10 bg-white/10 text-white">
            <CardHeader>
              <CardTitle>{customer.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-white/65">
              <span>{customer.owner.email}</span>
              <span>{customer.status}</span>
              <span dir="ltr">{customer.sites[0]?.slug ?? "لا يوجد موقع"}</span>
              <span>{customer.trialEndsAt.toISOString()}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
