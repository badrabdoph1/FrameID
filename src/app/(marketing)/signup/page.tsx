import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

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

  return (
    <AuthShell
      title="أنشئ حسابك"
      description="هنجهز الحساب والموقع والرابط تلقائيًا بعد التسجيل."
    >
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
