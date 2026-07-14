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
      title="أنشئ حسابك"
      description="هنجهز الحساب والموقع والرابط تلقائيًا بعد التسجيل."
    >
      {publishedTemplate ? (
        <div className="mb-5 flex items-center gap-3 rounded-[var(--radius-panel)] border border-champagne/25 bg-champagne/[0.06] p-2.5 shadow-[0_10px_35px_rgba(20,20,20,0.06)]">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={getTemplatePreviewImage(publishedTemplate)}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold text-champagne-strong">القالب اللي اخترته</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{publishedTemplate.name}</p>
          </div>
        </div>
      ) : null}
      <SignupForm error={error} template={template} />
      <p className="mt-6 text-sm text-muted-foreground">
        عندك حساب؟{" "}
        <Link href="/login" className="font-semibold text-foreground">
          سجل دخول
        </Link>
      </p>
    </AuthShell>
  );
}
