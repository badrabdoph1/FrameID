import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";
import {
  Activity,
  CreditCard,
  DatabaseBackup,
  Headphones,
  Home,
  ShieldCheck,
  Users
} from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/security", label: "Security", icon: ShieldCheck },
  { href: "/admin/backups", label: "Backups", icon: DatabaseBackup },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/health", label: "Health", icon: Activity }
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="container-page grid gap-6 py-6 md:grid-cols-[240px_1fr]">
        <aside className="rounded-[var(--radius-panel)] border border-white/10 bg-white/10 p-3">
          <Link href="/admin" className="block px-3 py-3 font-display text-xl font-semibold">
            FrameID Admin
          </Link>
          <nav aria-label="لوحة الإدارة" className="mt-4 space-y-1">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm text-white/64 transition hover:bg-white/10 hover:text-white"
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
