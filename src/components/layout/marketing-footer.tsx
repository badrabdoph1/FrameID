import Link from "next/link";

export type MarketingFooterContent = {
  description: string;
  quickLinks: Array<{ label: string; href: string }>;
  cta: { title: string; subtitle: string; label: string; href: string };
  copyright: string;
};

export function MarketingFooter({ content: footer }: { content: MarketingFooterContent }) {
  return (
    <footer className="border-t border-border/60 bg-ink text-white" role="contentinfo">
      <div className="container-page py-10 md:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight md:text-2xl"
            translate="no"
          >
            FrameID
          </Link>
          <p className="mx-auto mt-4 max-w-md text-xs leading-7 text-white/45 md:text-sm md:leading-7">
            {footer.description}
          </p>
          <nav className="mt-8 flex flex-wrap justify-center gap-6 md:mt-10 md:gap-8">
            {footer.quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-white/50 transition-colors duration-150 hover:text-white/80 md:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href={footer.cta.href}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-7 text-[0.85rem] font-semibold text-ink transition-all duration-200 hover:bg-white/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 md:mt-10"
          >
            {footer.cta.label}
          </Link>
        </div>
        <div className="mx-auto mt-10 max-w-2xl border-t border-white/10 pt-6 text-center text-[0.65rem] text-white/30 md:mt-12 md:pt-8 md:text-xs">
          {footer.copyright}
        </div>
      </div>
    </footer>
  );
}
