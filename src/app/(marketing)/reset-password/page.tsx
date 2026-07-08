import React from "react";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/ui/copy-button";
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
      title="تعيين كلمة سر جديدة"
      description="اختار كلمة سر قوية وهتتقفل الجلسات القديمة بعد التحديث."
    >
      {error ? (
        <div className="mb-4 rounded-[var(--radius-panel)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <span className="text-foreground">{error}</span>
          <CopyButton value={error} />
        </div>
      ) : null}
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
