import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { getPlatformSocialPreviewSettings } from "@/modules/social-preview/platform-social-preview-settings";
import {
  PLATFORM_DEFAULT_SOCIAL_IMAGE,
} from "@/modules/social-preview/social-preview";
import { SocialPreviewForm } from "@/app/(admin)/admin/settings/social-preview/social-preview-form";

export const dynamic = "force-dynamic";

const DEFAULT_TITLE = "FrameID | موقع احترافي لكل مصور";
const DEFAULT_DESCRIPTION =
  "FrameID منصة عربية للمصورين تساعدك تنشئ موقعًا احترافيًا ورابطًا واحدًا يجمع صورك وباقاتك وأسعارك وبيانات التواصل.";

type Props = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function SocialPreviewSettingsPage({ searchParams }: Props) {
  await requireSuperAdminSession();
  const params = await searchParams;
  const settings = await getPlatformSocialPreviewSettings();

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
        defaultTitle={DEFAULT_TITLE}
        defaultDescription={DEFAULT_DESCRIPTION}
        defaultImageUrl={PLATFORM_DEFAULT_SOCIAL_IMAGE}
      />
    </AdminPageShell>
  );
}
