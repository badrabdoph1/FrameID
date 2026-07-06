import React from "react";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/app/(marketing)/reset-password/actions";

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
      title="تعيين كلمة مرور جديدة"
      description="اختر كلمة مرور قوية وسيتم إغلاق الجلسات القديمة بعد التحديث."
    >
      {error ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}
      <form action={resetPasswordAction} className="space-y-4">
        <input type="hidden" name="token" value={token ?? ""} />
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور الجديدة</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          تحديث كلمة المرور
        </Button>
      </form>
    </AuthShell>
  );
}
