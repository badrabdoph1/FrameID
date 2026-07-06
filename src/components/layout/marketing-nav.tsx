import Link from "next/link";

const navItems = [
  { href: "/templates", label: "القوالب" },
  { href: "/login", label: "دخول" },
  { href: "/signup", label: "إنشاء حساب" }
];

export function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-ink/40 backdrop-blur-xl">
      <nav className="container-page flex h-16 items-center justify-between text-white">
        <Link href="/" className="font-display text-xl font-semibold tracking-normal">
          FrameID
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
