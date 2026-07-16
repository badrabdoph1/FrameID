import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthShell } from "@/components/layout/auth-shell";

export const metadata: Metadata = {
  title: "تعيين كلمة سر جديدة",
  description: "تحديث كلمة المرور لحساب FrameID.",
  robots: {
    index: false,
    follow: false
  }
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  const { token, error } = await searchParams;

  return (
    <AuthShell
      title="تعيين كلمة سر جديدة"
      description="اختار كلمة سر قوية وهتتقفل الجلسات القديمة بعد التحديث."
    >
      <ResetPasswordForm token={token} error={error} />
    </AuthShell>
  );
}
