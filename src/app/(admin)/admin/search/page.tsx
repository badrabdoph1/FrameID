import Link from "next/link";
import {
  Activity,
  BadgeCheck,
  Bell,
  CreditCard,
  DatabaseBackup,
  FileText,
  Flag,
  Globe,
  Image,
  Layout,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminCenter } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

const RESULT_LIMIT = 8;

type Props = {
  searchParams: Promise<{ q?: string }>;
};

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
};

type ResultGroup = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  results: SearchResult[];
};

function normalizeQuery(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 120);
}

function toDateLabel(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function bytesLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getSearchGroups(query: string): Promise<ResultGroup[]> {
  if (query.length < 2) return [];

  const contains = { contains: query, mode: "insensitive" };

  const [
    customers,
    users,
    sites,
    paymentRequests,
    subscriptions,
    templates,
    themes,
    mediaAssets,
    supportCases,
    errors,
    auditLogs,
    backups,
    featureFlags,
    notifications,
  ] = await Promise.all([
    prisma.tenant.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: contains },
          { displayName: contains },
          { owner: { name: contains } },
          { owner: { email: contains } },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: {
        id: true,
        displayName: true,
        status: true,
        createdAt: true,
        owner: { select: { name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: contains },
          { name: contains },
          { email: contains },
          { phone: contains },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.site.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: contains },
          { slug: contains },
          { title: contains },
          { description: contains },
          { tenant: { displayName: contains } },
          { domains: { some: { domain: contains } } },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        isPublished: true,
        tenant: { select: { id: true, displayName: true } },
      },
    }),
    prisma.paymentRequest.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: contains },
          { reference: contains },
          { tenant: { displayName: contains } },
          { tenant: { owner: { email: contains } } },
          { paymentAccount: { accountName: contains } },
          { paymentAccount: { accountNumber: contains } },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        createdAt: true,
        tenant: { select: { id: true, displayName: true } },
      },
    }),
    prisma.subscription.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: contains },
          { tenant: { displayName: contains } },
          { tenant: { owner: { email: contains } } },
          { plan: { name: contains } },
          { plan: { code: contains } },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        expiresAt: true,
        tenant: { select: { id: true, displayName: true } },
        plan: { select: { name: true, code: true } },
      },
    }),
    prisma.template.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: contains },
          { code: contains },
          { name: contains },
          { theme: { name: contains } },
          { theme: { code: contains } },
        ],
      } as never,
      orderBy: { updatedAt: "desc" },
      take: RESULT_LIMIT,
      select: { id: true, code: true, name: true, status: true, showroomOrder: true, theme: { select: { name: true } } },
    }),
    prisma.theme.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: contains },
          { code: contains },
          { name: contains },
          { category: contains },
        ],
      } as never,
      orderBy: { name: "desc" },
      take: RESULT_LIMIT,
      select: { id: true, code: true, name: true, status: true, category: true, version: true },
    }),
    prisma.mediaAsset.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: contains },
          { storageKey: contains },
          { url: contains },
          { mimeType: contains },
          { alt: contains },
          { tenant: { displayName: contains } },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: {
        id: true,
        storageKey: true,
        url: true,
        mimeType: true,
        sizeBytes: true,
        alt: true,
        tenant: { select: { id: true, displayName: true } },
      },
    }),
    prisma.supportCase.findMany({
      where: {
        OR: [
          { id: contains },
          { subject: contains },
          { tenant: { displayName: contains } },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: { id: true, subject: true, status: true, createdAt: true, tenant: { select: { id: true, displayName: true } } },
    }),
    prisma.errorLog.findMany({
      where: {
        OR: [
          { id: contains },
          { code: contains },
          { message: contains },
          { category: contains },
          { level: contains },
          { route: contains },
          { requestId: contains },
          { correlationId: contains },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: { id: true, code: true, message: true, category: true, level: true, resolved: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { id: contains },
          { action: contains },
          { entityType: contains },
          { entityId: contains },
          { actor: { email: contains } },
          { actor: { name: contains } },
          { tenant: { displayName: contains } },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
        tenant: { select: { id: true, displayName: true } },
      },
    }),
    prisma.backupJob.findMany({
      where: {
        OR: [
          { id: contains },
          { type: contains as never },
          { status: contains as never },
          { filePath: contains },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: { id: true, type: true, status: true, createdAt: true, completedAt: true },
    }),
    prisma.featureFlag.findMany({
      where: {
        OR: [
          { id: contains },
          { key: contains },
          { tenant: { displayName: contains } },
          { site: { title: contains } },
          { site: { slug: contains } },
        ],
      } as never,
      orderBy: { updatedAt: "desc" },
      take: RESULT_LIMIT,
      select: {
        id: true,
        key: true,
        scope: true,
        enabled: true,
        updatedAt: true,
        tenant: { select: { id: true, displayName: true } },
        site: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.notificationLog.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: contains },
          { type: contains },
          { title: contains },
          { body: contains },
          { category: contains },
          { tenantId: contains },
        ],
      } as never,
      orderBy: { createdAt: "desc" },
      take: RESULT_LIMIT,
      select: { id: true, type: true, title: true, category: true, tenantId: true, createdAt: true },
    }),
  ]);

  const groups: ResultGroup[] = [
    {
      id: "customers",
      title: "العملاء",
      description: "Tenants، أسماء الاستوديوهات، وأصحاب الحسابات.",
      icon: Users,
      results: customers.map((customer) => ({
        id: customer.id,
        title: customer.displayName,
        subtitle: `${customer.owner.name} · ${customer.owner.email}`,
        meta: `${customer.status} · ${toDateLabel(customer.createdAt)}`,
        href: `/admin/customers/${customer.id}`,
      })),
    },
    {
      id: "users",
      title: "المستخدمون",
      description: "حسابات المستخدمين والأدوار والبريد.",
      icon: BadgeCheck,
      results: users.map((user) => ({
        id: user.id,
        title: user.name,
        subtitle: user.email,
        meta: `${user.role} · ${toDateLabel(user.createdAt)}`,
        href: `/admin/search?q=${encodeURIComponent(user.email)}`,
      })),
    },
    {
      id: "sites",
      title: "المواقع",
      description: "المواقع، السلاج، الدومينات، وحالة النشر.",
      icon: Globe,
      results: sites.map((site) => ({
        id: site.id,
        title: site.title,
        subtitle: `${site.tenant.displayName} · /p/${site.slug}`,
        meta: `${site.status} · ${site.isPublished ? "منشور" : "غير منشور"}`,
        href: `/admin/customers/${site.tenant.id}`,
      })),
    },
    {
      id: "payments",
      title: "المدفوعات",
      description: "طلبات الدفع، المراجع، وحالات المراجعة.",
      icon: CreditCard,
      results: paymentRequests.map((payment) => ({
        id: payment.id,
        title: `${payment.amount.toLocaleString("ar-EG")} ${payment.currency}`,
        subtitle: `${payment.tenant.displayName} · ${payment.method}`,
        meta: `${payment.status} · ${toDateLabel(payment.createdAt)}`,
        href: "/admin/payments",
      })),
    },
    {
      id: "subscriptions",
      title: "الاشتراكات",
      description: "الخطط والحالات ونهاية الفترة الحالية.",
      icon: BadgeCheck,
      results: subscriptions.map((subscription) => ({
        id: subscription.id,
        title: subscription.plan?.name ?? "اشتراك بدون خطة",
        subtitle: subscription.tenant.displayName,
        meta: `${subscription.status} · نهاية الفترة: ${toDateLabel(subscription.currentPeriodEnd ?? subscription.expiresAt)}`,
        href: `/admin/customers/${subscription.tenant.id}`,
      })),
    },
    {
      id: "templates",
      title: "القوالب",
      description: "قوالب العرض والثيمات المرتبطة.",
      icon: Layout,
      results: templates.map((template) => ({
        id: template.id,
        title: template.name,
        subtitle: `${template.code} · ${template.theme.name}`,
        meta: `${template.status} · ترتيب ${template.showroomOrder}`,
        href: "/admin/templates",
      })),
    },
    {
      id: "themes",
      title: "الثيمات",
      description: "الثيمات والإصدارات والفئات.",
      icon: FileText,
      results: themes.map((theme) => ({
        id: theme.id,
        title: theme.name,
        subtitle: `${theme.code} · ${theme.category}`,
        meta: `${theme.status} · v${theme.version}`,
        href: "/admin/themes",
      })),
    },
    {
      id: "media",
      title: "الوسائط",
      description: "الصور والملفات المخزنة وربطها بالعملاء.",
      icon: Image,
      results: mediaAssets.map((asset) => ({
        id: asset.id,
        title: asset.alt || asset.storageKey || asset.id,
        subtitle: `${asset.tenant.displayName} · ${asset.mimeType}`,
        meta: bytesLabel(asset.sizeBytes),
        href: `/admin/customers/${asset.tenant.id}`,
      })),
    },
    {
      id: "support",
      title: "الدعم",
      description: "تذاكر الدعم المرتبطة بالعملاء.",
      icon: Bell,
      results: supportCases.map((supportCase) => ({
        id: supportCase.id,
        title: supportCase.subject,
        subtitle: supportCase.tenant.displayName,
        meta: `${supportCase.status} · ${toDateLabel(supportCase.createdAt)}`,
        href: "/admin/support",
      })),
    },
    {
      id: "errors",
      title: "الأخطاء",
      description: "Error Center، الأكواد، الرسائل، والمسارات.",
      icon: Activity,
      results: errors.map((error) => ({
        id: error.id,
        title: error.code ?? "N/A",
        subtitle: error.message ?? "",
        meta: `${error.level} · ${error.category} · ${error.resolved ? "محلول" : "مفتوح"}`,
        href: `/admin/errors?search=${encodeURIComponent(error.code ?? "")}`,
      })),
    },
    {
      id: "audit",
      title: "سجل التدقيق",
      description: "الأحداث الإدارية والكيانات المتأثرة.",
      icon: ShieldCheck,
      results: auditLogs.map((log) => ({
        id: log.id,
        title: log.action,
        subtitle: `${log.entityType}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}`,
        meta: `${log.actor?.email ?? log.actor?.name ?? "النظام"} · ${toDateLabel(log.createdAt)}`,
        href: `/admin/audit?q=${encodeURIComponent(log.action)}`,
      })),
    },
    {
      id: "backups",
      title: "النسخ الاحتياطي",
      description: "وظائف النسخ والاستعادة والتحقق.",
      icon: DatabaseBackup,
      results: backups.map((backup) => ({
        id: backup.id,
        title: `${backup.type} backup`,
        subtitle: `${backup.status}`,
        meta: `${toDateLabel(backup.createdAt)} → ${toDateLabel(backup.completedAt)}`,
        href: "/admin/backups",
      })),
    },
    {
      id: "feature-flags",
      title: "Feature Flags",
      description: "مفاتيح تشغيل الميزات حسب المنصة أو العميل أو الموقع.",
      icon: Flag,
      results: featureFlags.map((flag) => ({
        id: flag.id,
        title: flag.key,
        subtitle: flag.tenant?.displayName ?? flag.site?.title ?? flag.site?.slug ?? "Platform scope",
        meta: `${flag.scope} · ${flag.enabled ? "مفعل" : "متوقف"} · ${toDateLabel(flag.updatedAt)}`,
        href: "/admin/feature-flags",
      })),
    },
    {
      id: "notifications",
      title: "الإشعارات",
      description: "سجل إشعارات النظام والعملاء.",
      icon: Bell,
      results: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        subtitle: `${notification.type}${notification.category ? ` · ${notification.category}` : ""}`,
        meta: `${notification.tenantId ?? "system"} · ${toDateLabel(notification.createdAt)}`,
        href: "/admin/notifications",
      })),
    },
  ];

  return groups.filter((group) => group.results.length > 0);
}

