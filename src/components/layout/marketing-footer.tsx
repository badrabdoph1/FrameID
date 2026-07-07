import Link from "next/link";

const footerLinks = [
  { href: "/templates", label: "القوالب" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "الشروط والأحكام" }
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-ink text-white" role="contentinfo">
      <div className="container-page py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link
              href="/"
              className="font-display text-xl font-semibold tracking-normal"
              translate="no"
            >
              FrameID
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-7 text-white/60">
              منصة عربية تمنح المصورين مواقع احترافية بقوالب حية وروابط خاصة، مع
              تجربة مجانية قبل الدفع.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white/80">روابط سريعة</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white/80">ابدأ الآن</h4>
            <p className="mt-3 text-sm leading-7 text-white/60">
              جرب FrameID مجانًا لمدة 14 يومًا، بدون بطاقة ائتمان.
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-white px-4 text-sm font-semibold text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              ابدأ التجربة المجانية
            </Link>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} FrameID. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
