import { runBackupAction } from "@/app/(admin)/admin/backups/actions";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createPrismaAdminBackupCenterRepository } from "@/modules/admin/prisma-admin-backup-center-repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BackupsPageProps = {
  searchParams: Promise<{
    started?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminBackupsPage({ searchParams }: BackupsPageProps) {
  await requireSuperAdminSession();
  const { started, error } = await searchParams;

  const repository = createPrismaAdminBackupCenterRepository(prisma);
  const backupCenter = await repository.getBackupCenter();

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="luxury">Backup Center</Badge>
        <h1 className="mt-4 text-3xl font-semibold">النسخ الاحتياطي</h1>
        <p className="mt-2 text-white/65">
          إدارة النسخ والتحقق منها كسجل تشغيلي واضح.
        </p>
      </section>

      {started ? (
        <p className="rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          تم إنشاء نسخة احتياطية والتحقق منها.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-panel)] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          تعذر تشغيل النسخ الاحتياطي.
        </p>
      ) : null}

      <Card className="border-white/10 bg-white/10 text-white">
        <CardHeader>
          <CardTitle>Backup Now</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {(["DATABASE", "UPLOADS", "FULL"] as const).map((type) => (
            <form key={type} action={runBackupAction}>
              <input type="hidden" name="type" value={type} />
              <Button type="submit" variant="luxury" className="w-full">
                {type}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/10 text-white">
          <CardHeader>
            <CardTitle>الإعدادات</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {backupCenter.settings.map((setting) => (
              <div key={setting.type} className="rounded-[var(--radius-panel)] border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <strong>{setting.type}</strong>
                  <Badge tone={setting.enabled ? "success" : "neutral"}>
                    {setting.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-white/60">
                  {setting.schedule} · retention {setting.retentionCount}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/10 text-white">
          <CardHeader>
            <CardTitle>السجل الأخير</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {backupCenter.jobs.length ? (
              backupCenter.jobs.map((job) => (
                <div key={job.id} className="rounded-[var(--radius-panel)] border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <strong>{job.type}</strong>
                    <Badge tone={job.status === "COMPLETED" ? "success" : "warning"}>
                      {job.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-white/60">{job.createdAt}</p>
                  {job.sizeBytes ? (
                    <p className="mt-1 text-sm text-white/60">
                      الحجم: {formatBytes(job.sizeBytes)}
                    </p>
                  ) : null}
                  {job.checksumSha256 ? (
                    <p className="mt-1 break-all text-xs text-white/45" dir="ltr">
                      sha256: {job.checksumSha256.slice(0, 16)}...
                    </p>
                  ) : null}
                  {job.localPath ? (
                    <p className="mt-1 break-all text-xs text-white/45" dir="ltr">
                      {job.localPath}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-white/60">
                لا توجد نسخ بعد.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
