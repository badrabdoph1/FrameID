import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getTemplatePreviewImage } from "@/modules/marketing/platform-content";
import { getTemplateByCode } from "@/modules/themes/theme-registry";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: "أنشئ حسابك على FrameID وابدأ تجهيز موقعك ورابطك الخاص.",
  robots: {
    index: false,
    follow: false
  }
};

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    template?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, template } = await searchParams;
  const selectedTemplate = template ? getTemplateByCode(template) : undefined;
  const publishedTemplate = selectedTemplate?.status === "published" ? selectedTemplate : undefined;

  return (
    <AuthShell
      title="ابدأ رحلتك الاحترافية"
      description="هنجهز الحساب والموقع والرابط تلقائيًا بعد التسجيل."
    >
      {publishedTemplate ? (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-champagne/30 bg-champagne/[0.06] p-3">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-champagne/20 bg-muted">
            <Image
              src={getTemplatePreviewImage(publishedTemplate)}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold text-champagne-strong">القالب المختار</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{publishedTemplate.name}</p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-champagne/30 bg-champagne/[0.06] p-3">
          <div className="mt-0.5 text-champagne-strong">💡</div>
          <p className="text-[0.82rem] leading-relaxed text-foreground/80">
            بعد إنشاء الحساب، هنتوجهك تلقائيًا لصفحة القوالب عشان تختار الشكل المناسب لموقعك.
          </p>
        </div>
      )}

      <SignupForm error={error} template={template} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        عندك حساب بالفعل؟{" "}
        <Link
          href="/login"
          className="font-semibold text-champagne-strong transition-colors hover:text-champagne"
        >
          سجل دخول
        </Link>
      </p>
    </AuthShell>
  );
}
