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
      title="تسجيل الدخول"
      description="ادخل برقم الهاتف أو البريد عشان تدير موقعك، صورك، وباقاتك."
    >
      <div data-guide-target="login-form">
        <LoginForm error={error} message={message} />
      </div>
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
          نسيت كلمة السر؟
        </Link>
        <Link href="/signup" className="font-semibold">
          إنشاء حساب جديد
        </Link>
      </div>
    </AuthShell>
  );
}
