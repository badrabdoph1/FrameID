"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";

const UNAVAILABLE_MESSAGE = "الفنان لسه ماضفش بيانات التواصل 🫠";
const TOAST_DURATION_MS = 3600;

/**
 * Shared public-site guard for contact actions that have no real destination.
 * It lives above all theme presentations so current and future templates inherit
 * the same behavior without duplicating contact fallback logic.
 */
export function MissingContactGuard() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const showMessage = () => {
      setVisible(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setVisible(false), TOAST_DURATION_MS);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href")?.trim() ?? "";
      const explicitlyUnavailable = anchor.dataset.contactUnavailable === "true";
      const emptyMailAction = /^mailto:\?(?:$|subject=|body=)/iu.test(rawHref);
      const emptyTelAction = rawHref === "tel:";
      const emptyWhatsAppAction = /^(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)\/?(?:\?|$)/iu.test(rawHref);

      if (!explicitlyUnavailable && !emptyMailAction && !emptyTelAction && !emptyWhatsAppAction) return;

      event.preventDefault();
      event.stopPropagation();
      showMessage();
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[100] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/14 bg-[#11151d]/96 p-3 text-white shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:mx-0"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300/12 text-amber-200">
        <MessageCircle className="size-5" aria-hidden />
      </span>
      <p className="min-w-0 flex-1 text-sm font-black leading-6">{UNAVAILABLE_MESSAGE}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="إغلاق الرسالة"
        className="grid size-9 shrink-0 place-items-center rounded-xl text-white/50 transition hover:bg-white/[0.07] hover:text-white"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export { UNAVAILABLE_MESSAGE };
