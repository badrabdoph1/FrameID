"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";

import { requestPasswordResetAction } from "@/app/(marketing)/forgot-password/actions";
import { PasswordRecoverySupportCard } from "@/components/auth/password-recovery-support-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? "جاري الإرسال..." : "أرسل رابط الاستعادة"}
    </Button>
  );
}

type ForgotPasswordFormProps = {
  sent?: string;
  error?: string;
};

export function ForgotPasswordForm({ sent, error }: ForgotPasswordFormProps) {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneValue, setPhoneValue] = useState("");

  return (
    <>
      {sent ? (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>لو الحساب مسجل ببريد إلكتروني، هنرسل لك رابط استعادة على البريد.</span>
        </div>
      ) : null}
      {error ? <PasswordRecoverySupportCard /> : null}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium transition ${
            mode === "phone"
              ? "border-champagne bg-champagne/10 text-foreground"
              : "border-border bg-surface text-muted-foreground hover:bg-muted"
          }`}
        >
          رقم الهاتف
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium transition ${
            mode === "email"
              ? "border-champagne bg-champagne/10 text-foreground"
              : "border-border bg-surface text-muted-foreground hover:bg-muted"
          }`}
        >
          البريد الإلكتروني
        </button>
      </div>

      <form action={requestPasswordResetAction} className="space-y-4">
        {mode === "phone" && (
          <input type="hidden" name="identifier" value={phoneValue} />
        )}

        {mode === "phone" ? (
          <div className="space-y-2">
            <Label htmlFor="phone-input">رقم الهاتف</Label>
            <PhoneInput
              id="phone-input"
              value={phoneValue}
              onChange={setPhoneValue}
              required
              autoComplete="tel"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="identifier">البريد الإلكتروني</Label>
            <Input
              id="identifier"
              name="identifier"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              required
            />
          </div>
        )}

        <SubmitButton />
      </form>
    </>
  );
}
