"use client";

import { useState } from "react";

import { loginAction } from "@/app/(marketing)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

type LoginFormProps = {
  error?: string;
  message?: string;
};

export function LoginForm({ error, message }: LoginFormProps) {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneValue, setPhoneValue] = useState("");

  return (
    <>
      {message ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
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

      <form action={loginAction} className="space-y-4" data-smart-hint="login-form">
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
          تسجيل الدخول
        </Button>
      </form>
    </>
  );
}
