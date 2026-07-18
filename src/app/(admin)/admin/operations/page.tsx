import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  CreditCard,
  DatabaseBackup,
  Flag,
  HeartPulse,
  Headphones,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminCenter } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

function dateLabel(value: Date | null | undefined): string {
  if (!value) return "—";
  return value.toLocaleString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysUntil(value: Date | null | undefined): string {
  if (!value) return "—";
  const diff = value.getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return `متأخر ${Math.abs(days)} يوم`;
  if (days === 0) return "اليوم";
  return `بعد ${days} يوم`;
}

export default async function AdminOperationsPage() {
  await requireAdminCenter("dashboard");

  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 86_400_000);

  const [
    pendingPayments,
    expiringTrials,
    failedBackups,
    failedRestores,
    unresolvedErrors,
    openSupport,
    riskyAudit,
    enabledFlags,
  ] = await Promise.all([
    prisma.paymentRequest.findMany({
      where: { deletedAt: null, status: { in: ["SUBMITTED", "PENDING", "UNDER_REVIEW"] } } as never,
      orderBy: { createdAt: "asc" },
      take: 8,
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        createdAt: true,
        tenant: { select: { id: true, displayName: true, owner: { select: { email: true } } } },
      },
    }),
    prisma.tenant.findMany({
      where: { deletedAt: null, status: "TRIAL", trialEndsAt: { lte: inSevenDays } } as never,
      orderBy: { trialEndsAt: "asc" },
      take: 8,
      select: { id: true, displayName: true, trialEndsAt: true, owner: { select: { email: true } } },
    }),
    prisma.backupJob.findMany({
      where: { status: { in: ["FAILED", "VERIFICATION_FAILED", "UPLOAD_FAILED"] } } as never,
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, type: true, status: true, createdAt: true, completedAt: true, metadata: true },
    }),
    prisma.restoreJob.findMany({
      where: { status: { in: ["FAILED", "VERIFICATION_FAILED", "UPLOAD_FAILED"] } } as never,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, errorMessage: true, createdAt: true },
    }),
    prisma.errorLog.findMany({
      where: { resolved: false, level: { in: ["error", "critical", "fatal"] } } as never,
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, code: true, message: true, level: true, category: true, route: true, createdAt: true },
    }),
    prisma.supportCase.findMany({
      where: { status: { in: ["OPEN", "PENDING_CUSTOMER"] } } as never,
      orderBy: { createdAt: "asc" },
      take: 8,
      select: { id: true, subject: true, status: true, createdAt: true, tenant: { select: { id: true, displayName: true } } },
    }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "PAYMENT_APPROVED",
            "PAYMENT_REJECTED",
            "CUSTOMER_DELETED",
            "CUSTOMER_PASSWORD_RESET",
            "SITE_SUSPENDED",
            "BACKUP_RESTORED",
            "FEATURE_FLAG_DELETED",
            "FEATURE_FLAG_ENABLED",
          ],
        },
      } as never,
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, actorId: true, tenant: { select: { id: true, displayName: true } } },
    }),
    prisma.featureFlag.findMany({
      where: { enabled: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, key: true, scope: true, updatedAt: true, tenant: { select: { id: true, displayName: true } }, site: { select: { id: true, title: true, slug: true } } },
    }),
  ]);

  const queueCards = [
    { title: "مدفوعات تحتاج مراجعة", value: pendingPayments.length, href: "/admin/payments", icon: CreditCard },
    { title: "فترات تجريبية تنتهي قريبًا", value: expiringTrials.length, href: "/admin/customers?status=TRIAL", icon: Clock3 },
    { title: "نسخ أو استعادة فاشلة", value: failedBackups.length + failedRestores.length, href: "/admin/backups", icon: DatabaseBackup },
    { title: "أخطاء مفتوحة حرجة", value: unresolvedErrors.length, href: "/admin/errors", icon: AlertTriangle },
    { title: "تذاكر دعم مفتوحة", value: openSupport.length, href: "/admin/support", icon: Headphones },
    { title: "مفاتيح خصائص مفعلة", value: enabledFlags.length, href: "/admin/feature-flags", icon: Flag },
  ];

  return (
    <AdminPageShell
      badge="التشغيل"
      title="مركز العمليات"
      description="متابعة يومية لأهم الطوابير: المدفوعات، التجارب، الأخطاء، النسخ، الدعم، ومفاتيح الخصائص."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "العمليات" }]}
      actions={[{ label: "سجل التدقيق", href: "/admin/audit", icon: ShieldCheck }, { label: "صحة النظام", href: "/admin/health", icon: HeartPulse }]}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {queueCards.map((card) => (
          <Link key={card.title} href={card.href} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 no-underline transition hover:-translate-y-0.5 hover:border-amber-500/25 hover:bg-amber-500/[0.055]">
            <div className="flex items-center justify-between gap-3">
              <card.icon className="size-5 text-amber-300" />
              <ArrowLeft className="size-4 text-white/22 transition group-hover:text-amber-200" />
            </div>
            <p className="mt-4 text-3xl font-black text-[#fff7e8]">{card.value.toLocaleString("ar-EG")}</p>
            <p className="mt-1 text-xs font-black text-white/42">{card.title}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <QueuePanel title="مراجعة المدفوعات" icon={CreditCard} href="/admin/payments">
          {pendingPayments.map((payment) => (
            <QueueItem key={payment.id} href="/admin/payments" title={`${payment.amount.toLocaleString("ar-EG")} ${payment.currency}`} subtitle={`${payment.tenant.displayName} · ${payment.tenant.owner.email}`} meta={`${payment.method} · ${payment.status} · ${dateLabel(payment.createdAt)}`} />
          ))}
        </QueuePanel>

        <QueuePanel title="فترات تجريبية تنتهي قريبًا" icon={Clock3} href="/admin/customers?status=TRIAL">
          {expiringTrials.map((tenant) => (
            <QueueItem key={tenant.id} href={`/admin/customers/${tenant.id}`} title={tenant.displayName} subtitle={tenant.owner.email} meta={daysUntil(tenant.trialEndsAt)} />
          ))}
        </QueuePanel>

        <QueuePanel title="أخطاء حرجة" icon={AlertTriangle} href="/admin/errors">
          {unresolvedErrors.map((error) => (
             <QueueItem key={error.id} href={`/admin/errors?search=${encodeURIComponent(error.code ?? "")}`} title={error.code ?? "بدون كود"} subtitle={error.message} meta={`${error.level} · ${error.category} · ${dateLabel(error.createdAt)}`} />
          ))}
        </QueuePanel>

        <QueuePanel title="الدعم المفتوح" icon={Headphones} href="/admin/support">
          {openSupport.map((ticket) => (
             <QueueItem key={ticket.id} href="/admin/support" title={ticket.subject} subtitle={ticket.tenant.displayName} meta={`${ticket.status} · ${dateLabel(ticket.createdAt)}`} />
          ))}
        </QueuePanel>

        <QueuePanel title="Backup / Restore failures" icon={DatabaseBackup} href="/admin/backups">
          {[...failedBackups.map((backup) => ({ id: backup.id, title: `${backup.type} backup`, subtitle: `${backup.metadata && typeof backup.metadata === 'object' && 'trigger' in (backup.metadata as Record<string, unknown>) ? (backup.metadata as Record<string, unknown>).trigger : "unknown"}`, meta: `${backup.status} · ${dateLabel(backup.createdAt)}` })), ...failedRestores.map((restore) => ({ id: restore.id, title: `restore`, subtitle: restore.errorMessage ?? "Restore failed", meta: `${restore.status} · ${dateLabel(restore.createdAt)}` }))].map((item) => (
            <QueueItem key={item.id} href="/admin/backups" title={item.title} subtitle={item.subtitle} meta={item.meta} />
          ))}
        </QueuePanel>

        <QueuePanel title="آخر العمليات الحساسة" icon={Sparkles} href="/admin/audit">
          {riskyAudit.map((log) => (
            <QueueItem key={log.id} href={`/admin/audit?q=${encodeURIComponent(log.action)}`} title={log.action} subtitle={log.tenant?.displayName ?? log.entityType} meta={`${log.actorId ?? "system"} · ${dateLabel(log.createdAt)}`} />
          ))}
        </QueuePanel>
      </section>
    </AdminPageShell>
  );
}

function QueuePanel({ title, icon: Icon, href, children }: { title: string; icon: typeof CreditCard; href: string; children: ReactNode }) {
  const isEmpty = Array.isArray(children) && children.length === 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <header className="flex items-center gap-3 border-b border-white/8 bg-black/16 px-4 py-3">
        <Icon className="size-4 text-amber-300" />
        <h2 className="text-sm font-black text-[#fff7e8]">{title}</h2>
        <Link href={href} className="mr-auto text-xs font-black text-amber-300/80 no-underline hover:text-amber-200">فتح</Link>
      </header>
      <div className="grid divide-y divide-white/6">
        {isEmpty ? <p className="px-4 py-8 text-center text-sm font-bold text-white/35">لا توجد عناصر عاجلة.</p> : children}
      </div>
    </section>
  );
}

function QueueItem({ href, title, subtitle, meta }: { href: string; title: string; subtitle: string; meta: string }) {
  return (
    <Link href={href} className="grid gap-1 px-4 py-3 no-underline transition hover:bg-amber-500/[0.06]">
      <strong className="truncate text-sm font-black text-white/82">{title}</strong>
      <span className="truncate text-xs font-bold text-white/42">{subtitle}</span>
      <span className="text-[0.68rem] font-black text-white/30">{meta}</span>
    </Link>
  );
}
