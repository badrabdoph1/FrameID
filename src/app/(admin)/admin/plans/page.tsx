import { Archive, BadgeCheck, CreditCard, Pencil, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { archivePlanAction, savePlanAction, togglePlanAction } from "@/app/(admin)/admin/plans/actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; state?: string; saved?: string; toggled?: string; archived?: string; error?: string }>;
};

function jsonValue(value: unknown): string {
  if (value == null) return "[]";
  return JSON.stringify(value, null, 2);
}

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString("ar-EG")} ${currency}`;
}

export default async function AdminPlansPage({ searchParams }: Props) {
  await requireAdminPermission("plans", "view");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const state = (params.state ?? "").trim();

  const where: Record<string, unknown> = { deletedAt: null };
  if (q) {
    const contains = { contains: q, mode: "insensitive" };
    where.OR = [{ code: contains }, { name: contains }, { currency: contains }, { billingInterval: contains }];
  }
  if (state === "active") where.isActive = true;
  if (state === "inactive") where.isActive = false;

  const [plans, totalPlans, activePlans, subscriptionCount, paymentCount] = await Promise.all([
    prisma.plan.findMany({
      where: where as never,
      orderBy: [{ isActive: "desc" }, { priceAmount: "asc" }],
      include: { _count: { select: { subscriptions: true, paymentRequests: true } } },
    }),
    prisma.plan.count({ where: { deletedAt: null } }),
    prisma.plan.count({ where: { deletedAt: null, isActive: true } }),
    prisma.subscription.count({ where: { deletedAt: null } }),
    prisma.paymentRequest.count({ where: { deletedAt: null } }),
  ]);

  const banner = params.error
    ? { tone: "danger", text: decodeURIComponent(params.error) }
    : params.saved
      ? { tone: "success", text: "تم حفظ الخطة بنجاح." }
      : params.toggled
        ? { tone: "success", text: "تم تغيير حالة الخطة." }
        : params.archived
          ? { tone: "success", text: "تم أرشفة الخطة." }
          : null;

  return (
    <AdminPageShell
      badge="Billing & Revenue"
      title="Plans Manager"
      description="إدارة خطط الاشتراك والأسعار والميزات وربطها بطلبات الدفع والاشتراكات."
      breadcrumbs={[{ label: "الإدارة", href: "/admin" }, { label: "Plans" }]}
      actions={[{ label: "Payments", href: "/admin/payments", icon: CreditCard }, { label: "البحث", href: "/admin/search", icon: Search }]}
    >
      {banner ? <div className={banner.tone === "danger" ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300" : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"}>{banner.text}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="كل الخطط" value={totalPlans} />
        <Metric label="خطط فعالة" value={activePlans} accent />
        <Metric label="اشتراكات" value={subscriptionCount} />
        <Metric label="طلبات دفع" value={paymentCount} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <div className="grid h-fit gap-4">
          <div className="rounded-2xl border border-amber-500/15 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.12),transparent_35%),rgba(255,255,255,0.035)] p-4">
            <h2 className="flex items-center gap-2 text-sm font-black text-[#fff7e8]"><Plus className="size-4 text-amber-300" /> إنشاء أو تحديث خطة</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/45">استخدم نفس code لتحديث خطة موجودة بدل إنشاء واحدة مكررة.</p>
            <PlanForm />
          </div>

          <form action="/admin/plans" className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <h2 className="mb-3 text-sm font-black text-[#fff7e8]">فلاتر</h2>
            <div className="grid gap-3">
              <input name="q" defaultValue={q} placeholder="بحث بالاسم أو الكود" className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
              <select name="state" defaultValue={state} className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-amber-400/40">
                <option value="">كل الحالات</option>
                <option value="active">فعالة</option>
                <option value="inactive">متوقفة</option>
              </select>
              <button className="h-10 rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white">تطبيق</button>
            </div>
          </form>
        </div>

        <div className="grid gap-3">
          {plans.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-16 text-center">
              <BadgeCheck className="mb-3 size-10 text-white/20" />
              <h2 className="text-lg font-black text-white/75">لا توجد خطط مطابقة</h2>
              <p className="mt-1 max-w-xl text-sm font-bold leading-7 text-white/42">أنشئ خطة جديدة أو عدّل الفلاتر.</p>
            </div>
          ) : plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      </section>
    </AdminPageShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className={accent ? "text-2xl font-black text-amber-200" : "text-2xl font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </div>
  );
}

function PlanForm({ plan }: { plan?: { id: string; code: string; name: string; priceAmount: number; currency: string; billingInterval: string; features: unknown; isActive: boolean } }) {
  return (
    <form action={savePlanAction} className="mt-4 grid gap-3">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="code" required defaultValue={plan?.code ?? ""} placeholder="pro-monthly" className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 font-mono text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
        <input name="name" required defaultValue={plan?.name ?? ""} placeholder="Pro Monthly" className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="priceAmount" required type="number" min="0" defaultValue={plan?.priceAmount ?? 0} placeholder="999" className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
        <input name="currency" defaultValue={plan?.currency ?? "EGP"} placeholder="EGP" className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
        <input name="billingInterval" defaultValue={plan?.billingInterval ?? "monthly"} placeholder="monthly" className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" />
      </div>
      <textarea name="features" rows={plan ? 4 : 3} defaultValue={plan ? jsonValue(plan.features) : "[]"} className="resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs font-bold leading-5 text-white outline-none placeholder:text-white/25 focus:border-amber-400/40" dir="ltr" />
      <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white/60">
        <input name="isActive" type="checkbox" defaultChecked={plan?.isActive ?? true} />
        خطة فعالة
      </label>
      <button className="h-10 rounded-xl border border-amber-500/35 bg-amber-500/12 text-sm font-black text-amber-200 transition hover:bg-amber-500/20">{plan ? "حفظ التعديل" : "حفظ الخطة"}</button>
    </form>
  );
}

function PlanCard({ plan }: { plan: { id: string; code: string; name: string; priceAmount: number; currency: string; billingInterval: string; features: unknown; isActive: boolean; _count: { subscriptions: number; paymentRequests: number } } }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-[#fff7e8]">{plan.name}</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[0.68rem] font-black text-white/45">{plan.code}</span>
            <span className={plan.isActive ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[0.68rem] font-black text-emerald-300" : "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.68rem] font-black text-white/35"}>{plan.isActive ? "فعالة" : "متوقفة"}</span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-200">{formatMoney(plan.priceAmount, plan.currency)} <span className="text-xs text-white/38">/ {plan.billingInterval}</span></p>
          <p className="mt-1 text-xs font-bold text-white/38">{plan._count.subscriptions} اشتراك · {plan._count.paymentRequests} طلب دفع</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <form action={togglePlanAction}>
            <input type="hidden" name="id" value={plan.id} />
            <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 text-xs font-black text-amber-200 transition hover:bg-amber-500/20">
              {plan.isActive ? <ToggleLeft className="size-4" /> : <ToggleRight className="size-4" />}
              {plan.isActive ? "إيقاف" : "تفعيل"}
            </button>
          </form>
          <form action={archivePlanAction}>
            <input type="hidden" name="id" value={plan.id} />
            <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 text-xs font-black text-red-300 transition hover:bg-red-500/20">
              <Archive className="size-4" /> أرشفة
            </button>
          </form>
        </div>
      </div>
      <pre className="mt-4 max-h-52 overflow-auto rounded-xl border border-white/8 bg-black/22 p-3 text-left text-[11px] leading-5 text-white/55" dir="ltr">{jsonValue(plan.features)}</pre>
      <details className="mt-4 rounded-xl border border-white/8 bg-black/12 p-3">
        <summary className="flex cursor-pointer items-center gap-2 text-xs font-black text-white/42"><Pencil className="size-3" /> تعديل متقدم</summary>
        <PlanForm plan={plan} />
      </details>
    </article>
  );
}
