import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  await requireSuperAdminSession();
  const [users, tenants, sites, backupJobs] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.site.count({ where: { deletedAt: null } }),
    prisma.backupJob.count()
  ]);

  const metrics = [
    ["Users", users],
    ["Tenants", tenants],
    ["Sites", sites],
    ["Backup Jobs", backupJobs]
  ] as const;

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="luxury">System Health</Badge>
        <h1 className="mt-4 text-3xl font-semibold">صحة النظام</h1>
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <Card key={label} className="border-white/10 bg-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-sm text-white/60">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
