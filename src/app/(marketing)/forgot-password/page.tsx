import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "نسيت كلمة السر",
  description: "استعادة الوصول إلى حساب FrameID.",
  robots: {
    index: false,
    follow: false
  }
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    sent?: string;
    error?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  const { sent, error } = await searchParams;

  return (
    <AuthShell
      title="نسيت كلمة السر"
      description="ادخل رقم الهاتف أو البريد. لو الحساب مربوط بريد، هنرسل رابط استعادة آمن."
    >
      <ForgotPasswordForm sent={sent} error={error} />
    </AuthShell>
  );
}
