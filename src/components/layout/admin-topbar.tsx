"use client";

import { useCallback } from "react";
import { Bell, Search } from "lucide-react";
import { useAdmin } from "@/components/layout/admin-context";
import { AdminCommandPalette } from "@/components/admin/command-palette/command-palette";

export function AdminTopbar() {
  const { setSearchOpen } = useAdmin();

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, [setSearchOpen]);

  return (
    <header
      className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#070707]/80 backdrop-blur-md px-4 lg:px-6"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center gap-3">
        <div className="hidden lg:block">
          <AdminCommandPalette />
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-xs text-white/30 transition hover:border-white/10 hover:text-white/50 lg:hidden"
        >
          <Search className="size-3.5" />
          بحث
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button className="relative flex size-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/70">
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-[6px] size-[7px] rounded-full bg-champagne" />
        </button>

        <div className="mx-2 h-5 w-px bg-white/[0.06]" />

        <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-white/50">
          <div className="flex size-7 items-center justify-center rounded-md bg-champagne/20 text-xs font-medium text-champagne">
            AD
          </div>
          <span className="hidden text-xs sm:inline text-white/40">المشرف</span>
        </div>
      </div>
    </header>
  );
}
