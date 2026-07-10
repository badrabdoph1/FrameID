"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Headphones, MessageCircle, Phone, X } from "lucide-react";

import { DEFAULT_SUPPORT_WHATSAPP_NUMBER, toWhatsappHref } from "@/modules/support/support-utils";

type SupportSettingsResponse = {
  phone?: string;
  whatsappHref?: string;
};

function normalizeResponse(input: SupportSettingsResponse | null) {
  const phone = input?.phone || DEFAULT_SUPPORT_WHATSAPP_NUMBER;
  return {
    phone,
    whatsappHref: input?.whatsappHref || toWhatsappHref(phone),
  };
}

function supportBottomClass(pathname: string | null) {
  if (!pathname) return "bottom-[calc(0.75rem+env(safe-area-inset-bottom))]";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "bottom-[calc(7.8rem+env(safe-area-inset-bottom))] lg:bottom-5";
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return "bottom-[calc(5.15rem+env(safe-area-inset-bottom))] lg:bottom-5";
  }
  return "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-5";
}

function isPublicMarketingPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/templates" ||
    pathname.startsWith("/templates/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/cookies"
  );
}

export function SupportFloatingButton() {
  const pathname = usePathname();
  const [settings, setSettings] = useState(() => normalizeResponse(null));
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  const allowed = useMemo(() => {
    if (!pathname) return false;
    if (pathname === "/offline") return false;
    if (isPublicMarketingPath(pathname)) return false;
    return !pathname.startsWith("/p/");
  }, [pathname]);

  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    fetch("/api/support-settings", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<SupportSettingsResponse> : null)
      .then((data) => setSettings(normalizeResponse(data)))
      .catch(() => setSettings(normalizeResponse(null)));
    return () => controller.abort();
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, [allowed]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!allowed) return null;

  return (
    <div className={`fixed left-3 z-[2147482300] md:left-5 ${supportBottomClass(pathname)}`}>
      {open ? (
        <div className="mb-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-black/10 bg-white/95 text-[#111318] shadow-[0_22px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111720]/95 dark:text-[#fff7e8]">
          <div className="flex items-start justify-between gap-3 border-b border-black/8 p-3 dark:border-white/10">
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-500 dark:text-emerald-300">
                <Headphones className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-black">الدعم الفني</strong>
                <small className="mt-0.5 block text-xs font-bold text-black/48 dark:text-white/48">متاح عبر واتساب للمساعدة السريعة.</small>
              </span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid size-8 shrink-0 place-items-center rounded-2xl bg-black/5 text-black/50 dark:bg-white/5 dark:text-white/55" aria-label="إغلاق الدعم الفني">
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid gap-2 p-3">
            <a
              href={settings.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-black text-white no-underline transition hover:-translate-y-0.5 hover:bg-emerald-600"
            >
              <MessageCircle className="size-4" aria-hidden />
              تواصل واتساب
            </a>
            <a
              href={`tel:${settings.phone}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-black/[0.035] px-4 text-xs font-black text-black/62 no-underline transition hover:bg-black/[0.06] dark:border-white/10 dark:bg-white/[0.045] dark:text-white/62 dark:hover:bg-white/[0.07]"
            >
              <Phone className="size-3.5" aria-hidden />
              {settings.phone}
            </a>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-400/25 bg-[#111720]/94 px-3 text-[0.7rem] font-black text-white shadow-[0_16px_42px_rgba(0,0,0,0.24)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 md:min-h-12 md:px-4 md:text-xs ${entered ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}
        aria-label="فتح الدعم الفني"
        aria-expanded={open}
      >
        <span className="grid size-6 place-items-center rounded-full bg-emerald-400 text-[#07120d] md:size-7">
          <MessageCircle className="size-3.5 md:size-4" aria-hidden />
        </span>
        الدعم الفني
      </button>
    </div>
  );
}
