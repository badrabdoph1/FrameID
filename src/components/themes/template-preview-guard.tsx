"use client";

import { useEffect, useState } from "react";

const PREVIEW_NOTICE = "تلك معاينة تجريبية فقط. لما تسجل موقعك الأزرار هتشتغل بروابطك الحقيقية.";

function isPreviewOnlyLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href") ?? "";
  const label = anchor.getAttribute("aria-label") ?? "";

  if (href === "#packages") return true;
  if (/^(mailto:|tel:)/iu.test(href)) return true;
  if (/wa\.me|whatsapp|instagram\.com|facebook\.com/iu.test(href)) return true;
  if (/واتساب|انستجرام|إنستجرام|فيسبوك|حجز|تواصل/iu.test(label)) return true;

  return false;
}

export function TemplatePreviewGuard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    function showNotice() {
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 3600);
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-preview-toolbar]")) return;

      const anchor = target.closest("a");
      if (anchor instanceof HTMLAnchorElement && isPreviewOnlyLink(anchor)) {
        event.preventDefault();
        event.stopPropagation();
        showNotice();
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className={visible ? "pointer-events-none fixed inset-x-4 top-5 z-[80] mx-auto max-w-xl translate-y-0 opacity-100 transition" : "pointer-events-none fixed inset-x-4 top-5 z-[80] mx-auto max-w-xl -translate-y-3 opacity-0 transition"}
    >
      <div className="rounded-[1.35rem] border border-amber-200/35 bg-[#0b0b0f]/92 px-5 py-4 text-center text-sm font-black leading-7 text-[#fff7e8] shadow-[0_22px_80px_rgba(0,0,0,.35)] backdrop-blur-xl">
        {PREVIEW_NOTICE}
      </div>
    </div>
  );
}
