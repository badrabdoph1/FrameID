import { Activity, BadgeCheck, Boxes, CalendarClock, ClipboardList, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { saveServicesProductAction } from "./actions";

const statusAr: Record<string, string> = { DRAFT: "مسودة", IN_REVIEW: "قيد المراجعة", PUBLISHED: "منشور", PAUSED: "متوقف", RETIRED: "مؤرشف", ANNOUNCED: "قريبًا", PRIVATE_PREVIEW: "معاينة خاصة", BETA: "Beta", GA: "متاح" };

export const dynamic = "force-dynamic";

export default async function AdminServicesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdminPermission("services", "view");
  const query = await searchParams;
  const [products, acquisitionCount, openFulfillment, activeEntitlements, activeSubscriptions] = await Promise.all([
    prisma.productDefinition.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { offerings: true, productInstances: true, entitlements: true } } },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.acquisition.count(),
    prisma.fulfillmentRun.count({ where: { status: { in: ["PENDING", "RUNNING", "WAITING_CUSTOMER", "WAITING_INTERNAL", "READY", "FAILED"] } } }),
    prisma.entitlement.count({ where: { status: "ACTIVE", OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] } }),
    prisma.serviceSubscription.count({ where: { status: { in: ["TRIALING", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] } } }),
  ]);

  const links = [
    { href: "/admin/services/acquisitions", label: "الطلبات", icon: ClipboardList, value: acquisitionCount },
    { href: "/admin/services/fulfillment", label: "التنفيذ", icon: Activity, value: openFulfillment },
    { href: "/admin/services/entitlements", label: "الاستحقاقات", icon: BadgeCheck, value: activeEntitlements },
    { href: "/admin/services/subscriptions", label: "الاشتراكات", icon: CalendarClock, value: activeSubscriptions },
    { href: "/admin/services/recommendations", label: "الترشيحات", icon: Sparkles, value: null },
  ];

  return (
    <div className="grid gap-6" dir="rtl">
      <header className="rounded-[1.7rem] border border-amber-300/15 bg-[radial-gradient(circle_at_top_left,rgba(243,207,115,0.15),transparent_35%),rgba(255,255,255,0.03)] p-6"><p className="text-xs font-black text-[#f3cf73]">Product Ecosystem</p><h1 className="mt-2 text-3xl font-black text-white">منصة خدمات FrameID</h1><p className="mt-2 max-w-3xl text-sm font-bold leading-7 text-white/45">Product Registry وCatalog وطلبات التنفيذ والاستحقاقات في حدود معمارية مستقلة.</p></header>
      {query.error ? <div role="alert" className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{query.error}</div> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{links.map(({ href, label, icon: Icon, value }) => <Link key={href} href={href} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 no-underline transition hover:border-amber-300/20"><div className="flex items-center justify-between"><Icon className="size-5 text-[#f3cf73]" />{value != null ? <strong className="text-xl font-black text-white">{value}</strong> : null}</div><p className="mt-3 text-sm font-black text-white/65">{label}</p></Link>)}</div>

      <section className="grid gap-4"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black text-[#f3cf73]">Product Registry</p><h2 className="mt-1 text-xl font-black text-white">المنتجات المسجلة</h2></div><span className="text-xs font-bold text-white/35">{products.length} منتج</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <Link key={product.id} href={`/admin/services/products/${product.id}`} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/20"><div className="flex items-center justify-between gap-2"><span className="text-[0.65rem] font-black text-white/30">{product.code}</span><div className="flex gap-1"><span className="rounded-full bg-white/[0.055] px-2 py-1 text-[0.62rem] font-black text-white/55">{statusAr[product.publicationStatus]}</span><span className="rounded-full bg-blue-400/8 px-2 py-1 text-[0.62rem] font-black text-blue-100">{statusAr[product.releaseStage]}</span></div></div><h3 className="mt-4 text-lg font-black text-white">{product.name}</h3><p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-white/40">{product.shortDescription}</p><div className="mt-5 grid grid-cols-3 gap-2 text-center"><span className="rounded-xl bg-white/[0.035] p-2 text-[0.68rem] font-bold text-white/40"><strong className="block text-sm text-white/70">{product._count.offerings}</strong>عروض</span><span className="rounded-xl bg-white/[0.035] p-2 text-[0.68rem] font-bold text-white/40"><strong className="block text-sm text-white/70">{product._count.productInstances}</strong>Instances</span><span className="rounded-xl bg-white/[0.035] p-2 text-[0.68rem] font-bold text-white/40"><strong className="block text-sm text-white/70">{product._count.entitlements}</strong>حقوق</span></div></Link>)}</div></section>

      <details className="rounded-[1.5rem] border border-white/8 bg-white/[0.025] p-5"><summary className="flex cursor-pointer list-none items-center gap-2 font-black text-white"><Plus className="size-4 text-[#f3cf73]" /> تسجيل منتج جديد</summary><form action={saveServicesProductAction} className="mt-5 grid gap-3 md:grid-cols-2"><input required name="name" placeholder="اسم المنتج" className="admin-input" /><input required name="code" placeholder="product-code" dir="ltr" className="admin-input" /><input required name="registryKey" placeholder="Registry adapter key" dir="ltr" className="admin-input" /><input required name="category" placeholder="category" dir="ltr" className="admin-input" /><input required name="shortDescription" placeholder="وصف مختصر" className="admin-input md:col-span-2" /><textarea name="description" placeholder="الوصف الكامل" rows={3} className="admin-input md:col-span-2" /><input name="tags" placeholder="tags, comma, separated" dir="ltr" className="admin-input" /><select name="releaseStage" className="admin-input"><option value="ANNOUNCED">Coming Soon</option><option value="PRIVATE_PREVIEW">Private Preview</option><option value="BETA">Beta</option><option value="GA">GA</option></select><label className="flex items-center gap-2 text-sm font-bold text-white/55"><input type="checkbox" name="isFeatured" /> منتج مميز</label><button type="submit" className="min-h-11 rounded-xl bg-[#f3cf73] px-4 text-sm font-black text-[#17130a]"><Boxes className="ml-2 inline size-4" /> إنشاء كمسودة</button></form></details>
    </div>
  );
}
