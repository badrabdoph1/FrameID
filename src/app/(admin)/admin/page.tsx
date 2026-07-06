import { AdminCenterLinks } from "@/components/admin/admin-center-links";
import { prisma } from "@/lib/prisma";
import { createAdminOverviewViewModel } from "@/modules/admin/admin-overview-view-model";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createPrismaAdminOverviewRepository } from "@/modules/admin/prisma-admin-overview-repository";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireSuperAdminSession();

  const repository = createPrismaAdminOverviewRepository(prisma);
  const metrics = await repository.getMetrics(new Date());
  const overview = createAdminOverviewViewModel(metrics);

  return (
    <main>
      <section>
        <Badge tone="luxury">لوحة الإدارة العليا</Badge>
        <h1 className="mt-5 text-4xl font-semibold">مركز التحكم</h1>
        <p className="mt-3 max-w-2xl text-white/70">
          إدارة العملاء والمواقع والمدفوعات والأمان والنسخ الاحتياطي من مركز
          قيادة واحد.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {overview.widgets.map((widget) => (
            <Card key={widget.label} className="border-white/10 bg-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-sm text-white/60">
                  {widget.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <span className="text-3xl font-semibold">{widget.value}</span>
                <Badge tone={widget.tone}>مباشر</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <AdminCenterLinks />
        </div>
      </section>
    </main>
  );
}
