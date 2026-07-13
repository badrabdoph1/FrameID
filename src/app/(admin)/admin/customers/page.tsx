import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { CustomersTable } from "@/app/(admin)/admin/customers/customers-table";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminToolbar } from "@/components/layout/admin-toolbar";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ search?: string; status?: string; filter?: string; page?: string; bulkDone?: string; bulkError?: string }>;
};

const PAGE_SIZE = 25;
const pendingStatuses = ["SUBMITTED", "PENDING", "UNDER_REVIEW"];

const filters = [
  { id: "all", label: "جميع العملاء" },
  { id: "trial", label: "تجريبيون" },
  { id: "subscribed", label: "مشتركون" },
  { id: "expired", label: "منتهية" },
  { id: "pending", label: "معلقة" },
  { id: "suspended", label: "معطلة" },
  { id: "expiring3", label: "ينتهي خلال 3 أيام" },
  { id: "expiring7", label: "ينتهي خلال 7 أيام" },
  { id: "expiring30", label: "ينتهي خلال 30 يوم" },
  { id: "trialExpiredNoSub", label: "تجربة انتهت بلا اشتراك" },
  { id: "unpublished", label: "لم ينشروا الموقع" },
  { id: "noPayments", label: "بدون طلبات دفع" },
  { id: "pendingPayment", label: "لديهم طلب قيد المراجعة" },
];

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildLifecycleWhere(filter: string, now: Date) {
  if (filter === "trial") return { status: "TRIAL" };
  if (filter === "subscribed") return { status: "ACTIVE", subscriptions: { some: { status: "ACTIVE" } } };
  if (filter === "expired") return { OR: [{ status: { in: ["EXPIRED", "TRIAL_EXPIRED"] } }, { subscriptions: { some: { status: "EXPIRED" } } }] };
  if (filter === "pending") return { payments: { some: { deletedAt: null, status: { in: pendingStatuses } } } };
  if (filter === "suspended") return { status: "SUSPENDED" };
  if (["expiring3", "expiring7", "expiring30"].includes(filter)) {
    const days = filter === "expiring3" ? 3 : filter === "expiring7" ? 7 : 30;
    const soon = addDays(now, days);
    return {
      OR: [
        { status: "TRIAL", trialEndsAt: { gte: now, lte: soon } },
        { subscriptions: { some: { status: "ACTIVE", OR: [{ currentPeriodEnd: { gte: now, lte: soon } }, { expiresAt: { gte: now, lte: soon } }] } } },
      ],
    };
  }
  if (filter === "trialExpiredNoSub") return { status: "TRIAL_EXPIRED", payments: { none: { status: "APPROVED" } } };
  if (filter === "unpublished") return { OR: [{ sites: { none: { deletedAt: null, isPublished: true } } }, { sites: { some: { deletedAt: null, isPublished: false } } }] };
  if (filter === "noPayments") return { payments: { none: { deletedAt: null } } };
  if (filter === "pendingPayment") return { payments: { some: { deletedAt: null, status: { in: pendingStatuses } } } };
  return {};
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  await requireAdminPermission("customers", "view");
  const sp = await searchParams;
  const search = sp.search?.trim() || "";
  const statusFilter = sp.status || "";
  const lifecycleFilter = sp.filter || "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const now = new Date();

  const where: Record<string, unknown> = { deletedAt: null, ...buildLifecycleWhere(lifecycleFilter, now) };

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: "insensitive" } },
      { owner: { name: { contains: search, mode: "insensitive" } } },
      { owner: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (statusFilter && ["TRIAL", "ACTIVE", "EXPIRED", "TRIAL_EXPIRED", "SUSPENDED"].includes(statusFilter)) where.status = statusFilter;

  const [customers, total, counts] = await Promise.all([
    prisma.tenant.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        displayName: true,
        status: true,
        trialEndsAt: true,
        createdAt: true,
        owner: { select: { name: true, email: true } },
        sites: { where: { deletedAt: null }, take: 1, select: { isPublished: true, status: true } },
        subscriptions: { where: {}, orderBy: { currentPeriodStart: "desc" }, take: 1, select: { status: true, currentPeriodEnd: true, expiresAt: true, plan: { select: { name: true } } } },
        payments: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
        _count: { select: { sites: true, payments: true } },
      },
    }),
    prisma.tenant.count({ where: where as never }),
    Promise.all(filters.map(async (filter) => ({ id: filter.id, count: await prisma.tenant.count({ where: { deletedAt: null, ...buildLifecycleWhere(filter.id, now) } as never }) }))),
  ]);

  const countMap = new Map(counts.map((item) => [item.id, item.count]));
  const data = customers.map((customer) => {
    const sub = customer.subscriptions[0] ?? null;
    const lifecycleEnd = customer.status === "TRIAL" ? customer.trialEndsAt : (sub?.currentPeriodEnd ?? sub?.expiresAt ?? null);
    return {
      id: customer.id,
      displayName: customer.displayName,
      ownerName: customer.owner.name,
      ownerEmail: customer.owner.email,
      status: customer.status,
      trialEndsAt: customer.trialEndsAt?.toISOString() ?? null,
      lifecycleEndAt: lifecycleEnd?.toISOString() ?? null,
      subscriptionStatus: sub?.status ?? null,
      planName: sub?.plan?.name ?? null,
      latestPaymentStatus: customer.payments[0]?.status ?? null,
      isPublished: customer.sites.some((site) => site.isPublished),
      sitesCount: customer._count.sites,
      paymentsCount: customer._count.payments,
      createdAt: customer.createdAt.toISOString(),
    };
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const buildLink = (params: Record<string, string | undefined>) => {
    const url = new URLSearchParams();
    const s = params.search ?? search;
    const st = params.status ?? statusFilter;
    const f = params.filter ?? lifecycleFilter;
    const p = params.page ?? "1";
    if (s) url.set("search", s);
    if (st) url.set("status", st);
    if (f && f !== "all") url.set("filter", f);
    if (p !== "1") url.set("page", p);
    const qs = url.toString();
    return `/admin/customers${qs ? `?${qs}` : ""}`;
  };

  const banner = sp.bulkDone
    ? { tone: "success", text: `تم تنفيذ العملية على ${Number(sp.bulkDone).toLocaleString("ar-EG")} عميل.` }
    : sp.bulkError
      ? { tone: "danger", text: sp.bulkError }
      : null;

  return (
    <AdminPageShell badge="الإدارة" title="مركز إدارة العملاء" description={`${total} عميل مطابق للفلتر الحالي`}>
      {banner ? <div className={banner.tone === "danger" ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300" : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"}>{banner.text}</div> : null}
      <AdminToolbar searchValue={search} searchPlaceholder="بحث بالاسم أو البريد..." filters={
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1 admin-scrollbar">
          {filters.map((filter) => (
            <Link key={filter.id} href={buildLink({ filter: lifecycleFilter === filter.id ? "all" : filter.id, page: "1" })} className={`shrink-0 rounded-2xl border px-3 py-1.5 text-xs font-black transition ${lifecycleFilter === filter.id ? "border-amber-300/35 bg-amber-300/12 text-[#f3cf73]" : "border-white/10 bg-white/[0.035] text-white/45 hover:text-white/70"}`}>{filter.label} <span className="opacity-60">{countMap.get(filter.id) ?? 0}</span></Link>
          ))}
        </div>
      } />
      <CustomersTable data={data} page={page} totalPages={totalPages} basePath="/admin/customers" search={search} statusFilter={statusFilter} lifecycleFilter={lifecycleFilter} />
    </AdminPageShell>
  );
}
