import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: Props) {
  await requireSuperAdminSession();
  const { id } = await params;

  const tenant = await prisma.tenant.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      displayName: true,
      status: true,
      trialStartedAt: true,
      trialEndsAt: true,
      createdAt: true,
      owner: {
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
      },
      sites: {
        where: { deletedAt: null },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          isPublished: true,
          createdAt: true,
          theme: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        where: { deletedAt: null },
        select: {
          id: true,
          status: true,
          currentPeriodEnd: true,
          plan: { select: { name: true, code: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      payments: {
        where: { deletedAt: null },
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          sites: true,
          payments: true,
          supportCases: true,
          mediaAssets: true,
        },
      },
    },
  });

  if (!tenant) notFound();

  const sub = tenant.subscriptions[0];

  const statusTone: Record<string, "success" | "warning" | "danger" | "default"> = {
    ACTIVE: "success",
    TRIAL: "warning",
    EXPIRED: "danger",
    SUSPENDED: "danger",
  };

  return (
    <AdminPageShell
      badge="العملاء"
      title={tenant.displayName}
      description={`${tenant.owner.email} · مشترك منذ ${tenant.createdAt.toLocaleDateString("ar-EG")}`}
      backHref="/admin/customers"
      backLabel="العملاء"
      actions={[
        { label: "إيقاف الحساب", variant: "danger" },
        { label: "تمديد التجربة", variant: "secondary" },
        { label: "إرسال بريد", variant: "ghost" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="mb-4 text-sm font-medium text-white/60">معلومات العميل</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-white/35">الاسم</p>
                <p className="text-sm text-white/80">{tenant.owner.name}</p>
              </div>
              <div>
                <p className="text-xs text-white/35">البريد الإلكتروني</p>
                <p className="text-sm text-white/80">{tenant.owner.email}</p>
              </div>
              <div>
                <p className="text-xs text-white/35">الهاتف</p>
                <p className="text-sm text-white/80">{tenant.owner.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/35">الحالة</p>
                <AdminStatusBadge tone={statusTone[tenant.status] || "default"}>
                  {tenant.status}
                </AdminStatusBadge>
              </div>
              <div>
                <p className="text-xs text-white/35">بداية التجربة</p>
                <p className="text-sm text-white/80">{tenant.trialStartedAt.toLocaleDateString("ar-EG")}</p>
              </div>
              <div>
                <p className="text-xs text-white/35">نهاية التجربة</p>
                <p className="text-sm text-white/80">{tenant.trialEndsAt.toLocaleDateString("ar-EG")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/60">المواقع</h3>
              <span className="text-xs text-white/35">{tenant._count.sites} مواقع</span>
            </div>
            {tenant.sites.length > 0 ? (
              <div className="space-y-2">
                {tenant.sites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white/80">{site.title}</p>
                      <p className="text-xs text-white/40" dir="ltr">
                        {site.slug}.frameid.app · {site.theme.name}
                      </p>
                    </div>
                    <AdminStatusBadge tone={site.status === "PUBLISHED" ? "success" : "default"}>
                      {site.status}
                    </AdminStatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/35">لا توجد مواقع بعد</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="mb-4 text-sm font-medium text-white/60">الاشتراك</h3>
            {sub ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/35">الخطة</p>
                  <p className="text-sm text-white/80">{sub.plan?.name || "بدون خطة"}</p>
                </div>
                <div>
                  <p className="text-xs text-white/35">الحالة</p>
                  <AdminStatusBadge
                    tone={
                      sub.status === "ACTIVE" ? "success"
                        : sub.status === "TRIAL" ? "warning"
                          : sub.status === "CANCELLED" ? "danger"
                            : "default"
                    }
                  >
                    {sub.status}
                  </AdminStatusBadge>
                </div>
                {sub.currentPeriodEnd && (
                  <div>
                    <p className="text-xs text-white/35">ينتهي في</p>
                    <p className="text-sm text-white/80">{sub.currentPeriodEnd.toLocaleDateString("ar-EG")}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/35">لا يوجد اشتراك</p>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="mb-4 text-sm font-medium text-white/60">إحصائيات</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-semibold text-white">{tenant._count.sites}</p>
                <p className="text-xs text-white/35">مواقع</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{tenant._count.payments}</p>
                <p className="text-xs text-white/35">مدفوعات</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{tenant._count.mediaAssets}</p>
                <p className="text-xs text-white/35">وسائط</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{tenant._count.supportCases}</p>
                <p className="text-xs text-white/35">تذاكر دعم</p>
              </div>
            </div>
          </div>

          {tenant.payments.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="mb-4 text-sm font-medium text-white/60">آخر المدفوعات</h3>
              <div className="space-y-2">
                {tenant.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{p.amount} ج.م</span>
                    <AdminStatusBadge
                      tone={
                        p.status === "APPROVED" ? "success"
                          : p.status === "REJECTED" ? "danger"
                            : "warning"
                      }
                    >
                      {p.status}
                    </AdminStatusBadge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}
