import { ArrowLeft, BadgeCheck, Boxes, Clock3, Compass, CreditCard, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { ServicesEventBeacon } from "@/components/services/services-event-beacon";
import { TrackedServiceLink } from "@/components/services/tracked-service-link";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { getCustomerCatalogReadModel } from "@/modules/services-platform/prisma-catalog-repository";
import { buildPrismaEligibilityContext } from "@/modules/services-platform/prisma-eligibility-context";
import { getTenantRecommendations } from "@/modules/services-platform/prisma-recommendations";
import { cancelServiceSubscriptionAction, dismissServiceRecommendationAction } from "./actions";

const views = [
  { key: "my", label: "خدماتي", icon: Boxes },
  { key: "discover", label: "اكتشف", icon: Compass },
  { key: "requests", label: "الطلبات", icon: Clock3 },
  { key: "billing", label: "الفوترة", icon: CreditCard },
] as const;

const statusAr: Record<string, string> = {
  DRAFT: "مسودة", REQUESTED: "تم الطلب", QUALIFYING: "قيد المراجعة", ACCEPTED: "مقبول",
  AWAITING_PAYMENT: "بانتظار الدفع", PAID: "تم الدفع", FULFILLING: "قيد التنفيذ",
  FULFILLED: "مكتمل", DECLINED: "مرفوض", CANCELLED: "ملغي", REFUNDED: "مسترد",
  ACTIVE: "مفعّلة", PROVISIONING: "جارٍ التفعيل", SUSPENDED: "معلّقة", EXPIRED: "منتهية",
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export const dynamic = "force-dynamic";

export default async function ServiceCenterPage({ searchParams }: { searchParams: Promise<{ view?: string; error?: string; trial?: string; subscription?: string }> }) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");
  const params = await searchParams;
  const activeView = views.some((view) => view.key === params.view) ? params.view! : "my";
  const now = new Date();
  const [eligibilityContext, activeProducts, acquisitions, subscriptions, trials] = await Promise.all([
    buildPrismaEligibilityContext(prisma, session.tenant.id, now),
    prisma.productInstance.findMany({
      where: { tenantId: session.tenant.id, status: { in: ["PROVISIONING", "ACTIVE", "SUSPENDED", "EXPIRED"] } },
      include: { product: { select: { code: true, name: true, shortDescription: true, category: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.acquisition.findMany({
      where: { tenantId: session.tenant.id },
      include: {
        offering: { select: { code: true, name: true, product: { select: { code: true } } } },
        paymentRequests: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.serviceSubscription.findMany({
      where: { tenantId: session.tenant.id },
      include: { offering: { select: { name: true, code: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.trialGrant.findMany({
      where: { tenantId: session.tenant.id },
      include: { offering: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const shownCatalog = await getCustomerCatalogReadModel(prisma, {
    context: eligibilityContext,
    marketCode: eligibilityContext.country ?? "EG",
    currency: "EGP",
    now,
  });
  const ownedOfferingIds = [
    ...acquisitions.filter((item) => item.status === "FULFILLED").map((item) => item.offeringId),
    ...subscriptions.filter((item) => ["ACTIVE", "TRIALING", "GRACE_PERIOD"].includes(item.status)).map((item) => item.offeringId),
    ...trials.filter((item) => item.status === "ACTIVE").map((item) => item.offeringId),
  ];
  const recommendations = await getTenantRecommendations(prisma, {
    context: {
      ...eligibilityContext,
      ownedOfferingIds,
      dismissedRuleKeys: [],
    },
    placement: "service_center",
    limit: 4,
    now,
  });

  return (
    <div className="grid gap-5" dir="rtl">
      <ServicesEventBeacon event={{ name: "catalog.viewed", idempotencyKey: `catalog:${session.tenant.id}:${now.toISOString().slice(0, 10)}` }} />
      <header className="overflow-hidden rounded-[1.8rem] border border-amber-300/18 bg-[radial-gradient(circle_at_top_left,rgba(243,207,115,0.18),transparent_38%),rgba(255,255,255,0.035)] p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[0.68rem] font-black text-[#f3cf73]"><Sparkles className="size-3.5" /> FrameID Services</span>
            <h1 className="mt-3 text-2xl font-black text-[#fff7e8] sm:text-4xl">مركز الخدمات</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/48">اكتشف منتجات FrameID، تابع طلبات التنفيذ، وأدر خدماتك واشتراكاتك من مكان واحد.</p>
          </div>
          <Link href="/dashboard/communication" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-white/70 no-underline hover:border-amber-300/25 hover:text-white"><MessageCircle className="size-4" /> مركز التواصل</Link>
        </div>
      </header>

      {params.error ? <div role="alert" className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{params.error}</div> : null}
      {params.trial === "started" ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">بدأت التجربة بنجاح.</div> : null}
      {params.subscription === "cancelled" ? <div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm font-bold text-blue-100">تم إيقاف التجديد التلقائي، وسيظل الاشتراك فعالًا حتى نهاية فترته الحالية.</div> : null}

      <nav className="grid grid-cols-4 gap-1 rounded-2xl border border-white/8 bg-white/[0.025] p-1.5" aria-label="أقسام مركز الخدمات">
        {views.map((view) => {
          const Icon = view.icon;
          return <Link key={view.key} href={`/dashboard/service-center?view=${view.key}`} className={`grid min-h-14 place-items-center gap-1 rounded-xl px-2 text-center text-[0.68rem] font-black no-underline transition sm:flex sm:min-h-12 sm:text-sm ${activeView === view.key ? "bg-[#f3cf73] text-[#17130a]" : "text-white/48 hover:bg-white/[0.05] hover:text-white"}`}><Icon className="size-4" />{view.label}</Link>;
        })}
      </nav>

      {activeView === "my" ? (
        <section className="grid gap-4">
          <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black text-[#f3cf73]">المفعّل الآن</p><h2 className="mt-1 text-xl font-black text-[#fff7e8]">منتجاتك وخدماتك</h2></div><span className="text-xs font-bold text-white/35">{activeProducts.length + subscriptions.length + trials.length} عناصر</span></div>
          {activeProducts.length === 0 && subscriptions.length === 0 && trials.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.025] p-7 text-center"><Boxes className="mx-auto size-8 text-white/28" /><h3 className="mt-3 font-black text-white">لا توجد خدمات مفعلة بعد</h3><p className="mt-2 text-sm font-bold text-white/42">ابدأ من قسم اكتشف واختر ما يناسب عملك.</p><Link href="/dashboard/service-center?view=discover" className="mt-4 inline-flex rounded-xl bg-[#f3cf73] px-4 py-2 text-sm font-black text-[#17130a] no-underline">اكتشف الخدمات</Link></div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {activeProducts.map((instance) => <article key={instance.id} className="rounded-[1.5rem] border border-emerald-300/16 bg-emerald-400/[0.055] p-5"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-200"><BadgeCheck className="size-5" /></span><span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.65rem] font-black text-white/55">{statusAr[instance.status] ?? instance.status}</span></div><h3 className="mt-4 text-lg font-black text-white">{instance.product.name}</h3><p className="mt-1 text-sm font-bold leading-6 text-white/42">{instance.product.shortDescription}</p><p className="mt-4 text-xs font-bold text-white/32">Instance: {instance.instanceKey}</p></article>)}
              {subscriptions.map((subscription) => <article key={subscription.id} className="rounded-[1.5rem] border border-blue-300/16 bg-blue-400/[0.05] p-5"><p className="text-xs font-black text-blue-200">اشتراك</p><h3 className="mt-2 text-lg font-black text-white">{subscription.offering.name}</h3><p className="mt-2 text-sm font-bold text-white/42">{statusAr[subscription.status] ?? subscription.status} · حتى {subscription.currentPeriodEnd.toLocaleDateString("ar-EG")}</p></article>)}
              {trials.map((trial) => <article key={trial.id} className="rounded-[1.5rem] border border-violet-300/16 bg-violet-400/[0.05] p-5"><p className="text-xs font-black text-violet-200">تجربة</p><h3 className="mt-2 text-lg font-black text-white">{trial.offering.name}</h3><p className="mt-2 text-sm font-bold text-white/42">{statusAr[trial.status] ?? trial.status}{trial.endsAt ? ` · تنتهي ${trial.endsAt.toLocaleDateString("ar-EG")}` : ""}</p></article>)}
            </div>
          )}
        </section>
      ) : null}

      {activeView === "discover" ? (
        <section className="grid gap-5">
          {recommendations.length ? <div className="grid gap-3 rounded-[1.5rem] border border-violet-300/12 bg-violet-400/[0.035] p-5"><div><p className="text-xs font-black text-violet-200">مقترحة حسب استخدامك</p><h2 className="mt-1 text-lg font-black text-white">خطوات منطقية تنمّي شغلك</h2></div><div className="grid gap-2 md:grid-cols-2">{recommendations.map((decision) => <article key={decision.id} className="rounded-xl border border-white/8 bg-black/10 p-4"><ServicesEventBeacon event={{ name: "recommendation.shown", idempotencyKey: `rec-shown:${decision.attributionId}`, offeringId: decision.offeringId, attributionId: decision.attributionId }} /><p className="text-[0.65rem] font-black text-violet-200">{Array.isArray(decision.reasonCodes) ? decision.reasonCodes.join(" · ") : "مناسب لك"}</p><h3 className="mt-2 font-black text-white">{decision.offering.name}</h3><p className="mt-1 text-xs font-bold text-white/35">{decision.offering.product?.name ?? "خدمة FrameID"}</p><div className="mt-3 flex gap-2"><TrackedServiceLink href={`/dashboard/service-center/${decision.offering.product?.code ?? ""}?attribution=${encodeURIComponent(decision.attributionId)}`} event={{ name: "recommendation.clicked", idempotencyKey: `rec-click:${decision.attributionId}`, offeringId: decision.offeringId, attributionId: decision.attributionId }} className="flex-1 rounded-lg bg-violet-400/12 px-3 py-2 text-center text-xs font-black text-violet-100 no-underline">اعرف المزيد</TrackedServiceLink><form action={dismissServiceRecommendationAction}><input type="hidden" name="attributionId" value={decision.attributionId} /><button className="rounded-lg border border-white/8 px-3 py-2 text-xs font-black text-white/35">ليس الآن</button></form></div></article>)}</div></div> : null}
          {shownCatalog.featured.length ? <div><p className="text-xs font-black text-[#f3cf73]">مختارة لك</p><h2 className="mt-1 text-xl font-black text-white">ابدأ بالخطوة التالية</h2></div> : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shownCatalog.products.map((product) => {
              const offering = product.offerings[0];
              return <article key={product.id} className="group flex min-h-[17rem] flex-col rounded-[1.6rem] border border-white/9 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-amber-300/22 hover:bg-amber-300/[0.055]"><div className="flex items-center justify-between gap-2"><span className="text-[0.65rem] font-black uppercase tracking-wider text-white/32">{product.category}</span><div className="flex gap-1.5">{product.beta ? <span className="rounded-full bg-violet-400/12 px-2 py-1 text-[0.62rem] font-black text-violet-200">Beta</span> : null}{product.comingSoon ? <span className="rounded-full bg-blue-400/12 px-2 py-1 text-[0.62rem] font-black text-blue-200">قريبًا</span> : null}{product.featured ? <span className="rounded-full bg-amber-300/12 px-2 py-1 text-[0.62rem] font-black text-[#f3cf73]">مقترح</span> : null}</div></div><h3 className="mt-4 text-xl font-black text-[#fff7e8]">{product.name}</h3><p className="mt-2 line-clamp-3 text-sm font-bold leading-6 text-white/43">{product.shortDescription}</p><div className="mt-auto pt-5"><div className="mb-3 flex items-end justify-between gap-3"><span className="text-xs font-bold text-white/35">{offering?.displayPrice ? "يبدأ من" : product.comingSoon ? "قيد التطوير" : "حسب الطلب"}</span>{offering?.displayPrice ? <strong className="text-lg font-black text-[#f3cf73]">{money(offering.displayPrice.amount, offering.displayPrice.currency)}</strong> : null}</div><Link href={`/dashboard/service-center/${product.code}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-black text-white no-underline transition group-hover:border-amber-300/25 group-hover:bg-[#f3cf73] group-hover:text-[#17130a]">عرض التفاصيل <ArrowLeft className="size-4" /></Link></div></article>;
            })}
          </div>
          {shownCatalog.comingSoon.length ? <div className="rounded-[1.5rem] border border-blue-300/12 bg-blue-400/[0.04] p-5"><p className="text-xs font-black text-blue-200">على الطريق</p><h3 className="mt-1 font-black text-white">منتجات قادمة</h3><p className="mt-2 text-sm font-bold text-white/42">{shownCatalog.comingSoon.map((product) => product.name).join(" · ")}</p></div> : null}
        </section>
      ) : null}

      {activeView === "requests" ? (
        <section className="grid gap-3"><div><p className="text-xs font-black text-[#f3cf73]">سجل موحّد</p><h2 className="mt-1 text-xl font-black text-white">طلبات الخدمات</h2></div>{acquisitions.length ? acquisitions.map((acquisition) => <Link key={acquisition.id} href={`/dashboard/service-center/acquisitions/${acquisition.id}`} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 no-underline transition hover:border-amber-300/20"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-[#f3cf73]"><Clock3 className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-black text-white">{acquisition.offering.name}</strong><small className="mt-1 block text-xs font-bold text-white/35">{acquisition.createdAt.toLocaleDateString("ar-EG")} · #{acquisition.id.slice(-6)}</small></span><span className="rounded-full bg-white/[0.055] px-2.5 py-1 text-[0.65rem] font-black text-white/55">{statusAr[acquisition.status] ?? acquisition.status}</span><ArrowLeft className="size-4 text-white/25" /></Link>) : <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm font-bold text-white/40">لا توجد طلبات بعد.</p>}</section>
      ) : null}

      {activeView === "billing" ? (
        <section className="grid gap-5"><div><p className="text-xs font-black text-[#f3cf73]">ماليّات الخدمات</p><h2 className="mt-1 text-xl font-black text-white">الاشتراكات والمدفوعات</h2></div><div className="grid gap-3 md:grid-cols-2">{subscriptions.map((subscription) => <article key={subscription.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"><p className="text-xs font-black text-blue-200">اشتراك مستقل</p><h3 className="mt-2 font-black text-white">{subscription.offering.name}</h3><p className="mt-2 text-sm font-bold text-white/42">{statusAr[subscription.status] ?? subscription.status}</p><p className="mt-1 text-xs font-bold text-white/30">الفترة الحالية حتى {subscription.currentPeriodEnd.toLocaleDateString("ar-EG")}</p>{subscription.cancelAtPeriodEnd ? <p className="mt-3 rounded-lg bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100">لن يتجدد بعد نهاية الفترة.</p> : ["ACTIVE", "TRIALING", "GRACE_PERIOD"].includes(subscription.status) ? <form action={cancelServiceSubscriptionAction} className="mt-3"><input type="hidden" name="subscriptionId" value={subscription.id} /><button className="rounded-lg border border-red-300/15 px-3 py-2 text-xs font-black text-red-100/75">إيقاف التجديد</button></form> : null}</article>)}{acquisitions.flatMap((acquisition) => acquisition.paymentRequests.map((payment) => <Link href={`/dashboard/service-center/acquisitions/${acquisition.id}`} key={payment.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 no-underline"><p className="text-xs font-black text-[#f3cf73]">دفعة خدمة</p><h3 className="mt-2 font-black text-white">{acquisition.offering.name}</h3><p className="mt-2 text-sm font-bold text-white/42">{money(payment.amount, payment.currency)} · {statusAr[payment.status] ?? payment.status}</p></Link>))}</div>{subscriptions.length === 0 && acquisitions.every((item) => item.paymentRequests.length === 0) ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm font-bold text-white/40">لا توجد عمليات فوترة خاصة بالخدمات.</p> : null}</section>
      ) : null}
    </div>
  );
}
