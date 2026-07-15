"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const passwordStrength = getPasswordStrength(passwordValue);

  return (
    <>
      {/* Error Message */}
      {error ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-soft/50 p-4">
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
      <form action={signupAction} className="space-y-4">
        <input
          name="selectedTemplateCode"
          type="hidden"
          value={template ?? ""}
        />

        {mode === "phone" && (
          <input type="hidden" name="identifier" value={phoneValue} />
        )}

        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">اسمك أو اسم الاستوديو</Label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="مثال: استوديو الإبداع"
              className="pr-10"
              required
            />
          </div>
        </div>

        {/* Phone/Email Field */}
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
            <p className="text-xs leading-5 text-muted-foreground">
              يمكنك التسجيل بأي رقم هاتف من أي دولة عربية.
            </p>
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

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="8 أحرف على الأقل"
              className="pr-10 pl-10"
              minLength={8}
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
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

          {/* Password Strength Indicator */}
          {passwordValue.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      level <= passwordStrength.score
                        ? passwordStrength.color
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
            </div>
          )}

          <p className="text-xs leading-5 text-muted-foreground">
            اكتب 8 أحرف على الأقل. يمكنك استخدام حروف وأرقام ورموز.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="luxury"
          className="w-full"
          size="lg"
        >
          إنشاء موقعي
        </Button>
      </form>
    </>
  );
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "ضعيفة", color: "bg-danger" };
  if (score === 2) return { score: 2, label: "متوسطة", color: "bg-warning" };
  if (score === 3) return { score: 3, label: "جيدة", color: "bg-champagne" };
  return { score: 4, label: "قوية", color: "bg-success" };
}
