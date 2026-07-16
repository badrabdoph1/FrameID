import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EmptyTrashButton } from "@/app/(admin)/admin/trash/empty-trash-button";
import { restoreFromTrashAction, permanentDeleteAction } from "@/app/(admin)/admin/trash/actions";

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

const PAGE_SIZE = 15;

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  TRIAL: "تجريبي",
  EXPIRED: "منتهي",
  TRIAL_EXPIRED: "انتهت التجربة",
  SUSPENDED: "موقوف",
};

const statusTone: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  TRIAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  EXPIRED: "bg-red-500/10 text-red-400 border-red-500/20",
  TRIAL_EXPIRED: "bg-red-500/10 text-red-400 border-red-500/20",
  SUSPENDED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function timeSinceDeleted(value: Date | string | null) {
  if (!value) return "—";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "اليوم";
  if (days === 1) return "منذ يوم";
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${Math.floor(months / 12)} سنة`;
}

function daysAgo(value: Date | string | null) {
  if (!value) return 0;
  return Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
}

export default async function AdminTrashPage({ searchParams }: Props) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const sp = await searchParams;
  const search = sp.search?.trim() || "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Record<string, unknown> = { deletedAt: { not: null } };

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: "insensitive" } },
      { owner: { name: { contains: search, mode: "insensitive" } } },
      { owner: { email: { contains: search, mode: "insensitive" } } },
      { owner: { phone: { contains: search, mode: "insensitive" } } },
    ];
  }

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

  // Convert Date objects to strings for rendering
  const mappedTenants = tenants.map(t => ({
    ...t,
    deletedAtStr: t.deletedAt?.toISOString() ?? null,
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

  return (
    <AdminPageShell
      badge="سلة المحذوفات"
      title="سلة المحذوفات"
      description={`${total.toLocaleString("ar-EG")} عميل محذوف - يمكنك استعادتهم أو حذفهم نهائيًا`}
    >
      {banner && (
        <div className={
          banner.tone === "danger"
            ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300"
            : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"
        }>
          {banner.text}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="إجمالي المحذوفين" value={total} icon="️" color="red" />
        <StatCard
          label="مواقع محذوفة"
          value={tenants.reduce((sum, t) => sum + t._count.sites, 0)}
          icon="🌐"
          color="blue"
        />
        <StatCard
          label="مدفوعات محذوفة"
          value={tenants.reduce((sum, t) => sum + t._count.payments, 0)}
          icon=""
          color="amber"
        />
        <StatCard
          label="ملفات وسائط"
          value={tenants.reduce((sum, t) => sum + t._count.mediaAssets, 0)}
          icon="️"
          color="violet"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action="/admin/trash" method="get" className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              name="search"
              defaultValue={search}
              placeholder="ابحث بالاسم أو البريد أو رقم الهاتف..."
              className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pr-10 pl-3 text-sm font-bold text-white"
            />
          </div>
          <button className="min-h-11 rounded-xl bg-[#f3cf73] px-5 text-sm font-black text-[#17120a]">بحث</button>
          {search && (
            <Link href={buildLink({ search: "", page: "1" })} className="min-h-11 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-black text-white/60">
              ✕ مسح
            </Link>
          )}
        </form>

        {total > 0 && <EmptyTrashButton />}
      </div>

      <div className="rounded-2xl border border-amber-500/12 bg-amber-500/[0.04] px-4 py-2.5">
        <p className="text-xs font-bold text-amber-300/70">
          ⚠️ المحذوفات تُحفظ هنا. يمكنك استعادة أي عميل أو حذفه نهائيًا. عند الحذف النهائي، تُحذف جميع البيانات بشكل دائم.
        </p>
      </div>

      {total === 0 && !search ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <div className="text-6xl">🗑️</div>
          <div>
            <h3 className="text-lg font-black text-white/70">سلة المحذوفات فارغة</h3>
            <p className="mt-1 text-sm font-bold text-white/40">لا يوجد عملاء محذوفون حاليًا.</p>
          </div>
          <Link href="/admin/customers" className="inline-flex items-center gap-2 rounded-xl border border-[#f3cf73]/30 bg-[#f3cf73]/10 px-4 py-2.5 text-sm font-black text-[#f3cf73]">
            ← الذهاب إلى العملاء
          </Link>
        </div>
      ) : total === 0 && search ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
          <div className="text-4xl">🔍</div>
          <p className="text-sm font-bold text-white/50">لا توجد نتائج مطابقة لـ &quot;{search}&quot;</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/[0.06] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-right text-xs font-bold text-white/40">#</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white/40">العميل</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white/40">الحالة السابقة</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white/40">تاريخ الحذف</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white/40">المدة</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white/40">المحتوى</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white/40">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t, idx) => {
                  const rowIdx = (page - 1) * PAGE_SIZE + idx + 1;
                  const days = daysAgo(t.deletedAt);
                  const urgent = days >= 30;
                  return (
                    <tr key={t.id} className={`border-b border-white/[0.04] transition hover:bg-white/[0.02] ${urgent ? "bg-red-500/[0.03]" : ""}`}>
                      <td className="px-4 py-3 text-xs text-white/30">{rowIdx}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white/85">{t.displayName}</div>
                        <div className="text-xs text-white/40">{t.owner.email}</div>
                        {t.owner.phone && <div className="text-xs text-white/30">{t.owner.phone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${statusTone[t.status] || "bg-white/5 text-white/40"}`}>
                          {statusLabels[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/55">{formatDate(t.deletedAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${urgent ? "text-red-400" : "text-white/45"}`}>
                          {urgent && "⚠️ "}{timeSinceDeleted(t.deletedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/45">
                        {t._count.sites > 0 && <span className="mr-1">{t._count.sites} مواقع</span>}
                        {t._count.payments > 0 && <span className="mr-1">{t._count.payments} مدفوعات</span>}
                        {t._count.mediaAssets > 0 && <span>{t._count.mediaAssets} وسائط</span>}
                        {t._count.sites === 0 && t._count.payments === 0 && t._count.mediaAssets === 0 && "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <form action={restoreFromTrashAction}>
                            <input type="hidden" name="customerId" value={t.id} />
                            <button
                              type="submit"
                              title="استعادة العميل وجميع بياناته"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-black text-emerald-400 transition hover:bg-emerald-500/20"
                            >
                              ️ استعادة
                            </button>
                          </form>
                          <form action={permanentDeleteAction}>
                            <input type="hidden" name="customerId" value={t.id} />
                            <button
                              type="submit"
                              onClick={(e) => {
                                if (!confirm(`⚠️ هل تريد حذف "${t.displayName}" نهائيًا؟ سيتم حذف جميع بياناته ومواقعه وملفاته بشكل دائم ولا يمكن التراجع!`)) {
                                  e.preventDefault();
                                }
                              }}
                              title="حذف نهائي وجميع البيانات"
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/8 px-2.5 py-1.5 text-[11px] font-black text-red-400 transition hover:bg-red-500/15"
                            >
                              ️ حذف نهائي
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {tenants.map((t) => {
              const days = daysAgo(t.deletedAt);
              const urgent = days >= 30;
              return (
                <article key={t.id} className={`rounded-2xl border p-4 ${urgent ? "border-red-500/20 bg-red-500/[0.03]" : "border-white/[0.08] bg-white/[0.03]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#fff7e8]">{t.displayName}</h3>
                      <p className="mt-0.5 truncate text-xs font-bold text-white/50">{t.owner.email}</p>
                      {t.owner.phone && <p className="truncate text-xs font-bold text-white/30">{t.owner.phone}</p>}
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${statusTone[t.status] || "bg-white/5 text-white/40"}`}>
                      {statusLabels[t.status] ?? t.status}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <InfoCell label="تاريخ الحذف" value={formatDate(t.deletedAt)} />
                    <InfoCell label="المدة" value={`${urgent ? "️ " : ""}${timeSinceDeleted(t.deletedAt)}`} urgent={urgent} />
                    <InfoCell label="مواقع" value={`${t._count.sites}`} />
                    <InfoCell label="مدفوعات" value={`${t._count.payments}`} />
                  </dl>
                  <div className="mt-3 flex gap-2">
                    <form action={restoreFromTrashAction} className="flex-1">
                      <input type="hidden" name="customerId" value={t.id} />
                      <button type="submit" className="flex w-full items-center justify-center gap-1 rounded-xl border border-emerald-500/25 bg-emerald-500/10 py-2 text-xs font-black text-emerald-400">
                        ♻️ استعادة
                      </button>
                    </form>
                    <form action={permanentDeleteAction} className="flex-1">
                      <input type="hidden" name="customerId" value={t.id} />
                      <button
                        type="submit"
                        onClick={(e) => {
                          if (!confirm(`⚠️ حذف "${t.displayName}" نهائيًا؟ لا يمكن التراجع!`)) {
                            e.preventDefault();
                          }
                        }}
                        className="flex w-full items-center justify-center gap-1 rounded-xl border border-red-500/20 bg-red-500/8 py-2 text-xs font-black text-red-400"
                      >
                        🗑️ حذف نهائي
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/35">صفحة {page} من {totalPages} ({total.toLocaleString("ar-EG")} نتيجة)</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={buildLink({ page: String(page - 1) })} className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.04]">
                    → السابق
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={buildLink({ page: String(page + 1) })} className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.04]">
                    التالي ←
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </AdminPageShell>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    red: "border-red-500/20 bg-red-500/[0.04]",
    blue: "border-blue-500/20 bg-blue-500/[0.04]",
    amber: "border-amber-500/20 bg-amber-500/[0.04]",
    violet: "border-violet-500/20 bg-violet-500/[0.04]",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colorMap[color] || colorMap.red}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-2xl font-black text-white/90">{value.toLocaleString("ar-EG")}</span>
      </div>
      <p className="mt-2 text-xs font-bold text-white/50">{label}</p>
    </div>
  );
}

function InfoCell({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/15 p-2.5">
      <dt className="text-[0.65rem] font-black text-white/35">{label}</dt>
      <dd className={`mt-0.5 text-sm font-bold ${urgent ? "text-red-400" : "text-white/70"}`}>{value}</dd>
    </div>
  );
}
