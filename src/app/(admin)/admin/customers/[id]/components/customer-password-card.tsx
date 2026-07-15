"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, RefreshCw } from "lucide-react";

type Props = {
  ownerEmail: string;
  ownerId: string;
  onReset: (userId: string, newPassword: string) => void;
  onCopy: (text: string) => void;
};

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function CustomerPasswordCard({
  ownerEmail,
  ownerId,
  onReset,
  onCopy,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [customPassword, setCustomPassword] = useState("");
  const [mode, setMode] = useState<"idle" | "generated" | "custom">("idle");

  const handleGenerate = () => {
    const pw = generatePassword();
    setNewPassword(pw);
    setMode("generated");
    setCustomPassword("");
  };

  const handleCustomToggle = () => {
    if (mode === "custom") {
      setMode("idle");
      setCustomPassword("");
    } else {
      setMode("custom");
      setNewPassword(null);
    }
  };

  const handleSave = () => {
    if (mode === "generated" && newPassword) {
      onReset(ownerId, newPassword);
    } else if (mode === "custom" && customPassword.length >= 6) {
      onReset(ownerId, customPassword);
    }
  };

  const passwordToShow = mode === "generated" ? newPassword : customPassword;
  const canSave =
    (mode === "generated" && newPassword) ||
    (mode === "custom" && customPassword.length >= 6);

  return (
    <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-[#f3cf73]">
          <KeyRound className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-[#fff7e8]">بيانات تسجيل الدخول</h3>
          <p className="mt-1 text-xs font-bold text-white/45">
            العميل يسجل الدخول بإيميله والباسورد. مفيش استعادة باسورد غير من الدعم.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-black/15 px-3 py-2">
            <span className="text-xs font-bold text-white/40">البريد الإلكتروني</span>
            <span className="text-sm font-bold text-[#fff7e8]" dir="ltr">
              {ownerEmail}
            </span>
          </div>

          {mode === "idle" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 text-xs font-black text-[#f3cf73] transition hover:bg-amber-300/15"
              >
                <RefreshCw className="size-3.5" />
                إنشاء باسورد جديد
              </button>
              <button
                type="button"
                onClick={handleCustomToggle}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/60 transition hover:border-white/20 hover:text-white"
              >
                <KeyRound className="size-3.5" />
                كتابة باسورد مخصص
              </button>
            </div>
          )}

          {(mode === "generated" || mode === "custom") && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    readOnly={mode === "generated"}
                    value={passwordToShow || ""}
                    onChange={
                      mode === "custom"
                        ? (e) => setCustomPassword(e.target.value)
                        : undefined
                    }
                    placeholder="اكتب الباسورد (6 أحرف على الأقل)"
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 pl-20 text-left font-mono text-sm font-bold text-[#fff7e8] outline-none transition focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/10"
                    dir="ltr"
                  />
                  <div className="absolute left-1 top-1/2 flex -translate-y-1/2 gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="grid size-9 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white/70"
                      aria-label={showPassword ? "إخفاء" : "إظهار"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                    {passwordToShow && (
                      <button
                        type="button"
                        onClick={() => onCopy(passwordToShow)}
                        className="grid size-9 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white/70"
                        aria-label="نسخ"
                      >
                        <Copy className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {mode === "custom" && customPassword.length > 0 && customPassword.length < 6 && (
                <p className="text-xs font-bold text-red-400">
                  الباسورد لازم 6 أحرف على الأقل
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#f3cf73] px-4 text-xs font-black text-[#17120a] transition hover:bg-[#f8da8a] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <KeyRound className="size-3.5" />
                  حفظ الباسورد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("idle");
                    setNewPassword(null);
                    setCustomPassword("");
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/50 transition hover:border-white/20 hover:text-white"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
