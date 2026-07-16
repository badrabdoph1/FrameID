"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Lock, Mail, Phone } from "lucide-react";

import { loginAction } from "@/app/(marketing)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending} aria-busy={pending}>
      {pending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
    </Button>
  );
}

type LoginFormProps = {
  error?: string;
  message?: string;
};

export function LoginForm({ error, message }: LoginFormProps) {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneValue, setPhoneValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* Success Message */}
      {message ? (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-success/20 bg-success-soft/50 p-4">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/20">
            <svg className="size-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm leading-6 text-success">{message}</p>
        </div>
      ) : null}

      {/* Error Message */}
      {error ? (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-soft/50 p-4">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-danger/20">
            <svg className="size-3 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm leading-6 text-danger">{error}</p>
        </div>
      ) : null}

      {/* Mode Toggle */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "phone"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Phone className="size-4" />
          رقم الهاتف
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "email"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="size-4" />
          البريد الإلكتروني
        </button>
      </div>

      {/* Form */}
      <form action={loginAction} className="space-y-4">
        {mode === "phone" && (
          <input type="hidden" name="identifier" value={phoneValue} />
        )}

        {mode === "phone" ? (
          <div className="space-y-2">
            <Label htmlFor="phone-input" className="text-sm font-medium">رقم الهاتف</Label>
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
            <Label htmlFor="identifier" className="text-sm font-medium">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                id="identifier"
                name="identifier"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="pr-10"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-champagne-strong transition-colors hover:text-champagne">
              نسيتها؟
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <SubmitButton />
      </form>
    </>
  );
}
