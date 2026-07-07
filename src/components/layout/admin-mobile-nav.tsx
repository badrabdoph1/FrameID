"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAdmin } from "@/components/layout/admin-context";

const mobileItems = [
  { href: "/admin", label: "الرئيسية", icon: Home },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const { setSearchOpen } = useAdmin();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href + "/");
  };

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-30 flex h-14 items-center justify-around border-t border-white/[0.06] bg-[#0a0a0a] lg:hidden">
      {mobileItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition",
            isActive(item.href)
              ? "text-champagne"
              : "text-white/30",
          )}
        >
          <item.icon className="size-5" />
          {item.label}
        </Link>
      ))}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] text-white/30 transition"
      >
        <Search className="size-5" />
        بحث
      </button>
    </nav>
  );
}
