import { SocialPreviewForm } from "@/app/(admin)/admin/social-preview/social-preview-form";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getPlatformSocialPreviewSettings } from "@/modules/social-preview/platform-social-preview-settings";
import { PLATFORM_DEFAULT_SOCIAL_IMAGE } from "@/modules/social-preview/social-preview";
import { getHomeHeroContent, loadPublishedHomePageState } from "@/modules/platform-pages/home-page-runtime";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminSocialPreviewPage({ searchParams }: Props) {
  await requireAdminPermission("templates", "view");
  const params = await searchParams;
  const settings = await getPlatformSocialPreviewSettings();
  const home = await loadPublishedHomePageState();
  const hero = getHomeHeroContent(home.document);
  const defaultTitle = `${hero.headline} ${hero.headlineHighlight}`.trim();
  const defaultDescription = hero.subheadline;
  const heroVersion = encodeURIComponent(home.versionTag);
  const defaultImageUrl = `${PLATFORM_DEFAULT_SOCIAL_IMAGE}&content=${heroVersion}`;

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
        <div role="status" className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300">
          تم حفظ إعدادات معاينة المشاركة وتحديث Metadata الخاصة بالمنصة.
        </div>
      ) : null}
      {params.error ? (
        <div className="mb-5 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-black text-red-200">
          {params.error}
        </div>
      ) : null}

      <SocialPreviewForm
        settings={settings}
        defaultTitle={defaultTitle}
        defaultDescription={defaultDescription}
        defaultImageUrl={defaultImageUrl}
      />
    </AdminPageShell>
  );
}
