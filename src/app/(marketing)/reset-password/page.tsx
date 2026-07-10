import type { Metadata } from "next";
import React from "react";

import { PasswordRecoverySupportCard } from "@/components/auth/password-recovery-support-card";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/app/(marketing)/reset-password/actions";

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
      {error ? <PasswordRecoverySupportCard /> : null}
      <form action={resetPasswordAction} className="space-y-4">
        <input type="hidden" name="token" value={token ?? ""} />
        <div className="space-y-2">
          <Label htmlFor="password">كلمة السر الجديدة</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
          <p className="text-xs text-muted-foreground">
            أقلها ١٠ حروف—حرف كبير، حرف صغير، ورقم.
          </p>
        </div>
        <Button type="submit" className="w-full">
          تحديث كلمة السر
        </Button>
      </form>
    </AuthShell>
  );
}
