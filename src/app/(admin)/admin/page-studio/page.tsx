import Link from "next/link";
import { FileText } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { PAGE_DEFINITIONS } from "@/modules/page-studio/registry";

export const dynamic = "force-dynamic";

export default async function PageStudioDashboard() {
  await requireAdminPermission("page-studio", "view");
  return (
    <AdminPageShell badge="المحتوى" title="محرر صفحات المنصة" description="اختر الصفحة التي تريد تعديلها. كل صفحة لها وجهة تحرير واحدة ومصدر بيانات واضح." breadcrumbs={[{ label: "المحتوى", href: "/admin/content" }, { label: "محرر الصفحات" }]}>
      <section aria-label="صفحات المنصة" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PAGE_DEFINITIONS.map((page) => (
          <Link key={page.id} href={`/admin/page-studio/${page.id}`} className="group flex min-h-40 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 no-underline transition hover:border-amber-300/30 hover:bg-amber-300/8">
            <div className="flex items-center justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-amber-300/10 text-amber-200"><FileText className="size-4" /></span><span className="rounded-full bg-white/5 px-2.5 py-1 text-[0.68rem] font-black text-white/40">{page.sourceType === "json-file" ? "ملف محتوى" : "قاعدة البيانات"}</span></div>
            <h2 className="mt-4 text-base font-black text-[#fff7e8]">{page.label}</h2>
            <p className="mt-1 flex-1 text-sm font-bold leading-6 text-white/48">{page.description}</p>
            <span className="mt-3 text-xs font-black text-[#f3cf73]">{page.sections.length.toLocaleString("ar-EG")} أقسام قابلة للتحرير</span>
          </Link>
        ))}
      </section>
    </AdminPageShell>
  );
}
