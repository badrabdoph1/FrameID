import Link from "next/link";
import { AlertTriangle, Clock3, CreditCard, DatabaseBackup, RefreshCcw, Search } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminCenter } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

type JobRow = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  status: string;
  href: string;
  createdAt: Date;
  priority: "critical" | "high" | "normal";
};

function dateLabel(value: Date): string {
  return value.toLocaleString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: string): string {
  if (["FAILED", "VERIFICATION_FAILED", "UPLOAD_FAILED", "REJECTED", "critical", "fatal"].includes(status)) return "border-red-500/25 bg-red-500/10 text-red-300";
  if (["RUNNING", "UNDER_REVIEW", "PENDING"].includes(status)) return "border-amber-500/25 bg-amber-500/10 text-amber-200";
  if (["COMPLETED", "APPROVED"].includes(status)) return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  return "border-white/10 bg-white/5 text-white/42";
}

export default async function AdminJobsPage() {
  await requireAdminCenter("dashboard");

  const [backupJobs, restoreJobs, paymentJobs, errorJobs] = await Promise.all([
    prisma.backupJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, type: true, status: true, createdAt: true },
    }),
    prisma.restoreJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, status: true, errorMessage: true, createdAt: true },
    }),
    prisma.paymentRequest.findMany({
      where: { deletedAt: null, status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] } } as never,
      orderBy: { createdAt: "asc" },
      take: 30,
      select: { id: true, status: true, amount: true, currency: true, method: true, createdAt: true, tenant: { select: { displayName: true } } },
    }),
    prisma.errorLog.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, code: true, message: true, level: true, category: true, createdAt: true },
    }),
  ]);

  const jobs: JobRow[] = [
    ...backupJobs.map((job) => ({
      id: `backup-${job.id}`,
      type: "نسخ احتياطي",
      title: `نسخة ${job.type}`,
      subtitle: "عملية نسخ احتياطي",
      status: job.status,
      href: "/admin/backups",
      createdAt: job.createdAt,
      priority: ["FAILED", "VERIFICATION_FAILED", "UPLOAD_FAILED"].includes(job.status) ? "critical" as const : "normal" as const,
    })),
    ...restoreJobs.map((job) => ({
      id: `restore-${job.id}`,
      type: "استعادة",
      title: "استعادة قاعدة البيانات",
      subtitle: job.errorMessage ?? "عملية استعادة",
      status: job.status,
      href: "/admin/backups",
      createdAt: job.createdAt,
      priority: job.status.includes("FAILED") ? "critical" as const : "high" as const,
    })),
    ...paymentJobs.map((job) => ({
      id: `payment-${job.id}`,
      type: "مراجعة دفع",
      title: `${job.amount.toLocaleString("ar-EG")} ${job.currency}`,
      subtitle: `${job.tenant.displayName} · ${job.method}`,
      status: job.status,
      href: "/admin/payments",
      createdAt: job.createdAt,
      priority: "high" as const,
    })),
    ...errorJobs.map((job) => ({
      id: `error-${job.id}`,
      type: "حل خطأ",
      title: job.code ?? "خطأ غير معروف",
      subtitle: job.message,
      status: job.level,
      href: `/admin/errors?search=${encodeURIComponent(job.code ?? "")}`,
      createdAt: job.createdAt,
      priority: ["critical", "fatal", "error"].includes(job.level) ? "critical" as const : "normal" as const,
    })),
  ].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, normal: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority] || b.createdAt.getTime() - a.createdAt.getTime();
  });

  const critical = jobs.filter((job) => job.priority === "critical").length;
  const high = jobs.filter((job) => job.priority === "high").length;

  return (
    <AdminPageShell
      badge="التشغيل"
      title="طابور المهام"
      description="طابور موحد للمهام التشغيلية التي تحتاج متابعة: نسخ احتياطي، استعادة، مدفوعات، وأخطاء."
      breadcrumbs={[{ label: "التشغيل", href: "/admin/operations" }, { label: "طابور المهام" }]}
      actions={[{ label: "مركز العمليات", href: "/admin/operations", icon: RefreshCcw }, { label: "البحث", href: "/admin/search", icon: Search }]}
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="كل المهام" value={jobs.length} />
        <Metric label="حرجة" value={critical} danger />
        <Metric label="عالية الأولوية" value={high} accent />
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="hidden grid-cols-[0.8fr_1.2fr_1fr_0.8fr_0.8fr] gap-3 border-b border-white/8 bg-black/18 px-4 py-3 text-xs font-black text-white/38 lg:grid">
          <span>النوع</span><span>المهمة</span><span>السياق</span><span>الحالة</span><span>الوقت</span>
        </div>
        <div className="grid divide-y divide-white/6">
          {jobs.length === 0 ? <p className="px-4 py-12 text-center text-sm font-bold text-white/35">لا توجد مهام تشغيلية الآن.</p> : jobs.map((job) => (
            <Link key={job.id} href={job.href} className="grid gap-2 px-4 py-3 no-underline transition hover:bg-amber-500/[0.06] lg:grid-cols-[0.8fr_1.2fr_1fr_0.8fr_0.8fr] lg:items-center">
              <span className="inline-flex items-center gap-2 text-xs font-black text-white/45">
                {job.type === "نسخ احتياطي" ? <DatabaseBackup className="size-4 text-amber-300" /> : job.type === "مراجعة دفع" ? <CreditCard className="size-4 text-amber-300" /> : job.type === "حل خطأ" ? <AlertTriangle className="size-4 text-red-300" /> : <Clock3 className="size-4 text-amber-300" />}
                {job.type}
              </span>
              <strong className="truncate text-sm font-black text-white/82">{job.title}</strong>
              <span className="truncate text-xs font-bold text-white/42">{job.subtitle}</span>
              <span className={`w-fit rounded-full border px-2 py-0.5 text-[0.68rem] font-black ${statusClass(job.status)}`}>{job.status}</span>
              <span className="text-xs font-bold text-white/32">{dateLabel(job.createdAt)}</span>
            </Link>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}

function Metric({ label, value, accent, danger }: { label: string; value: number; accent?: boolean; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className={danger ? "text-2xl font-black text-red-300" : accent ? "text-2xl font-black text-amber-200" : "text-2xl font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </div>
  );
}
