import type { Metadata } from "next";
import React from "react";

import { requestPasswordResetAction } from "@/app/(marketing)/forgot-password/actions";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/ui/copy-button";

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
      description="ادخل رقم الهاتف أو البريد. لو الحساب مربوط ببريد، هنرسل رابط استعادة آمن."
    >
      {sent ? (
        <div className="mb-4 rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          لو الحساب مسجل ببريد إلكتروني، تم إرسال رابط الاستعادة.
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-[var(--radius-panel)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <span className="text-foreground">{error}</span>
          {error ? <CopyButton value={error} /> : null}
        </div>
      ) : null}
      <form action={requestPasswordResetAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">رقم الهاتف أو البريد الإلكتروني</Label>
          <Input
            id="identifier"
            name="identifier"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="01000000000 أو name@example.com"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          أرسل رابط الاستعادة
        </Button>
      </form>
    </AuthShell>
  );
}
