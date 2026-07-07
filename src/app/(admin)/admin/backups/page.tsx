import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { runBackupAction } from "@/app/(admin)/admin/backups/actions";
import { createPrismaAdminBackupCenterRepository } from "@/modules/admin/prisma-admin-backup-center-repository";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ started?: string; error?: string }>;
};

export default async function AdminBackupsPage({ searchParams }: Props) {
  await requireSuperAdminSession();
  const { started, error } = await searchParams;
  const repository = createPrismaAdminBackupCenterRepository(prisma);
  const backupCenter = await repository.getBackupCenter();

  return (
    <CenterPageShell
      badge="مركز النسخ الاحتياطي"
      title="النسخ الاحتياطي"
      description="إدارة النسخ الاحتياطي والتحقق منها."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "النسخ" }]}
    >
      {started && (
        <p className="rounded-[var(--radius-panel)] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          تم إنشاء نسخة احتياطية والتحقق منها.
        </p>
      )}

      {error && (
        <p className="rounded-[var(--radius-panel)] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          تعذر تشغيل النسخ الاحتياطي.
        </p>
      )}

      <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
        <h3 className="mb-4 text-sm font-medium text-white/60">إنشاء نسخة الآن</h3>
        <div className="flex flex-wrap gap-3">
          {(["DATABASE", "UPLOADS", "FULL"] as const).map((type) => (
            <form key={type} action={runBackupAction}>
              <input type="hidden" name="type" value={type} />
              <Button type="submit" variant="luxury" size="sm">
                {formatBackupType(type)}
              </Button>
            </form>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">الإعدادات</h3>
          <div className="space-y-3">
            {backupCenter.settings.map((setting) => (
              <div
                key={setting.type}
                className="flex items-center justify-between rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {setting.type}
                  </p>
                  <p className="text-xs text-white/50">
                    {setting.schedule} · الاحتفاظ بآخر {setting.retentionCount}
                  </p>
                </div>
                <Badge tone={setting.enabled ? "success" : "neutral"}>
                  {setting.enabled ? "مفعل" : "متوقف"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">السجل</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {backupCenter.jobs.length > 0 ? (
              backupCenter.jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">
                      {formatBackupJobType(job.type)}
                    </p>
                    <Badge
                      tone={
                        job.status === "COMPLETED"
                          ? "success"
                          : job.status === "FAILED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {formatBackupStatus(job.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-white/50">
                    <p>{job.createdAt}</p>
                    {job.sizeBytes && <p>الحجم: {formatBytes(job.sizeBytes)}</p>}
                    {job.checksumSha256 && (
                      <p className="font-mono" dir="ltr">
                        sha256:{job.checksumSha256.slice(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/40">
                لا توجد نسخ بعد.
              </p>
            )}
          </div>
        </div>
      </div>
    </CenterPageShell>
  );
}

function formatBackupType(type: "DATABASE" | "UPLOADS" | "FULL"): string {
  switch (type) {
    case "DATABASE":
      return "قاعدة البيانات";
    case "UPLOADS":
      return "الملفات المرفوعة";
    case "FULL":
      return "نسخة كاملة";
  }
}

function formatBackupJobType(type: string): string {
  if (type === "DATABASE" || type === "UPLOADS" || type === "FULL") {
    return type === "DATABASE"
      ? "قاعدة البيانات"
      : type === "UPLOADS"
        ? "الملفات المرفوعة"
        : "نسخة كاملة";
  }
  return type;
}

function formatBackupStatus(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "مكتملة";
    case "RUNNING":
      return "قيد التشغيل";
    case "FAILED":
      return "فشلت";
    case "PENDING":
      return "معلقة";
    default:
      return status;
  }
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
