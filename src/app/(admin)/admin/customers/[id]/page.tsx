import { notFound } from "next/navigation";
import Link from "next/link";
import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
    ACTIVE: "success",
    TRIAL: "warning",
    EXPIRED: "danger",
    SUSPENDED: "danger",
  };

  const sub = tenant.subscriptions[0];

  return (
    <CenterPageShell
      badge="تفاصيل العميل"
      title={tenant.displayName}
      description={`${tenant.owner.email} · مشترك منذ ${tenant.createdAt.toLocaleDateString("ar-EG")}`}
      breadcrumbs={[
        { label: "القيادة", href: "/admin" },
        { label: "العملاء", href: "/admin/customers" },
        { label: tenant.displayName },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
            <h3 className="mb-4 text-sm font-medium text-white/60">
              معلومات العميل
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-white/40">الاسم</p>
                <p className="text-sm text-white">{tenant.owner.name}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">البريد الإلكتروني</p>
                <p className="text-sm text-white">{tenant.owner.email}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">الهاتف</p>
                <p className="text-sm text-white">
                  {tenant.owner.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">الحالة</p>
                <Badge tone={statusTone[tenant.status] || "neutral"}>
                  {tenant.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-white/40">بداية التجربة</p>
                <p className="text-sm text-white">
                  {tenant.trialStartedAt.toLocaleDateString("ar-EG")}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">نهاية التجربة</p>
                <p className="text-sm text-white">
                  {tenant.trialEndsAt.toLocaleDateString("ar-EG")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/60">المواقع</h3>
              <span className="text-xs text-white/40">
                {tenant._count.sites} مواقع
              </span>
            </div>
            {tenant.sites.length > 0 ? (
              <div className="space-y-2">
                {tenant.sites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {site.title}
                      </p>
                      <p className="text-xs text-white/50" dir="ltr">
                        {site.slug}.frameid.app · {site.theme.name}
                      </p>
                    </div>
                    <Badge
                      tone={site.status === "PUBLISHED" ? "success" : "neutral"}
                    >
                      {site.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">لا توجد مواقع بعد.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
            <h3 className="mb-4 text-sm font-medium text-white/60">
              الاشتراك
            </h3>
            {sub ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40">الخطة</p>
                  <p className="text-sm text-white">
                    {sub.plan?.name || "بدون خطة"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40">الحالة</p>
                  <Badge
                    tone={
                      sub.status === "ACTIVE"
                        ? "success"
                        : sub.status === "TRIAL"
                          ? "warning"
                          : sub.status === "CANCELLED"
                            ? "danger"
                            : "neutral"
                    }
                  >
                    {sub.status}
                  </Badge>
                </div>
                {sub.currentPeriodEnd && (
                  <div>
                    <p className="text-xs text-white/40">ينتهي في</p>
                    <p className="text-sm text-white">
                      {sub.currentPeriodEnd.toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40">لا يوجد اشتراك.</p>
            )}
          </div>

          <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/60">إحصائيات</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-semibold text-white">
                  {tenant._count.sites}
                </p>
                <p className="text-xs text-white/40">مواقع</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {tenant._count.payments}
                </p>
                <p className="text-xs text-white/40">مدفوعات</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {tenant._count.mediaAssets}
                </p>
                <p className="text-xs text-white/40">وسائط</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {tenant._count.supportCases}
                </p>
                <p className="text-xs text-white/40">تذاكر دعم</p>
              </div>
            </div>
          </div>

          {tenant.payments.length > 0 && (
            <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
              <h3 className="mb-4 text-sm font-medium text-white/60">
                آخر المدفوعات
              </h3>
              <div className="space-y-2">
                {tenant.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-white/70">
                      {p.amount} ج.م
                    </span>
                    <Badge
                      tone={
                        p.status === "APPROVED"
                          ? "success"
                          : p.status === "REJECTED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CenterPageShell>
  );
}
