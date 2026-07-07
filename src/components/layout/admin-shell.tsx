"use client";

import React from "react";
import type { ReactNode } from "react";
import { AdminProvider } from "@/components/layout/admin-context";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <div className="flex min-h-screen bg-[#070707]">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminTopbar />
            <main className="flex-1 overflow-auto p-4 pb-safe lg:p-6">
              {children}
            </main>
          </div>
          <AdminMobileNav />
        </div>
    </AdminProvider>
  );
}