export default async function AdminSearchPage({ searchParams }: Props) {
  await requireAdminCenter("dashboard");
  const query = normalizeQuery((await searchParams).q);
  const groups = await getSearchGroups(query);
  const total = groups.reduce((sum, group) => sum + group.results.length, 0);

  return (
    <AdminPageShell
      badge="Command Center"
      title="البحث الشامل"
      description="ابحث في العملاء، المواقع، المدفوعات، الاشتراكات، القوالب، الأخطاء، التدقيق، والنسخ الاحتياطي من مكان واحد."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "البحث الشامل" }]}
    >
      <form action="/admin/search" className="rounded-2xl border border-amber-500/15 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.12),transparent_35%),rgba(255,255,255,0.035)] p-4">
        <label htmlFor="admin-global-search" className="mb-2 block text-xs font-black text-white/45">
          اكتب اسم عميل، بريد، slug، reference، error code، action، أو ID
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-amber-300/70" />
          <input
            id="admin-global-search"
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="مثال: customer@email.com أو FID-PAY أو wedding-template"
            className="h-14 w-full rounded-2xl border border-white/10 bg-black/25 pr-12 pl-4 text-base font-bold text-white outline-none transition placeholder:text-white/25 focus:border-amber-400/45 focus:bg-black/35"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-white/40">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">⌘K جاهز للربط لاحقًا</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Permission-aware entrypoint</span>
          {query ? <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-200">{total} نتيجة معروضة</span> : null}
        </div>
      </form>

      {!query ? (
        <SearchStart />
      ) : query.length < 2 ? (
        <EmptySearch title="اكتب حرفين على الأقل" description="البحث الشامل يتجاهل الاستعلامات القصيرة جدًا لتقليل الضغط على قاعدة البيانات." />
      ) : groups.length === 0 ? (
        <EmptySearch title="لا توجد نتائج" description="جرّب البريد، اسم العميل، slug الموقع، رقم المرجع، أو كود الخطأ." />
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <SearchGroup key={group.id} group={group} />
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

function SearchStart() {
  const examples = [
    { label: "عميل", value: "studio@email.com" },
    { label: "مدفوعات", value: "payment-reference" },
    { label: "موقع", value: "wedding" },
    { label: "أخطاء", value: "FID-PAY" },
    { label: "Audit", value: "PAYMENT_APPROVED" },
    { label: "Feature", value: "new-dashboard" },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <h2 className="text-base font-black text-[#fff7e8]">نقطة دخول موحدة للوحة الإدارة</h2>
      <p className="mt-2 max-w-3xl text-sm font-bold leading-7 text-white/52">
        الهدف من الصفحة دي إن الأدمن يوصل لأي كيان مهم في أقل من ثواني بدل التنقل بين صفحات كثيرة. هذه أول طبقة فعلية من Command Center، ويمكن لاحقًا ربطها بـ Command Palette مباشر.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example) => (
          <Link
            key={example.value}
            href={`/admin/search?q=${encodeURIComponent(example.value)}`}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-black text-white/58 no-underline transition hover:border-amber-500/25 hover:bg-amber-500/10 hover:text-white"
          >
            {example.label}: {example.value}
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptySearch({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-14 text-center">
      <Search className="mb-3 size-9 text-white/18" />
      <h2 className="text-lg font-black text-white/75">{title}</h2>
      <p className="mt-1 max-w-xl text-sm font-bold leading-7 text-white/42">{description}</p>
    </div>
  );
}

function SearchGroup({ group }: { group: ResultGroup }) {
  const Icon = group.icon;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <header className="flex items-start gap-3 border-b border-white/8 bg-black/15 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-amber-500/15 bg-amber-500/10 text-amber-300">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-[#fff7e8]">{group.title}</h2>
          <p className="mt-0.5 text-xs font-bold text-white/42">{group.description}</p>
        </div>
        <span className="mr-auto rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-black text-white/45">
          {group.results.length}
        </span>
      </header>
      <div className="grid divide-y divide-white/6">
        {group.results.map((result) => (
          <Link
            key={`${group.id}-${result.id}`}
            href={result.href}
            className="grid gap-1 px-4 py-3 no-underline transition hover:bg-amber-500/[0.06] sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <span className="min-w-0">
              <strong className="block truncate text-sm font-black text-white/84">{result.title}</strong>
              <small className="block truncate text-xs font-bold text-white/42">{result.subtitle}</small>
            </span>
            {result.meta ? (
              <span className="w-fit rounded-full border border-white/8 bg-black/20 px-2.5 py-1 text-[0.68rem] font-black text-white/38">
                {result.meta}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
