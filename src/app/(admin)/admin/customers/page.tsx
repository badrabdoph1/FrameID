import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { CustomersTable } from "@/app/(admin)/admin/customers/customers-table";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminToolbar } from "@/components/layout/admin-toolbar";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 25;

export default async function AdminCustomersPage({ searchParams }: Props) {
  await requireSuperAdminSession();
  const sp = await searchParams;
  const search = sp.search?.trim() || "";
  const statusFilter = sp.status || "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Record<string, unknown> = { deletedAt: null };

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: "insensitive" } },
      { owner: { name: { contains: search, mode: "insensitive" } } },
      { owner: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (statusFilter && ["TRIAL", "ACTIVE", "EXPIRED", "SUSPENDED"].includes(statusFilter)) {
    where.status = statusFilter;
  }

  const [customers, total] = await Promise.all([
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
        _count: { select: { sites: true, payments: true } },
      },
    }),
    prisma.tenant.count({ where: where as never }),
  ]);

  const data = customers.map((c) => ({
    id: c.id,
    displayName: c.displayName,
    ownerName: c.owner.name,
    ownerEmail: c.owner.email,
    status: c.status,
    trialEndsAt: c.trialEndsAt?.toISOString() ?? null,
    sitesCount: c._count.sites,
    paymentsCount: c._count.payments,
    createdAt: c.createdAt.toISOString(),
  }));

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const statuses = ["TRIAL", "ACTIVE", "EXPIRED", "SUSPENDED"];

  const buildLink = (params: Record<string, string | undefined>) => {
    const url = new URLSearchParams();
    const s = params.search ?? search;
    const st = params.status ?? statusFilter;
    const p = params.page ?? "1";
    if (s) url.set("search", s);
    if (st) url.set("status", st);
    if (p !== "1") url.set("page", p);
    const qs = url.toString();
    return `/admin/customers${qs ? `?${qs}` : ""}`;
  };

  return (
    <AdminPageShell
      badge="الإدارة"
      title="العملاء"
      description={`${total} عميل على المنصة`}
    >
      <AdminToolbar
        searchValue={search}
        searchPlaceholder="بحث بالاسم أو البريد..."
        filters={
          <div className="flex gap-2">
            {statuses.map((s) => (
              <Link
                key={s}
                href={buildLink({ status: statusFilter === s ? undefined : s, page: "1" })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === s
                    ? "bg-champagne/15 text-champagne"
                    : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                }`}
              >
                {s === "TRIAL" ? "تجريبي" : s === "ACTIVE" ? "نشط" : s === "EXPIRED" ? "منتهي" : "موقوف"}
              </Link>
            ))}
          </div>
        }
      />

      <CustomersTable
        data={data}
        page={page}
        totalPages={totalPages}
        basePath="/admin/customers"
        search={search}
        statusFilter={statusFilter}
      />
    </AdminPageShell>
  );
}
