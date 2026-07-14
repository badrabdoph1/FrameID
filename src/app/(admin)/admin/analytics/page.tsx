import Link from "next/link";
import { BadgeCheck, Banknote, BarChart3, Globe2 } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await requireAdminPermission("analytics", "view");
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const [customers, activeSubscriptions, publishedSites, revenue, newCustomers] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.subscription.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.site.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    prisma.paymentRequest.aggregate({ where: { deletedAt: null, status: "APPROVED", reviewedAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.tenant.count({ where: { deletedAt: null, createdAt: { gte: monthStart } } }),
  ]);
  const metrics = [
    { label: "كل العملاء", value: customers.toLocaleString("ar-EG"), href: "/admin/customers", icon: BarChart3 },
    { label: "اشتراكات نشطة", value: activeSubscriptions.toLocaleString("ar-EG"), href: "/admin/subscriptions?status=ACTIVE", icon: BadgeCheck },
    { label: "مواقع منشورة", value: publishedSites.toLocaleString("ar-EG"), href: "/admin/sites", icon: Globe2 },
    { label: "إيراد الشهر", value: `${(revenue._sum.amount ?? 0).toLocaleString("ar-EG")} ج.م`, href: "/admin/billing", icon: Banknote },
  ];
  return <AdminPageShell badge="النظام" title="مؤشرات المنصة" description="مؤشرات تشغيلية موثوقة من قاعدة البيانات الحالية، دون ادعاء تحليلات زوار غير مسجلة." breadcrumbs={[{ label: "النظام", href: "/admin/system" }, { label: "المؤشرات" }]}><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => { const Icon = metric.icon; return <Link key={metric.label} href={metric.href} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 no-underline transition hover:border-amber-300/25 hover:bg-amber-300/8"><Icon className="size-5 text-[#f3cf73]" /><p className="mt-3 text-xs font-black text-white/42">{metric.label}</p><p className="mt-1 text-2xl font-black text-[#fff7e8]">{metric.value}</p></Link>; })}</section><section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h2 className="font-black text-[#fff7e8]">هذا الشهر</h2><p className="mt-2 text-sm font-bold text-white/52">انضم {newCustomers.toLocaleString("ar-EG")} عميل جديد. تحليلات الزيارات والتحويل تتطلب نظام Analytics مستقلًا ولم يتم اختلاق أرقام لها هنا.</p></section></AdminPageShell>;
}
