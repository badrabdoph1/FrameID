import { SocialPreviewForm } from "@/app/(admin)/admin/settings/social-preview/social-preview-form";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { getContent } from "@/lib/content";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getPlatformSocialPreviewSettings } from "@/modules/social-preview/platform-social-preview-settings";
import { PLATFORM_DEFAULT_SOCIAL_IMAGE } from "@/modules/social-preview/social-preview";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function SocialPreviewSettingsPage({ searchParams }: Props) {
  await requireAdminPermission("settings", "view");
  const params = await searchParams;
  const settings = await getPlatformSocialPreviewSettings();
  const homepage = getContent("marketing/homepage");
  const defaultTitle = `${homepage.hero.headline} ${homepage.hero.headlineHighlight}`.trim();
  const defaultDescription = homepage.hero.subheadline;
  const heroVersion = encodeURIComponent(homepage._updatedAt || String(homepage._version));
  const defaultImageUrl = `${PLATFORM_DEFAULT_SOCIAL_IMAGE}&content=${heroVersion}`;

  return (
    <AdminPageShell
      badge="Social Preview"
      title="معاينة المشاركة"
      description="تحكم في صورة وعنوان ووصف معاينة روابط منصة FrameID دون التأثير على مواقع العملاء."
    >
      {params.saved ? (
        <div className="mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-200">
          تم حفظ إعدادات معاينة المشاركة بنجاح.
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
