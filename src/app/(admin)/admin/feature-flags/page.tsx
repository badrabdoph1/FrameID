import { Flag, Plus, Search, ShieldCheck, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  deleteFeatureFlagAction,
  saveFeatureFlagAction,
  toggleFeatureFlagAction,
} from "@/app/(admin)/admin/feature-flags/actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    scope?: string;
    state?: string;
    saved?: string;
    toggled?: string;
    deleted?: string;
    error?: string;
  }>;
};

type TenantOption = { id: string; displayName: string; status: string };
type SiteOption = { id: string; title: string; slug: string; tenant: { displayName: string } };

function jsonValue(value: unknown): string {
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
}

function formatDate(value: Date): string {
  return value.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scopeLabel(scope: string): string {
  switch (scope) {
    case "TENANT":
      return "عميل";
    case "SITE":
      return "موقع";
    default:
      return "منصة";
  }
}

export default async function AdminFeatureFlagsPage({ searchParams }: Props) {
  await requireAdminPermission("feature-flags", "view");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const scope = (params.scope ?? "").trim().toUpperCase();
  const state = (params.state ?? "").trim();

  const where: Record<string, unknown> = {};
  if (q) {
    const contains = { contains: q, mode: "insensitive" };
    where.OR = [
      { key: contains },
      { id: contains },
      { tenant: { displayName: contains } },
      { site: { title: contains } },
      { site: { slug: contains } },
    ];
  }
  if (scope === "PLATFORM" || scope === "TENANT" || scope === "SITE") where.scope = scope;
  if (state === "enabled") where.enabled = true;
  if (state === "disabled") where.enabled = false;

  const [flags, tenants, sites, totalFlags, enabledFlags, scopedFlags] = await Promise.all([
    prisma.featureFlag.findMany({
      where: where as never,
      orderBy: [{ enabled: "desc" }, { updatedAt: "desc" }],
      take: 100,
      include: {
        tenant: { select: { id: true, displayName: true, status: true } },
        site: { select: { id: true, title: true, slug: true, status: true, tenant: { select: { displayName: true } } } },
      },
    }),
    prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { displayName: "asc" },
      take: 100,
      select: { id: true, displayName: true, status: true },
    }),
    prisma.site.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
      take: 100,
      select: { id: true, title: true, slug: true, tenant: { select: { displayName: true } } },
    }),
    prisma.featureFlag.count(),
    prisma.featureFlag.count({ where: { enabled: true } }),
    prisma.featureFlag.count({ where: { scope: { in: ["TENANT", "SITE"] } } as never }),
  ]);

  const banner = params.error
    ? { tone: "danger", text: decodeURIComponent(params.error) }
    : params.saved
      ? { tone: "success", text: "تم حفظ Feature Flag بنجاح." }
      : params.toggled
        ? { tone: "success", text: "تم تغيير حالة Feature Flag." }
        : params.deleted
          ? { tone: "success", text: "تم حذف Feature Flag." }
          : null;

  return (
    <AdminPageShell
      badge="Security & Governance"
      title="Feature Flags Console"
      description="تحكم في تشغيل الميزات على مستوى المنصة أو عميل محدد أو موقع محدد مع Audit لكل تغيير."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "Feature Flags" }]}
      actions={[{ label: "Audit Explorer", href: "/admin/audit", icon: ShieldCheck }, { label: "البحث الشامل", href: "/admin/search", icon: Search }]}
    >
      {banner ? (
        <div className={banner.tone === "danger" ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300" : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"}>
          {banner.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="كل المفاتيح" value={totalFlags} />
        <MetricCard label="مفعلة" value={enabledFlags} accent />
        <MetricCard label="موجهة لعميل/موقع" value={scopedFlags} />
        <MetricCard label="المعروض الآن" value={flags.length} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <div className="grid h-fit gap-4">
          <div className="rounded-2xl border border-amber-500/15 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.12),transparent_35%),rgba(255,255,255,0.035)] p-4">
            <h2 className="flex items-center gap-2 text-sm font-black text-[#fff7e8]"><Plus className="size-4 text-amber-300" /> إنشاء أو تحديث مفتاح</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/45">لو المفتاح موجود بنفس النطاق سيتم تحديثه بدل إنشاء نسخة مكررة.</p>
            <FeatureFlagForm tenants={tenants} sites={sites} />
          </div>

          <form action="/admin/feature-flags" className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-[#fff7e8]"><Search className="size-4 text-amber-300" /> فلاتر</h2>
            <div className="grid gap-3">
              <input
                name="q"
                defaultValue={q}
                placeholder="بحث بالمفتاح أو العميل أو الموقع"
                className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40"
              />
              <select name="scope" defaultValue={scope} className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-amber-400/40">
                <option value="">كل النطاقات</option>
                <option value="PLATFORM">Platform</option>
                <option value="TENANT">عميل</option>
                <option value="SITE">Site</option>
              </select>
              <select name="state" defaultValue={state} className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-amber-400/40">
                <option value="">كل الحالات</option>
                <option value="enabled">مفعلة</option>
                <option value="disabled">متوقفة</option>
              </select>
              <button className="h-10 rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white">تطبيق</button>
            </div>
          </form>
        </div>

        <div className="grid gap-3">
          {flags.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-16 text-center">
              <Flag className="mb-3 size-10 text-white/20" />
              <h2 className="text-lg font-black text-white/75">لا توجد Feature Flags مطابقة</h2>
              <p className="mt-1 max-w-xl text-sm font-bold leading-7 text-white/42">أنشئ أول مفتاح أو عدّل الفلاتر الحالية.</p>
            </div>
          ) : (
            flags.map((flag) => <FeatureFlagCard key={flag.id} flag={flag} tenants={tenants} sites={sites} />)
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className={accent ? "text-2xl font-black text-amber-200" : "text-2xl font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </div>
  );
}

function FeatureFlagForm({ tenants, sites, flag }: { tenants: TenantOption[]; sites: SiteOption[]; flag?: { id: string; key: string; scope: string; enabled: boolean; tenantId: string | null; siteId: string | null; value: unknown } }) {
  return (
    <form action={saveFeatureFlagAction} className="mt-4 grid gap-3">
      {flag ? <input type="hidden" name="id" value={flag.id} /> : null}
      <input
        name="key"
        required
        defaultValue={flag?.key ?? ""}
        placeholder="مثال: billing.checkout.v2"
        className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 font-mono text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-400/40"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="scope" defaultValue={flag?.scope ?? "PLATFORM"} className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-amber-400/40">
          <option value="PLATFORM">Platform</option>
          <option value="TENANT">عميل</option>
          <option value="SITE">Site</option>
        </select>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white/60">
          <input name="enabled" type="checkbox" defaultChecked={flag?.enabled ?? false} />
          مفعل
        </label>
      </div>
      <select name="tenantId" defaultValue={flag?.tenantId ?? ""} className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-amber-400/40">
        <option value="">اختر العميل عند استخدام نطاق العميل</option>
        {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.displayName} · {tenant.status}</option>)}
      </select>
      <select name="siteId" defaultValue={flag?.siteId ?? ""} className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-white outline-none focus:border-amber-400/40">
        <option value="">Site target عند اختيار SITE</option>
        {sites.map((site) => <option key={site.id} value={site.id}>{site.title} · /p/{site.slug} · {site.tenant.displayName}</option>)}
      </select>
      <textarea
        name="value"
        rows={flag ? 4 : 3}
        defaultValue={flag ? jsonValue(flag.value) : ""}
        placeholder='{ "variant": "A", "rollout": 25 }'
        className="resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs font-bold leading-5 text-white outline-none placeholder:text-white/25 focus:border-amber-400/40"
        dir="ltr"
      />
      <button className="h-10 rounded-xl border border-amber-500/35 bg-amber-500/12 text-sm font-black text-amber-200 transition hover:bg-amber-500/20">
        {flag ? "حفظ التعديل" : "حفظ المفتاح"}
      </button>
    </form>
  );
}

function FeatureFlagCard({ flag, tenants, sites }: { flag: { id: string; key: string; scope: string; enabled: boolean; value: unknown; tenantId: string | null; siteId: string | null; updatedAt: Date; tenant: { displayName: string; status: string } | null; site: { title: string; slug: string; status: string; tenant: { displayName: string } } | null }; tenants: TenantOption[]; sites: SiteOption[] }) {
  const target = flag.scope === "TENANT"
    ? flag.tenant?.displayName ?? "عميل غير معروف"
    : flag.scope === "SITE"
      ? `${flag.site?.title ?? "Site غير معروف"} · /p/${flag.site?.slug ?? "—"}`
      : "Platform-wide";

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-sm font-black text-[#fff7e8]">{flag.key}</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.68rem] font-black text-white/45">{scopeLabel(flag.scope)}</span>
            <span className={flag.enabled ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[0.68rem] font-black text-emerald-300" : "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.68rem] font-black text-white/35"}>
              {flag.enabled ? "مفعل" : "متوقف"}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-white/55">{target}</p>
          <p className="mt-1 text-xs font-bold text-white/32">آخر تحديث: {formatDate(flag.updatedAt)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <form action={toggleFeatureFlagAction}>
            <input type="hidden" name="id" value={flag.id} />
            <button className={flag.enabled ? "inline-flex h-10 items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 text-xs font-black text-amber-200 transition hover:bg-amber-500/20" : "inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-black text-emerald-300 transition hover:bg-emerald-500/20"}>
              {flag.enabled ? <ToggleLeft className="size-4" /> : <ToggleRight className="size-4" />}
              {flag.enabled ? "إيقاف" : "تفعيل"}
            </button>
          </form>
          <form action={deleteFeatureFlagAction}>
            <input type="hidden" name="id" value={flag.id} />
            <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 text-xs font-black text-red-300 transition hover:bg-red-500/20">
              <Trash2 className="size-4" /> حذف
            </button>
          </form>
        </div>
      </div>

      {flag.value ? (
        <pre className="mt-4 max-h-52 overflow-auto rounded-xl border border-white/8 bg-black/22 p-3 text-left text-[11px] leading-5 text-white/55" dir="ltr">{jsonValue(flag.value)}</pre>
      ) : null}

      <details className="mt-4 rounded-xl border border-white/8 bg-black/12 p-3">
        <summary className="cursor-pointer text-xs font-black text-white/42">تعديل متقدم</summary>
        <FeatureFlagForm tenants={tenants} sites={sites} flag={flag} />
      </details>
    </article>
  );
}
