"use client";

import { useState, type FormEvent } from "react";

type AdminLoginFormProps = {
  initialError?: string;
};

type LoginResponse = {
  ok?: boolean;
  error?: string;
  redirectTo?: string;
};

export function AdminLoginForm({ initialError }: AdminLoginFormProps) {
  const [error, setError] = useState(initialError ?? "");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("اكتب البريد الإلكتروني وكلمة السر.");
      return;
    }

    setError("");
    setPending(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const body = new URLSearchParams();
      body.set("email", email);
      body.set("password", password);

      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          "x-admin-login-client": "1",
        },
        body,
      });

      const data = (await response.json().catch(() => null)) as LoginResponse | null;

      if (!response.ok || !data?.ok) {
        setError(data?.error ?? "فشل تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى.");
        setPending(false);
        return;
      }

      window.location.href = data.redirectTo ?? "/admin";
    } catch (requestError) {
      const isTimeout = requestError instanceof DOMException && requestError.name === "AbortError";
      setError(isTimeout ? "طلب الدخول لم يكتمل خلال 15 ثانية. أعد المحاولة بعد إعادة تحميل الصفحة." : "تعذر الاتصال بالخادم. حاول مرة أخرى أو أعد تحميل الصفحة.");
      setPending(false);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return (
    <form action="/api/admin/login" method="POST" className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-extrabold text-red-400">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-extrabold text-white/60">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-500/50 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="admin@frameid.app"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-extrabold text-white/60">
          كلمة السر
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-500/50 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-sm font-bold text-[#17120a] shadow-lg transition hover:-translate-y-0.5 hover:shadow-amber-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {pending ? "جاري الدخول..." : "دخول"}
      </button>
    </form>
  );
}
