import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createPrismaAdminOverviewRepository } from "@/modules/admin/prisma-admin-overview-repository";
import { Users, Globe, CreditCard, TrendingUp, ArrowLeft, Plus, ExternalLink, UserCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireSuperAdminSession();

  const repository = createPrismaAdminOverviewRepository(prisma);
  const metrics = await repository.getMetrics(new Date());

  const [totalTenants, totalUsers] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);

  const recentCustomers = await prisma.tenant.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      displayName: true,
      status: true,
      createdAt: true,
      owner: { select: { email: true, name: true } },
      _count: { select: { sites: true } },
    },
  });

  const pendingPayments = await prisma.paymentRequest.findMany({
    where: { status: "PENDING", deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      amount: true,
      method: true,
      createdAt: true,
      tenant: { select: { displayName: true } },
    },
  });

  const metricCards = [
    { label: "إجمالي العملاء", value: totalTenants, icon: Users, href: "/admin/customers" },
    { label: "المواقع النشطة", value: metrics.activeSites, icon: Globe, href: "/admin/sites" },
    { label: "المستخدمين", value: totalUsers, icon: TrendingUp, href: "/admin/analytics" },
    { label: "المدفوعات المعلقة", value: metrics.pendingPayments, icon: CreditCard, href: "/admin/payments" },
  ];

  const startCards = [
    { label: "إضافة عميل جديد", desc: "تسجيل عميل جديد في المنصة", icon: UserCheck, href: "/admin/customers/new" },
    { label: "عرض المواقع", desc: "إدارة ومشاهدة جميع المواقع", icon: Globe, href: "/admin/sites" },
    { label: "الاشتراكات", desc: "إدارة خطط الاشتراك", icon: CreditCard, href: "/admin/subscriptions" },
    { label: "التقارير", desc: "تحليلات وإحصائيات المنصة", icon: TrendingUp, href: "/admin/analytics" },
  ];

  return (
    <AdminPageShell
      badge="لوحة القيادة"
      title="مركز القيادة"
      description="نظرة عامة على المنصة وإدارة جميع العمليات من مكان واحد"
    >
      {/* Hero Panel */}
      <div className="admin-hero-panel">
        <div>
          <span className="eyebrow" style={{ color: "#f3cf73", fontSize: "0.78rem", fontWeight: 950 }}>
            لوحة تحكم FrameID
          </span>
          <h1>مرحباً، {session.user.name}</h1>
          <p>نظرة عامة على أداء المنصة وإدارة جميع العمليات بسلاسة</p>
          <div className="admin-hero-actions" style={{ marginTop: 16 }}>
            <Link href="/admin/customers/new" className="btn-gold">
              <Plus size={17} />
              عميل جديد
            </Link>
            <Link href="/admin/sites" className="btn-soft">
              <ExternalLink size={17} />
              استعراض المواقع
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="admin-metrics-grid">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href ?? "#"} className="admin-metric-card">
              <Icon size={18} />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              {card.label === "المدفوعات المعلقة" && metrics.monthlyRevenue > 0 && (
                <small>↑ {metrics.monthlyRevenue.toLocaleString()} {metrics.currency} هذا الشهر</small>
              )}
            </Link>
          );
        })}
      </div>

      {/* Start Grid */}
      <div className="admin-start-grid">
        {startCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="admin-start-card">
              <Icon size={18} />
              <span>
                <strong>{card.label}</strong>
                <small>{card.desc}</small>
              </span>
              <ArrowLeft size={16} />
            </Link>
          );
        })}
      </div>

      {/* Recent Items */}
      <div className="admin-home-grid">
        {/* Recent Customers */}
        <div style={{ border: "1px solid rgba(245, 234, 214, 0.09)", borderRadius: 14, background: "rgba(255, 255, 255, 0.035)", display: "grid", alignContent: "start", gap: 12, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, color: "#fff7e8", fontSize: "0.95rem" }}>أحدث العملاء</h3>
            <Link href="/admin/customers" style={{ color: "rgba(243, 207, 115, 0.8)", fontSize: "0.78rem", fontWeight: 900, textDecoration: "none" }}>
              عرض الكل
            </Link>
          </div>
          {recentCustomers.length > 0 ? (
            <div className="admin-compact-list">
              {recentCustomers.map((c) => (
                <Link key={c.id} href={`/admin/customers/${c.id}`} className="admin-compact-row">
                  <span>
                    <strong>{c.displayName}</strong>
                    <small>{c.owner.email}</small>
                  </span>
                  <span style={{ color: "rgba(245, 234, 214, 0.48)", fontSize: "0.78rem", fontWeight: 900 }}>
                    {c._count.sites} مواقع
                  </span>
                  <AdminStatusBadge tone={c.status === "ACTIVE" ? "success" : c.status === "SUSPENDED" ? "danger" : "default"}>
                    {c.status}
                  </AdminStatusBadge>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: "rgba(245, 234, 214, 0.45)", fontSize: "0.85rem" }}>لا يوجد عملاء بعد</p>
          )}
        </div>

        {/* Pending Payments */}
        <div style={{ border: "1px solid rgba(245, 234, 214, 0.09)", borderRadius: 14, background: "rgba(255, 255, 255, 0.035)", display: "grid", alignContent: "start", gap: 12, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, color: "#fff7e8", fontSize: "0.95rem" }}>المدفوعات المعلقة</h3>
            <Link href="/admin/payments" style={{ color: "rgba(243, 207, 115, 0.8)", fontSize: "0.78rem", fontWeight: 900, textDecoration: "none" }}>
              عرض الكل
            </Link>
          </div>
          {pendingPayments.length > 0 ? (
            <div className="admin-compact-list">
              {pendingPayments.map((p) => (
                <div key={p.id} className="admin-compact-row" style={{ cursor: "default" }}>
                  <span>
                    <strong>{p.tenant.displayName}</strong>
                    <small>{p.amount.toLocaleString()} ج.م · {p.method}</small>
                  </span>
                  <AdminStatusBadge tone="warning">قيد المراجعة</AdminStatusBadge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "rgba(245, 234, 214, 0.45)", fontSize: "0.85rem" }}>لا توجد مدفوعات معلقة</p>
          )}
        </div>
      </div>

      {/* Session Info */}
      <div style={{ border: "1px solid rgba(245, 234, 214, 0.08)", borderRadius: 14, background: "rgba(255, 255, 255, 0.025)", padding: 14 }}>
        <p style={{ margin: 0, color: "rgba(245, 234, 214, 0.54)", fontSize: "0.82rem", fontWeight: 850 }}>
          مرحباً {session.user.name} · صلاحياتك: <span style={{ color: "#f3cf73" }}>{session.user.role}</span>
        </p>
      </div>
    </AdminPageShell>
  );
}
