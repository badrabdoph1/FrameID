import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  await requireSuperAdminSession();
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      actor: { select: { email: true } }
    }
  });

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="luxury">Security Center</Badge>
        <h1 className="mt-4 text-3xl font-semibold">الأمان وسجل العمليات</h1>
      </section>
      <div className="grid gap-3">
        {auditLogs.map((log) => (
          <Card key={log.id} className="border-white/10 bg-white/10 text-white">
            <CardHeader>
              <CardTitle>{log.action}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-white/65">
              {log.entityType} · {log.entityId ?? "unknown"} · {log.actor?.email ?? "system"} · {log.createdAt.toISOString()}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
