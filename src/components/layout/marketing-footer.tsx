import Link from "next/link";

export type MarketingFooterContent = {
  description: string;
  quickLinks: Array<{ label: string; href: string }>;
  cta: { title: string; subtitle: string; label: string; href: string };
  copyright: string;
};

export function MarketingFooter({ content: footer }: { content: MarketingFooterContent }) {
  return (
    <footer className="border-t border-border bg-ink text-white" role="contentinfo">
      <div className="container-page py-8 md:py-12">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-normal md:text-2xl"
            translate="no"
          >
            FrameID
          </Link>
          <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-white/42 md:text-sm md:leading-7">
            {footer.description}
          </p>
          <nav className="mt-6 flex flex-wrap justify-center gap-4 md:mt-8 md:gap-6">
            {footer.quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-white/48 transition hover:text-white/80 md:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={footer.cta.href}
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:mt-8"
          >
            {footer.cta.label}
          </Link>
        </div>
        <div className="mx-auto mt-8 max-w-3xl border-t border-white/8 pt-5 text-center text-[0.65rem] text-white/28 md:mt-10 md:pt-6 md:text-xs">
          {footer.copyright}
        </div>
      </div>
    </footer>
  );
}
