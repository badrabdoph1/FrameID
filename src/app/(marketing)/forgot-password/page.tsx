import type { Metadata } from "next";
import React from "react";

import { requestPasswordResetAction } from "@/app/(marketing)/forgot-password/actions";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/ui/copy-button";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور",
  description: "أدخل بريدك الإلكتروني لاستعادة كلمة مرور حساب FrameID."
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
      title="استعادة كلمة المرور"
      description="أدخل بريدك وسنرسل رابطًا آمنًا إذا كان الحساب موجودًا."
    >
      {sent ? (
        <div className="mb-4 rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          إذا كان البريد مسجلًا، تم إرسال رابط الاستعادة.
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
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button type="submit" className="w-full">
          إرسال رابط الاستعادة
        </Button>
      </form>
    </AuthShell>
  );
}
