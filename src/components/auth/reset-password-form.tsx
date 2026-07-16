"use client";

import { useFormStatus } from "react-dom";

import { PasswordRecoverySupportCard } from "@/components/auth/password-recovery-support-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/app/(marketing)/reset-password/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? "جاري التحديث..." : "تحديث كلمة السر"}
    </Button>
  );
}

type ResetPasswordFormProps = {
  token?: string;
  error?: string;
};

export function ResetPasswordForm({ token, error }: ResetPasswordFormProps) {
  if (error) {
    return <PasswordRecoverySupportCard />;
  }

  return (
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
      <SubmitButton />
    </form>
  );
}
