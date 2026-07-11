import { Share2 } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { loadPlatformSocialPreview } from "@/modules/seo/platform-social-preview";
import { SocialPreviewForm } from "@/app/(admin)/admin/social-preview/social-preview-form";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdminSocialPreviewPage({ searchParams }: Props) {
  await requireAdminPermission("templates", "view");
  const [settings, params] = await Promise.all([
    loadPlatformSocialPreview(),
    searchParams,
  ]);

  return (
    <AdminPageShell
      badge="المحتوى"
      title="معاينة المشاركة"
      description="إدارة عنوان ووصف وصورة Open Graph وTwitter Cards الخاصة بمنصة FrameID من مصدر واحد، مع الإبقاء على المعاينة الافتراضية كخيار رجوع آمن."
      breadcrumbs={[
        { label: "المحتوى", href: "/admin/content" },
        { label: "معاينة المشاركة" },
      ]}
    >
      {params.saved ? (
        <div role="status" className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300">
          تم حفظ إعدادات معاينة المشاركة وتحديث Metadata الخاصة بالمنصة.
        </div>
      ) : null}

      <section className="rounded-3xl border border-amber-300/18 bg-amber-300/[0.045] p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/12 text-[#f3cf73]">
            <Share2 className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-[#fff7e8]">مصدر واحد لمعاينة المنصة</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/48">
              عند التفعيل تستخدم صفحات المنصة الصورة والعنوان والوصف المحفوظة هنا. عند التعطيل يعود النظام إلى صورة Open Graph الحالية تلقائيًا دون كسر SEO أو Twitter Cards.
            </p>
          </div>
        </div>
      </section>

      <SocialPreviewForm settings={settings} />
    </AdminPageShell>
  );
}
