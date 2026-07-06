import React from "react";
import Link from "next/link";
import {
  Activity,
  CreditCard,
  DatabaseBackup,
  ShieldCheck
} from "lucide-react";

const adminCenters = [
  {
    label: "مركز الأمان",
    description: "سجل العمليات والوصول",
    href: "/admin/security",
    icon: ShieldCheck
  },
  {
    label: "مراجعة المدفوعات",
    description: "قبول أو رفض التفعيلات",
    href: "/admin/payments",
    icon: CreditCard
  },
  {
    label: "مركز النسخ الاحتياطي",
    description: "تشغيل ومراجعة النسخ",
    href: "/admin/backups",
    icon: DatabaseBackup
  },
  {
    label: "صحة النظام",
    description: "مؤشرات التشغيل الأساسية",
    href: "/admin/health",
    icon: Activity
  }
];

export function AdminCenterLinks() {
  return (
    <nav aria-label="مراكز الإدارة" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {adminCenters.map((center) => (
        <Link
          key={center.href}
          href={center.href}
          className="group rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.07] p-4 text-white transition hover:-translate-y-0.5 hover:border-champagne/45 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
        >
          <center.icon className="size-5 text-champagne" aria-hidden />
          <span className="mt-4 block font-semibold">{center.label}</span>
          <span className="mt-1 block text-sm text-white/55">
            {center.description}
          </span>
        </Link>
      ))}
    </nav>
  );
}
