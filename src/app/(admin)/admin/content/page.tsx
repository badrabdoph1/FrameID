import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { PLATFORM_PAGE_DEFINITIONS } from "@/modules/platform-pages/page-catalog";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await requireAdminPermission("content", "view");

  const storedPages = process.env.DATABASE_URL
    ? await prisma.platformPage.findMany({
        select: { key: true, version: true, updatedAt: true },
      })
    : [];
  const storedByKey = new Map(storedPages.map((page) => [page.key, page]));

  return (
    <AdminPageShell
      badge="المحتوى"
      title="صفحات المنصة"
      description="افتح الصفحة وعدّل ما تراه مباشرة. لا نماذج طويلة ولا مفاتيح تقنية."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "المحتوى" }]}
    >
      <section aria-labelledby="platform-pages-heading">
        <div className="flex items-end justify-between gap-4 border-b border-white/8 pb-4">
          <div>
            <h2 id="platform-pages-heading" className="text-lg font-black text-[#fff7e8]">صفحات المنصة</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/42">كل صفحة مساحة عمل مستقلة، والصفحات الوظيفية تحمي الأجزاء الحساسة تلقائيًا.</p>
          </div>
          <span className="hidden text-xs font-bold text-white/30 sm:block">
            {PLATFORM_PAGE_DEFINITIONS.length.toLocaleString("ar-EG")} صفحات معرفة
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORM_PAGE_DEFINITIONS.map((page) => {
            const stored = storedByKey.get(page.key);
            const editable = page.availability === "editable";
            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-[#fff7e8]">{page.label}</h3>
                    <p className="mt-1 line-clamp-2 text-xs font-bold leading-6 text-white/45">{page.description}</p>
                  </div>
                  {editable ? (
                    <ArrowLeft className="mt-1 size-4 shrink-0 text-[#f3cf73] transition group-hover:-translate-x-1" aria-hidden />
                  ) : null}
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 text-[0.68rem] font-bold">
                  <span className="text-white/30" dir="ltr">{page.route}</span>
                  <span className={editable ? "text-emerald-300/85" : "text-white/30"}>
                    {editable ? "متاحة للتحرير" : "قيد النقل"}
                  </span>
                </div>
                {stored ? (
                  <p className="mt-2 text-[0.65rem] font-bold text-white/24">
                    النسخة {stored.version.toLocaleString("ar-EG")}، آخر حفظ {stored.updatedAt.toLocaleDateString("ar-EG")}
                  </p>
                ) : null}
              </>
            );

            return editable ? (
              <Link
                key={page.key}
                href={`/admin/content/pages/${page.key}`}
                className="group min-h-40 rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-white no-underline transition hover:-translate-y-0.5 hover:border-amber-300/24 hover:bg-amber-300/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/55"
              >
                {content}
              </Link>
            ) : (
              <article key={page.key} className="min-h-40 rounded-2xl border border-white/6 bg-white/[0.015] p-4 opacity-62">
                {content}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="content-tools-heading" className="mt-3 border-t border-white/8 pt-5">
        <h2 id="content-tools-heading" className="text-sm font-black text-[#fff7e8]">أدوات مرتبطة</h2>
        <nav aria-label="أقسام المحتوى" className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <ToolLink href="/admin/templates" label="إدارة القوالب" />
          <ToolLink href="/admin/themes" label="إعدادات الثيمات" />
          <ToolLink href="/admin/media" label="إدارة الوسائط" />
          <ToolLink href="/admin/marketing" label="أدوات التسويق" />
          <ToolLink href="/admin/social-preview" label="معاينة المشاركة" />
          <ToolLink href="/admin/revisions" label="سجل التعديلات السابق" />
        </nav>
      </section>
    </AdminPageShell>
  );
}

function ToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group flex min-h-11 items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 text-sm font-black text-white/64 no-underline transition hover:border-white/14 hover:bg-white/[0.055] hover:text-white">
      {label}
      <ExternalLink className="size-3.5 opacity-45 transition group-hover:opacity-80" aria-hidden />
    </Link>
  );
}
