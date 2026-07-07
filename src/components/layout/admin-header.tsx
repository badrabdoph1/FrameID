"use client";

import React from "react";
import { Bell } from "lucide-react";
import { AdminCommandPalette } from "@/components/admin/command-palette/command-palette";

export function AdminHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#070707] px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="hidden lg:block">
          <AdminCommandPalette />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex size-9 items-center justify-center rounded-[var(--radius-control)] text-white/50 transition hover:bg-white/10 hover:text-white">
          <Bell className="size-4" />
        </button>
      </div>
    </header>
  );
}
