import Link from "next/link";
import { ArrowLeft, Bell, ClipboardList, DatabaseBackup, Flag, Mail, ServerCog, Settings, ShieldCheck, TriangleAlert, UsersRound, Activity, type LucideIcon } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export default async function AdminSystemWorkspacePage() {
  await requireAdminPermission("settings", "view");

  const [
    unresolvedErrors,
    fatalErrors,
    unreadNotifications,
    recentErrors,
    recentNotifications,
    latestBackups,
    failedBackups,
    auditCount,
    featureFlags,
  ] = await Promise.all([
    prisma.errorLog.count({ where: { resolved: false } }),
    prisma.errorLog.count({ where: { resolved: false, level: { in: ["ERROR", "FATAL"] } } }),
    prisma.notificationLog.count({ where: { readAt: null, deletedAt: null } }),
    prisma.errorLog.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, code: true, message: true, level: true, category: true, route: true, createdAt: true },
    }),
    prisma.notificationLog.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, type: true, title: true, body: true, category: true, createdAt: true, readAt: true },
    }),
    prisma.backupJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, status: true, trigger: true, sizeBytes: true, createdAt: true, completedAt: true },
    }),
    prisma.backupJob.count({ where: { status: { in: ["FAILED", "VERIFICATION_FAILED", "UPLOAD_FAILED"] } } }),
    prisma.auditLog.count(),
    prisma.featureFlag.count(),
  ]);

  const latestBackup = latestBackups[0] ?? null;

  return (
    <AdminPageShell
      badge="النظام"
      title="System Workspace"
      description="مكان واحد لصحة المنصة: الأخطاء، الإشعارات، النسخ الاحتياطي، السجلات، والإعدادات. الأدوات المتقدمة محفوظة هنا بدون تشويش الواجهة اليومية."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "النظام" }]}
      actions={[
        { label: "مركز الأخطاء", href: "/admin/errors", icon: TriangleAlert },
        { label: "النسخ الاحتياطي", href: "/admin/backups", icon: DatabaseBackup },
      ]}
    >
      <div className="grid gap-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="أخطاء مفتوحة" value={unresolvedErrors} icon={TriangleAlert} tone={unresolvedErrors > 0 ? "danger" : "success"} href="/admin/errors" />
          <MetricCard label="حرجة" value={fatalErrors} icon={Activity} tone={fatalErrors > 0 ? "danger" : "neutral"} href="/admin/errors" />
          <MetricCard label="إشعارات جديدة" value={unreadNotifications} icon={Bell} tone={unreadNotifications > 0 ? "warning" : "success"} href="/admin/notifications" />
          <MetricCard label="نسخ فاشلة" value={failedBackups} icon={DatabaseBackup} tone={failedBackups > 0 ? "danger" : "success"} href="/admin/backups" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <WorkspacePanel title="أخطاء تحتاج انتباه" description="الأخطاء غير المحلولة مرتبة من الأحدث." href="/admin/errors" cta="فتح Error Center">
            <div className="grid gap-2">
              {recentErrors.length === 0 ? <EmptyState text="لا توجد أخطاء غير محلولة." /> : recentErrors.map((error) => (
                <Link key={error.id} href="/admin/errors" className="rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-red-300/24 hover:bg-red-300/8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={error.level === "FATAL" || error.level === "ERROR" ? "rounded-full bg-red-300/10 px-2 py-0.5 text-[0.68rem] font-black text-red-300" : "rounded-full bg-amber-300/10 px-2 py-0.5 text-[0.68rem] font-black text-amber-300"}>{error.level}</span>
                    <strong className="text-xs font-black text-[#f3cf73]">{error.code}</strong>
                    <span className="text-xs font-bold text-white/35">{formatDate(error.createdAt)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-[#fff7e8]">{error.message}</p>
                  <p className="mt-1 truncate text-xs font-bold text-white/38">{error.category}{error.route ? ` · ${error.route}` : ""}</p>
                </Link>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel title="النسخ الاحتياطي" description="آخر عمليات النسخ وحالة الاسترجاع المستقبلية." href="/admin/backups" cta="إدارة النسخ">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/8 bg-black/18 p-4">
                <p className="text-xs font-black text-white/38">آخر نسخة</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <strong className="text-lg font-black text-[#fff7e8]">{latestBackup ? latestBackup.type : "لا توجد"}</strong>
                  {latestBackup ? <StatusBadge status={latestBackup.status} /> : null}
                </div>
                <p className="mt-2 text-xs font-bold text-white/45">{latestBackup ? `${formatDate(latestBackup.completedAt ?? latestBackup.createdAt)} · ${formatBytes(latestBackup.sizeBytes)} · ${latestBackup.trigger}` : "لم يتم تسجيل عمليات نسخ بعد."}</p>
              </div>
              <div className="grid gap-2">
                {latestBackups.slice(0, 4).map((job) => (
                  <Link key={job.id} href="/admin/backups" className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/24 hover:bg-amber-300/8">
                    <span>
                      <strong className="block text-sm font-black text-[#fff7e8]">{job.type}</strong>
                      <small className="mt-1 block text-xs font-bold text-white/38">{formatDate(job.createdAt)}</small>
                    </span>
                    <StatusBadge status={job.status} />
                  </Link>
                ))}
              </div>
            </div>
          </WorkspacePanel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <WorkspacePanel title="آخر الإشعارات" description="سجل موحد لما يظهر للمستخدمين داخل المنصة." href="/admin/notifications" cta="Notification Center">
            <div className="grid gap-2">
              {recentNotifications.length === 0 ? <EmptyState text="لا توجد إشعارات مسجلة." /> : recentNotifications.map((item) => (
                <Link key={item.id} href="/admin/notifications" className="rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/24 hover:bg-amber-300/8">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-black text-[#fff7e8]">{item.title}</strong>
                      <small className="mt-1 block text-xs font-bold text-white/38">{item.category ?? item.type} · {formatDate(item.createdAt)}</small>
                    </span>
                    <StatusBadge status={item.readAt ? "READ" : "NEW"} />
                  </div>
                  {item.body ? <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-white/48">{item.body}</p> : null}
                </Link>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel title="أدوات متقدمة" description="أنظمة داخلية موجودة لكنها ليست للاستخدام اليومي." href="/admin/settings" cta="الإعدادات">
            <div className="grid gap-2 sm:grid-cols-2">
              <AdvancedLink href="/admin/audit" icon={ClipboardList} label="Audit Logs" value={`${auditCount.toLocaleString("ar-EG")} سجل`} />
              <AdvancedLink href="/admin/feature-flags" icon={Flag} label="Feature Flags" value={`${featureFlags.toLocaleString("ar-EG")} Flag`} />
              <AdvancedLink href="/admin/email" icon={Mail} label="Email Center" value="متقدم" />
              <AdvancedLink href="/admin/security" icon={ShieldCheck} label="Security" value="متقدم" />
              <AdvancedLink href="/admin/admin-users" icon={UsersRound} label="Admin Users" value="صلاحيات" />
              <AdvancedLink href="/admin/jobs" icon={ServerCog} label="Jobs Queue" value="تشغيل" />
              <AdvancedLink href="/admin/support" icon={ShieldCheck} label="Support" value="دعم" />
              <AdvancedLink href="/admin/settings" icon={Settings} label="Platform Settings" value="إعدادات" />
            </div>
          </WorkspacePanel>
        </section>
      </div>
    </AdminPageShell>
  );
}

function MetricCard({ label, value, icon: Icon, tone, href }: { label: string; value: number | string; icon: LucideIcon; tone: "success" | "warning" | "danger" | "neutral"; href: string }) {
  const toneClass = tone === "success" ? "text-emerald-300" : tone === "warning" ? "text-amber-300" : tone === "danger" ? "text-red-300" : "text-[#fff7e8]";
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/24 hover:bg-amber-300/8">
      <Icon className={`size-5 ${toneClass}`} />
      <p className="mt-3 text-xs font-black text-white/42">{label}</p>
      <p className={`mt-1 truncate text-2xl font-black ${toneClass}`}>{typeof value === "number" ? value.toLocaleString("ar-EG") : value}</p>
    </Link>
  );
}

function WorkspacePanel({ title, description, href, cta, children }: { title: string; description: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <header className="flex items-start justify-between gap-3 border-b border-white/8 p-4">
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
          <p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p>
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/62 no-underline transition hover:bg-white/[0.08] hover:text-white">
          {cta}
          <ArrowLeft className="size-3.5" />
        </Link>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = ["COMPLETED", "READ"].includes(status) ? "bg-emerald-300/10 text-emerald-300" : ["FAILED", "VERIFICATION_FAILED", "UPLOAD_FAILED"].includes(status) ? "bg-red-300/10 text-red-300" : status === "NEW" ? "bg-amber-300/10 text-amber-300" : "bg-white/8 text-white/45";
  return <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black ${cls}`}>{status}</span>;
}

function AdvancedLink({ href, icon: Icon, label, value }: { href: string; icon: LucideIcon; label: string; value: string }) {
  return (
    <Link href={href} className="grid gap-2 rounded-2xl border border-white/8 bg-white/[0.035] p-3 no-underline transition hover:border-amber-300/24 hover:bg-amber-300/8">
      <Icon className="size-5 text-[#f3cf73]" />
      <strong className="text-sm font-black text-[#fff7e8]">{label}</strong>
      <small className="text-xs font-bold text-white/38">{value}</small>
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/12 bg-black/15 p-6 text-center text-sm font-bold text-white/40">{text}</div>;
}
