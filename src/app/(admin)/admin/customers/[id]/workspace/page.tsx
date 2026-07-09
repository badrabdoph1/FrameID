import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  Bell,
  CreditCard,
  Flag,
  Globe,
  Image,
  NotebookText,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function dateLabel(value: Date | null | undefined): string {
  if (!value) return "—";
  return value.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(amount: number, currency: string): string {
  return `${amount.toLocaleString("ar-EG")} ${currency}`;
}

function daysLeft(value: Date | null | undefined): string {
  if (!value) return "—";
  const diff = value.getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`;
  if (days === 0) return "ينتهي اليوم";
  return `${days} يوم متبقي`;
}

function mediaAssetTitle(storageKey: string): string {
  return storageKey.split("/").pop() ?? storageKey;
}

export default async function AdminCustomer360Page({ params }: Props) {
  await requireAdminPermission("customers", "view");
  const { id } = await params;

  const customer = await prisma.tenant.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true, emailVerifiedAt: true } },
      sites: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, slug: true, status: true, isPublished: true, publishedVersion: true, createdAt: true, theme: { select: { name: true, code: true } } },
      },
      subscriptions: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { plan: { select: { id: true, code: true, name: true, priceAmount: true, currency: true, billingInterval: true } } },
      },
      payments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, amount: true, currency: true, method: true, status: true, reference: true, createdAt: true, submittedAt: true, reviewedAt: true },
      },
      supportCases: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, subject: true, status: true, priority: true, createdAt: true, updatedAt: true },
      },
      adminNotes: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { author: { select: { name: true, email: true } } },
      },
      featureFlags: { orderBy: { updatedAt: "desc" }, take: 8 },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 10, include: { actor: { select: { name: true, email: true } } } },
      notifications: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 8 },
      mediaAssets: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!customer || customer.deletedAt) notFound();

  const [allMediaCount, allPaymentCount, allAuditCount, activeFlagsCount, openSupportCount] = await Promise.all([
    prisma.mediaAsset.count({ where: { deletedAt: null, tenantId: customer.id } }),
    prisma.paymentRequest.count({ where: { deletedAt: null, tenantId: customer.id } }),
    prisma.auditLog.count({ where: { tenantId: customer.id } }),
    prisma.featureFlag.count({ where: { tenantId: customer.id, enabled: true } }),
    prisma.supportCase.count({ where: { deletedAt: null, tenantId: customer.id, status: { in: ["OPEN", "PENDING_CUSTOMER"] } } as never }),
  ]);

  const activeSubscription = customer.subscriptions.find((subscription) => subscription.status === "ACTIVE") ?? customer.subscriptions[0];
  const paymentTotal = customer.payments.reduce((sum, payment) => payment.status === "APPROVED" ? sum + payment.amount : sum, 0);

  return (
    <AdminPageShell
      badge="Customer 360"
      title={customer.displayName}
      description={`${customer.owner.email} · ${customer.status}`}
      backHref={`/admin/customers/${customer.id}`}
      backLabel="تفاصيل العميل"
      breadcrumbs={[{ label: "العملاء", href: "/admin/customers" }, { label: customer.displayName }]}
      actions={[
        { label: "التفاصيل القديمة", href: `/admin/customers/${customer.id}`, icon: UserRound },
        { label: "Search", href: `/admin/search?q=${encodeURIComponent(customer.owner.email)}`, icon: Search },
        { label: "Audit", href: `/admin/audit?tenantId=${customer.id}`, icon: ShieldCheck },
      ]}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="الحالة" value={customer.status} />
        <Metric label="Trial" value={daysLeft(customer.trialEndsAt)} />
        <Metric label="المواقع" value={customer.sites.length.toLocaleString("ar-EG")} />
        <Metric label="المدفوعات" value={money(paymentTotal, customer.payments[0]?.currency ?? "EGP")} accent />
        <Metric label="دعم مفتوح" value={openSupportCount.toLocaleString("ar-EG")} danger={openSupportCount > 0} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="المالك والحساب" icon={UserRound}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Owner" value={customer.owner.name} />
            <Info label="Email" value={customer.owner.email} dir="ltr" />
            <Info label="Role" value={customer.owner.role} />
            <Info label="Email verified" value={dateLabel(customer.owner.emailVerifiedAt)} />
            <Info label="Account updated" value={dateLabel(customer.owner.updatedAt)} />
            <Info label="Created" value={dateLabel(customer.createdAt)} />
          </div>
        </Panel>

        <Panel title="الاشتراك الحالي" icon={CreditCard}>
          {activeSubscription ? (
            <div className="grid gap-3">
              <Info label="Status" value={activeSubscription.status} />
              <Info label="Plan" value={activeSubscription.plan?.name ?? "بدون خطة"} />
              <Info label="Period end" value={dateLabel(activeSubscription.currentPeriodEnd ?? activeSubscription.expiresAt)} />
              <Info label="Plan price" value={activeSubscription.plan ? money(activeSubscription.plan.priceAmount, activeSubscription.plan.currency) : "—"} />
            </div>
          ) : <Empty text="لا يوجد اشتراك." />}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="المواقع" icon={Globe}>
          <div className="grid gap-2">
            {customer.sites.length === 0 ? <Empty text="لا توجد مواقع." /> : customer.sites.map((site) => (
              <Link key={site.id} href={`/admin/sites/${site.id}`} className="rounded-xl border border-white/8 bg-black/16 p-3 no-underline transition hover:border-amber-500/20 hover:bg-amber-500/[0.06]">
                <strong className="block truncate text-sm font-black text-white/82">{site.title}</strong>
                <span className="mt-1 block truncate text-xs font-bold text-white/38">/p/{site.slug} · {site.status} · {site.isPublished ? "published" : "draft"} · {site.theme.name}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="آخر المدفوعات" icon={CreditCard}>
          <div className="grid gap-2">
            {customer.payments.length === 0 ? <Empty text="لا توجد مدفوعات." /> : customer.payments.map((payment) => (
              <CompactItem key={payment.id} title={money(payment.amount, payment.currency)} subtitle={`${payment.method} · ${payment.status} · ${dateLabel(payment.createdAt)}`} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title={`الدعم · ${openSupportCount.toLocaleString("ar-EG")}`} icon={Bell}>
          <div className="grid gap-2">
            {customer.supportCases.length === 0 ? <Empty text="لا توجد تذاكر." /> : customer.supportCases.map((ticket) => <CompactItem key={ticket.id} title={ticket.subject} subtitle={`${ticket.status} · ${ticket.priority} · ${dateLabel(ticket.createdAt)}`} />)}
          </div>
        </Panel>
        <Panel title={`Feature Flags · ${activeFlagsCount.toLocaleString("ar-EG")}`} icon={Flag}>
          <div className="grid gap-2">
            {customer.featureFlags.length === 0 ? <Empty text="لا توجد Feature Flags." /> : customer.featureFlags.map((flag) => <CompactItem key={flag.id} title={flag.key} subtitle={`${flag.scope} · ${flag.enabled ? "enabled" : "disabled"} · ${dateLabel(flag.updatedAt)}`} />)}
          </div>
        </Panel>
        <Panel title={`Media · ${allMediaCount.toLocaleString("ar-EG")}`} icon={Image}>
          <div className="grid gap-2">
            {customer.mediaAssets.length === 0 ? <Empty text="لا توجد وسائط." /> : customer.mediaAssets.map((asset) => <CompactItem key={asset.id} title={mediaAssetTitle(asset.storageKey)} subtitle={`${asset.mimeType} · ${Math.round(asset.sizeBytes / 1024)} KB · ${dateLabel(asset.createdAt)}`} />)}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title={`Audit Timeline · ${allAuditCount.toLocaleString("ar-EG")}`} icon={Activity}>
          <div className="grid gap-2">
            {customer.auditLogs.length === 0 ? <Empty text="لا توجد أحداث." /> : customer.auditLogs.map((log) => <CompactItem key={log.id} title={log.action} subtitle={`${log.entityType} · ${log.actor?.email ?? log.actor?.name ?? "system"} · ${dateLabel(log.createdAt)}`} />)}
          </div>
        </Panel>
        <Panel title="Admin Notes" icon={NotebookText}>
          <div className="grid gap-2">
            {customer.adminNotes.length === 0 ? <Empty text="لا توجد ملاحظات." /> : customer.adminNotes.map((note) => <CompactItem key={note.id} title={note.body} subtitle={`${note.author.email} · ${dateLabel(note.createdAt)}`} />)}
          </div>
        </Panel>
      </section>
    </AdminPageShell>
  );
}

function Metric({ label, value, accent, danger }: { label: string; value: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className={danger ? "text-xl font-black text-red-300" : accent ? "text-xl font-black text-amber-200" : "text-xl font-black text-[#fff7e8]"}>{value}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof UserRound; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-[#fff7e8]"><Icon className="size-4 text-amber-300" /> {title}</h2>
      {children}
    </section>
  );
}

function Info({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/16 p-3">
      <p className="text-[0.68rem] font-black text-white/32">{label}</p>
      <p dir={dir} className="mt-1 truncate text-sm font-bold text-white/68">{value}</p>
    </div>
  );
}

function CompactItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/16 p-3">
      <strong className="block truncate text-sm font-black text-white/80">{title}</strong>
      <span className="mt-1 block truncate text-xs font-bold text-white/36">{subtitle}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-white/10 bg-black/12 p-5 text-center text-sm font-bold text-white/35">{text}</div>;
}
