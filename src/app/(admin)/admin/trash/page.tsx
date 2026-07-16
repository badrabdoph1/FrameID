import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, X } from "lucide-react";
import { TrashTable } from "@/app/(admin)/admin/trash/trash-table";
import { EmptyTrashButton } from "@/app/(admin)/admin/trash/empty-trash-button";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    restored?: string;
    deleted?: string;
    emptied?: string;
    error?: string;
  }>;
};

const PAGE_SIZE = 25;

export default async function AdminTrashPage({ searchParams }: Props) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const search = sp.search?.trim() || "";
  const page = Math.max(1, Number(sp.page) || 1);

  try {
    const where = {
      deletedAt: { not: null },
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: "insensitive" as const } },
              { owner: { name: { contains: search, mode: "insensitive" as const } } },
              { owner: { email: { contains: search, mode: "insensitive" as const } } },
              { owner: { phone: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        orderBy: { deletedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          displayName: true,
          status: true,
          deletedAt: true,
          createdAt: true,
          owner: {
            select: { id: true, name: true, email: true, phone: true },
          },
          _count: {
            select: { sites: true, payments: true, mediaAssets: true },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    const data = tenants.map((t) => ({
      id: t.id,
      displayName: t.displayName,
      ownerName: t.owner.name,
      ownerEmail: t.owner.email,
      ownerPhone: t.owner.phone,
      ownerId: t.owner.id,
      previousStatus: t.status,
      sitesCount: t._count.sites,
      paymentsCount: t._count.payments,
      mediaCount: t._count.mediaAssets,
      deletedAt: t.deletedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const buildLink = (params: Record<string, string | undefined>) => {
      const url = new URLSearchParams();
      const s = params.search ?? search;
      const p = params.page ?? "1";
      if (s) url.set("search", s);
      if (p !== "1") url.set("page", p);
      const qs = url.toString();
      return `/admin/trash${qs ? `?${qs}` : ""}`;
    };

    const banner = sp.error
      ? { tone: "danger" as const, text: sp.error }
      : sp.restored
      ? { tone: "success" as const, text: "تمت استعادة العميل بنجاح من سلة المحذوفات." }
      : sp.deleted
      ? { tone: "success" as const, text: "تم الحذف النهائي للعميل بنجاح." }
      : sp.emptied
      ? { tone: "success" as const, text: "تم إفراغ سلة المحذوفات بالكامل بنجاح." }
      : null;

    const hasItems = total > 0;

    return (
      <AdminPageShell
        badge="سلة المحذوفات"
        title="سلة المحذوفات"
        description={`${total.toLocaleString("ar-EG")} عميل في سلة المحذوفات`}
      >
        {banner ? (
          <div
            className={
              banner.tone === "danger"
                ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300"
                : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"
            }
          >
            {banner.text}
          </div>
        ) : null}

        {!hasItems && !search ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <div className="rounded-full border border-white/8 bg-white/[0.04] p-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-white/70">سلة المحذوفات فارغة</h3>
              <p className="mt-1 text-sm font-bold text-white/40">لا يوجد عملاء محذوفون حاليًا. عند حذف عميل، سيظهر هنا لإمكانية استعادته أو حذفه نهائيًا.</p>
            </div>
            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-2 rounded-xl border border-[#f3cf73]/30 bg-[#f3cf73]/10 px-4 py-2.5 text-sm font-black text-[#f3cf73] transition hover:bg-[#f3cf73]/20"
            >
              الذهاب إلى العملاء
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <form action="/admin/trash" method="get" role="search" className="flex flex-1 flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">البحث في سلة المحذوفات</span>
                  <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
                  <input
                    name="search"
                    defaultValue={search}
                    placeholder="ابحث بالاسم أو البريد أو رقم الهاتف..."
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pr-10 pl-3 text-sm font-bold text-white"
                  />
                </label>
                <button className="min-h-11 rounded-xl bg-[#f3cf73] px-5 text-sm font-black text-[#17120a]">
                  بحث
                </button>
                {search ? (
                  <Link
                    href={buildLink({ search: "", page: "1" })}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-black text-white/60"
                  >
                    <X className="size-4" /> مسح البحث
                  </Link>
                ) : null}
              </form>

              {hasItems && <EmptyTrashButton />}
            </div>

            <div className="rounded-2xl border border-amber-500/12 bg-amber-500/[0.04] px-4 py-2.5">
              <p className="text-xs font-bold text-amber-300/70">
                المحذوفات هنا تُحفظ لمدة غير محددة. يمكنك استعادة أي عميل أو حذفه نهائيًا. عند الحذف النهائي، تُحذف جميع بيانات العميل وموقعه وملفاته بشكل دائم ولا يمكن التراجع.
              </p>
            </div>

            <TrashTable
              data={data}
              page={page}
              totalPages={totalPages}
              buildLink={buildLink}
              search={search}
            />
          </>
        )}
      </AdminPageShell>
    );
  } catch (error) {
    console.error("Error loading trash page:", error);
    return (
      <AdminPageShell badge="خطأ" title="حدث خطأ" description="حدث خطأ أثناء تحميل البيانات">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300">
          {error instanceof Error ? error.message : "خطأ غير متوقع"}
        </div>
      </AdminPageShell>
    );
  }
}
