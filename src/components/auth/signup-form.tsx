"use client";

import { useState } from "react";

import { signupAction } from "@/app/(marketing)/signup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

type SignupFormProps = {
  template?: string;
  error?: string;
};

export function SignupForm({ template, error }: SignupFormProps) {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneValue, setPhoneValue] = useState("");

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm leading-6 text-foreground">
          {error}
        </p>
      ) : null}

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

      <form action={signupAction} className="space-y-4" data-smart-hint="signup-form">
        <input
          name="selectedTemplateCode"
          type="hidden"
          value={template ?? ""}
        />

        {mode === "phone" && (
          <input type="hidden" name="identifier" value={phoneValue} />
        )}

        <div className="space-y-2">
          <Label htmlFor="name">اسمك أو اسم الاستوديو</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>

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
            <p className="text-xs leading-5 text-muted-foreground">
              يمكنك التسجيل بأي رقم هاتف من أي دولة عربية.
            </p>
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

        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="text-xs leading-5 text-muted-foreground">
            اكتب 8 أحرف على الأقل. يمكنك استخدام حروف وأرقام ورموز.
          </p>
        </div>

        <Button type="submit" variant="luxury" className="w-full">
          إنشاء موقعي
        </Button>
      </form>
    </>
  );
}
