import Link from "next/link";
import { Layout, Home, FileText, Palette, Search, Sparkles, CreditCard, CheckCircle, AlertTriangle, type LucideIcon } from "lucide-react";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { PAGE_DEFINITIONS } from "@/modules/page-studio/registry";

const pageCards = [
  { key: "marketing-homepage", icon: Home, stats: { label: "مصدر البيانات", value: "JSON File" } },
  { key: "marketing-templates", icon: Layout, stats: { label: "مصدر البيانات", value: "JSON File" } },
  { key: "marketing-pricing", icon: FileText, stats: { label: "مصدر البيانات", value: "JSON File" } },
  { key: "marketing-login", icon: Search, stats: { label: "مصدر البيانات", value: "JSON File" } },
  { key: "marketing-signup", icon: Sparkles, stats: { label: "مصدر البيانات", value: "JSON File" } },
  { key: "marketing-forgot-password", icon: Palette, stats: { label: "مصدر البيانات", value: "JSON File" } },
  { key: "marketing-checkout", icon: CreditCard, stats: { label: "مصدر البيانات", value: "JSON File" } },
  { key: "marketing-success", icon: CheckCircle, stats: { label: "مصدر البيانات", value: "JSON File" } },
  { key: "marketing-error", icon: AlertTriangle, stats: { label: "مصدر البيانات", value: "JSON File" } },
];

export const dynamic = "force-dynamic";

export default async function PageStudioDashboard() {
  await requireAdminPermission("page-studio", "view");

  return (
    <AdminPageShell
      badge="Page Studio"
      title="محرر الصفحات"
      description="تحرير بصري لجميع صفحات المنصة — اضغط على أي صفحة للبدء"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "محرر الصفحات" }]}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageCards.map(({ key, icon: Icon, stats }) => {
            const def = PAGE_DEFINITIONS.find((d) => d.id === key);
            if (!def) return null;

            return (
              <Link
                key={key}
                href={`/admin/page-studio/${def.id}`}
                className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-amber-300/25 hover:bg-amber-300/8"
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-6 text-amber-300" aria-hidden />
                  <span className="text-xs font-bold text-white/30">{def.sourceType === "json-file" ? "ملف JSON" : "قاعدة البيانات"}</span>
                </div>
                <div className="mt-4 flex-1">
                  <h3 className="text-lg font-black text-amber-50">{def.label}</h3>
                  <p className="mt-1 text-sm font-bold leading-5 text-white/45">{def.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                  <span className="text-xs font-bold text-white/30">{stats.label}</span>
                  <span className="text-xs font-black text-amber-300">{stats.value}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <section className="border-t border-white/8 pt-6">
          <header className="mb-4">
            <h2 className="text-base font-black text-amber-50">قريباً</h2>
            <p className="mt-1 text-xs font-bold leading-5 text-white/45">سيتم إضافة المزيد من الصفحات تلقائياً عند تعريفها في السجل</p>
          </header>
          <div className="grid gap-2 sm:grid-cols-3">
            {PAGE_DEFINITIONS
              .filter((d) => !pageCards.some((c) => c.key === d.id))
              .map((def) => (
                <Link
                  key={def.id}
                  href={`/admin/page-studio/${def.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-white no-underline transition hover:border-amber-300/25 hover:bg-amber-300/8"
                >
                  <Search className="size-5 shrink-0 text-amber-300" aria-hidden />
                  <span className="text-sm font-black text-amber-50">{def.label}</span>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}