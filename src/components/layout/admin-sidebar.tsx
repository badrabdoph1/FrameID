"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAdmin } from "@/components/layout/admin-context";
import { adminNavigation } from "@/modules/admin/navigation";
import { adminLogoutAction } from "@/app/admin/login/actions";

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen, setSearchOpen } = useAdmin();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href + "/") || pathname === href;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-champagne text-xs font-bold text-ink">
            F
          </div>
          {sidebarOpen && (
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              FrameID
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="hidden size-7 items-center justify-center rounded-md text-white/30 transition hover:bg-white/[0.06] hover:text-white/70 lg:flex"
          aria-label={sidebarOpen ? "طي القائمة" : "توسيع القائمة"}
        >
          <ChevronDown className={cn("size-4 transition", sidebarOpen ? "" : "rotate-180")} />
        </button>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={() => { setSearchOpen(true); setMobileSidebarOpen(false); }}
          className="flex h-9 w-full items-center gap-2.5 rounded-lg bg-white/[0.04] px-3 text-sm text-white/30 transition hover:bg-white/[0.08] hover:text-white/60"
        >
          <Search className="size-4" />
          {sidebarOpen && (
            <span className="flex w-full items-center justify-between">
              بحث سريع
              <kbd className="hidden rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/20 md:inline">
                ⌘K
              </kbd>
            </span>
          )}
        </button>
      </div>

      <nav aria-label="لوحة الإدارة" className="flex-1 overflow-y-auto px-3 pb-4 pt-4 admin-scrollbar">
        {adminNavigation.map((group) => (
          <div key={group.label} className="mb-5">
            {sidebarOpen && (
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-widest text-white/20">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    "group flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition",
                    isActive(item.href)
                      ? "bg-champagne/[0.08] font-medium text-champagne"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80",
                  )}
                >
                  <item.icon className="size-[18px] shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="mr-auto rounded-full bg-champagne/15 px-2 py-0.5 text-[11px] text-champagne">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <form action={adminLogoutAction}>
          <button
            type="submit"
            className={cn(
              "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm transition text-white/40 hover:bg-white/[0.04] hover:text-white/70",
              !sidebarOpen && "justify-center",
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed right-4 top-3 z-30 flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-white lg:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="size-5" />
      </button>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed right-0 top-0 z-40 flex h-full flex-col border-l border-white/[0.06] bg-[#070707] transition-all duration-300 lg:static lg:z-auto",
          sidebarOpen ? "w-64" : "w-[60px]",
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0",
        )}
      >
        {mobileSidebarOpen && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
            aria-label="إغلاق القائمة"
          >
            <X className="size-4" />
          </button>
        )}
        {sidebarContent}
      </aside>
    </>
  );
}
