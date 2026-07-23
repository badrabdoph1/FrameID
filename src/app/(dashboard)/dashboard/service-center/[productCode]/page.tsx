import { randomUUID } from "node:crypto";

import { ArrowRight, BadgeCheck, Boxes, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { ServicesEventBeacon } from "@/components/services/services-event-beacon";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { getCustomerCatalogReadModel } from "@/modules/services-platform/prisma-catalog-repository";
import { buildPrismaEligibilityContext } from "@/modules/services-platform/prisma-eligibility-context";
import { requestServiceOfferingAction, startServiceTrialAction } from "../actions";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

const ctaLabel: Record<string, string> = {
  BUY: "ابدأ الآن", REQUEST: "اطلب الخدمة", REQUEST_QUOTE: "اطلب عرض سعر", CONTACT: "تواصل معنا",
  JOIN_BETA: "انضم إلى Beta", REQUEST_ACCESS: "اطلب الوصول", COMING_SOON: "قريبًا",
};

export const dynamic = "force-dynamic";

export default async function ServiceProductPage({ params, searchParams }: { params: Promise<{ productCode: string }>; searchParams: Promise<{ attribution?: string }> }) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");
  const { productCode } = await params;
  const query = await searchParams;
  const [eligibilityContext, source] = await Promise.all([
    buildPrismaEligibilityContext(prisma, session.tenant.id),
    prisma.productDefinition.findFirst({
      where: { code: productCode, publicationStatus: "PUBLISHED", deletedAt: null },
      include: {
        offerings: {
          where: { publicationStatus: "PUBLISHED", deletedAt: null },
          include: {
            capabilities: { include: { capability: true } },
            bundleComponents: { include: { componentOffering: { select: { name: true, code: true } } }, orderBy: { sortOrder: "asc" } },
            trialPolicies: { where: { isActive: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);
  if (!source) notFound();
  const catalog = await getCustomerCatalogReadModel(prisma, {
    context: eligibilityContext,
    marketCode: eligibilityContext.country ?? "EG",
    currency: "EGP",
  });
  const product = catalog.products.find((item) => item.code === productCode);
  if (!product) notFound();

  return (
    <div className="grid gap-5" dir="rtl">
      <ServicesEventBeacon event={{ name: "offering.viewed", idempotencyKey: `product-view:${source.id}:${session.tenant.id}:${new Date().toISOString().slice(0, 10)}`, productId: source.id, attributionId: query.attribution }} />
      <Link href="/dashboard/service-center?view=discover" className="inline-flex w-fit items-center gap-2 text-xs font-black text-white/45 no-underline hover:text-[#f3cf73]"><ArrowRight className="size-4" /> العودة إلى الاكتشاف</Link>
      <header className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(243,207,115,0.2),transparent_38%),rgba(255,255,255,0.035)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/[0.06] px-3 py-1 text-[0.68rem] font-black text-white/50">{product.category}</span>{product.beta ? <span className="rounded-full bg-violet-400/12 px-3 py-1 text-[0.68rem] font-black text-violet-200">Beta</span> : null}{product.comingSoon ? <span className="rounded-full bg-blue-400/12 px-3 py-1 text-[0.68rem] font-black text-blue-200">قريبًا</span> : null}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><h1 className="text-3xl font-black text-[#fff7e8] sm:text-5xl">{product.name}</h1><p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/50 sm:text-base">{product.description || product.shortDescription}</p></div><span className="grid size-16 place-items-center rounded-[1.4rem] border border-amber-300/18 bg-amber-300/10 text-[#f3cf73]"><Sparkles className="size-7" /></span></div>
      </header>

      <section className="grid gap-4">
        <div><p className="text-xs font-black text-[#f3cf73]">طرق الحصول على المنتج</p><h2 className="mt-1 text-xl font-black text-white">اختر العرض المناسب</h2></div>
        <div className="grid gap-4 lg:grid-cols-2">
          {product.offerings.map((offering) => {
            const sourceOffering = source.offerings.find((item) => item.id === offering.id);
            const trial = sourceOffering?.trialPolicies[0];
            return <article key={offering.id} className="flex flex-col rounded-[1.6rem] border border-white/9 bg-white/[0.035] p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[0.65rem] font-black uppercase tracking-wider text-white/30">{offering.type.replaceAll("_", " ")}</p><h3 className="mt-2 text-xl font-black text-white">{offering.name}</h3></div>{offering.displayPrice ? <strong className="whitespace-nowrap text-lg font-black text-[#f3cf73]">{money(offering.displayPrice.amount, offering.displayPrice.currency)}</strong> : null}</div><p className="mt-3 text-sm font-bold leading-6 text-white/43">{offering.description || offering.shortDescription}</p>
              <div className="mt-5 grid gap-2">{sourceOffering?.capabilities.map((item) => <div key={item.id} className="flex items-center gap-2 text-sm font-bold text-white/55"><BadgeCheck className="size-4 text-emerald-300" /><span>{item.capability.name}</span><span className="mr-auto text-xs text-white/30">{typeof item.value === "number" ? item.value : ""}</span></div>)}{sourceOffering?.bundleComponents.map((item) => <div key={item.id} className="flex items-center gap-2 text-sm font-bold text-white/55"><Boxes className="size-4 text-blue-300" />{item.componentOffering.name}</div>)}</div>
              <div className="mt-auto grid gap-2 pt-6">{trial ? <form action={startServiceTrialAction}><input type="hidden" name="policyId" value={trial.id} /><button className="min-h-11 w-full rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 text-sm font-black text-violet-100 hover:bg-violet-400/16" type="submit">جرّب مجانًا {trial.durationDays ? `${trial.durationDays} يومًا` : ""}</button></form> : null}{offering.ctaMode === "COMING_SOON" ? <span className="grid min-h-11 place-items-center rounded-xl border border-blue-300/15 bg-blue-400/8 text-sm font-black text-blue-100"><Clock3 className="ml-2 inline size-4" /> قريبًا</span> : <form action={requestServiceOfferingAction} className="grid gap-2"><input type="hidden" name="offeringId" value={offering.id} /><input type="hidden" name="attributionId" value={query.attribution ?? ""} /><input type="hidden" name="idempotencyKey" value={`product:${offering.id}:${session.user.id}:${randomUUID()}`} /><textarea name="customerMessage" rows={2} className="w-full resize-none rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-300/35" placeholder="اكتب أي تفاصيل تساعدنا (اختياري)" /><button type="submit" disabled={!offering.eligible} className="min-h-12 rounded-xl bg-[#f3cf73] px-4 text-sm font-black text-[#17130a] transition hover:bg-[#ffe39a] disabled:cursor-not-allowed disabled:opacity-40">{ctaLabel[offering.ctaMode] ?? "اطلب الآن"}</button></form>}</div>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}
