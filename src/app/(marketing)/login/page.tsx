import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "ادخل لإدارة موقعك وصورك وباقاتك من لوحة تحكم FrameID.",
  robots: {
    index: false,
    follow: false
  }
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <AuthShell
      title="مرحباً بعودتك"
      description="ادخل برقم الهاتف أو البريد عشان تدير موقعك، صورك، وباقاتك."
    >
      <LoginForm error={error} message={message} />

      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-champagne-strong"
        >
          نسيت كلمة السر؟
        </Link>
        <Link
          href="/signup"
          className="text-sm font-semibold text-champagne-strong transition-colors hover:text-champagne"
        >
          إنشاء حساب جديد ←
        </Link>
      </div>
    </AuthShell>
  );
}
