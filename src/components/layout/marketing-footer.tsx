import Link from "next/link";
import React from "react";
import { CheckCircle2, Link2, Settings2 } from "lucide-react";

import { getContent } from "@/lib/content";

const footerDetails = [
  { title: "رابط جاهز", body: "شارك موقعك فورًا", icon: Link2 },
  { title: "تعديل سهل", body: "غيّر الصور والباقات", icon: Settings2 },
  { title: "شكل احترافي", body: "قوالب مناسبة للمصورين", icon: CheckCircle2 },
];

export function MarketingFooter() {
  const footer = getContent("marketing/footer");

  return (
    <footer className="border-t border-border bg-ink text-white" role="contentinfo">
      <div className="container-page py-9 md:py-14">
        <div className="mx-auto grid max-w-5xl gap-7 text-center md:grid-cols-[1.15fr_1fr_1.15fr] md:items-start md:gap-8 md:text-start">
          <div className="mx-auto max-w-xl md:mx-0 md:max-w-sm">
            <Link
              href="/"
              className="font-display text-2xl font-semibold tracking-normal md:text-xl"
              translate="no"
            >
              FrameID
            </Link>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/56 md:mx-0 md:max-w-xs">
              {footer.description}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 md:hidden">
              {footerDetails.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3">
                    <Icon className="mx-auto size-4 text-champagne" aria-hidden />
                    <p className="mt-2 text-[0.68rem] font-semibold text-white/88">{item.title}</p>
                    <p className="mt-1 text-[0.62rem] leading-4 text-white/42">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md md:max-w-none">
            <h4 className="text-center text-sm font-semibold text-white/84 md:text-start">روابط مهمة</h4>
            <ul className="mt-3 grid grid-cols-3 gap-2 md:mt-4 md:grid-cols-1 md:gap-3">
              {footer.quickLinks.map((link: { label: string; href: string }) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="grid min-h-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] px-2 text-center text-[0.72rem] font-semibold text-white/58 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:min-h-0 md:place-items-start md:border-0 md:bg-transparent md:p-0 md:text-start md:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md md:mx-0 md:max-w-sm">
            <h4 className="text-center text-sm font-semibold text-white/84 md:text-start">{footer.cta.title}</h4>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-white/56 md:mx-0">
              {footer.cta.subtitle}
            </p>
            <div className="mt-4 hidden grid-cols-3 gap-2 md:grid">
              {footerDetails.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center">
                    <Icon className="mx-auto size-4 text-champagne" aria-hidden />
                    <p className="mt-2 text-[0.68rem] font-semibold text-white/88">{item.title}</p>
                    <p className="mt-1 text-[0.62rem] leading-4 text-white/42">{item.body}</p>
                  </div>
                );
              })}
            </div>
            <Link
              href={footer.cta.href}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-white px-5 text-sm font-semibold text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {footer.cta.label}
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-5xl border-t border-white/10 pt-5 text-center text-xs text-white/38 md:mt-10 md:pt-6 md:text-sm">
          {footer.copyright}
        </div>
      </div>
    </footer>
  );
}
