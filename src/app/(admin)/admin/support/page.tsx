import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  await requireSuperAdminSession();
  const cases = await prisma.supportCase.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      createdAt: true,
      tenant: { select: { displayName: true } }
    }
  });

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="luxury">Support Center</Badge>
        <h1 className="mt-4 text-3xl font-semibold">الدعم</h1>
      </section>
      <div className="grid gap-3">
        {cases.map((supportCase) => (
          <Card key={supportCase.id} className="border-white/10 bg-white/10 text-white">
            <CardHeader>
              <CardTitle>{supportCase.subject}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-white/65">
              {supportCase.tenant.displayName} · {supportCase.status} · {supportCase.priority} · {supportCase.createdAt.toISOString()}
            </CardContent>
          </Card>
        ))}
        {!cases.length ? (
          <Card className="border-white/10 bg-white/10 text-white">
            <CardContent className="py-10 text-center text-white/60">
              لا توجد تذاكر دعم مفتوحة.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
