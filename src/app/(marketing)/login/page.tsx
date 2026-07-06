import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/(marketing)/login/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <AuthShell
      title="تسجيل الدخول"
      description="ادخل إلى لوحة التحكم لإدارة موقعك، صورك، باقاتك، وحالة التفعيل."
    >
      {error ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}
      <form action={loginAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          دخول
        </Button>
      </form>
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
          نسيت كلمة المرور؟
        </Link>
        <Link href="/signup" className="font-semibold">
          إنشاء حساب
        </Link>
      </div>
    </AuthShell>
  );
}
