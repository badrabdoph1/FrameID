"use client";

import { Calendar, CheckCircle2, Clock, Mail, Phone, User } from "lucide-react";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import type { CustomerDetail } from "./customer-types";

const statusTone: Record<string, "success" | "warning" | "danger" | "default"> = {
  TRIAL: "warning",
  ACTIVE: "success",
  EXPIRED: "danger",
  TRIAL_EXPIRED: "danger",
  SUSPENDED: "danger",
  ARCHIVED: "default",
};

const statusLabel: Record<string, string> = {
  TRIAL: "تجريبي",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  TRIAL_EXPIRED: "انتهت التجربة",
  SUSPENDED: "موقوف",
  ARCHIVED: "مؤرشف",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerInfoPanel({ customer }: { customer: CustomerDetail }) {
  const items = [
    { label: "الاسم", value: customer.owner.name, icon: User },
    { label: "البريد الإلكتروني", value: customer.owner.email, icon: Mail },
    { label: "الهاتف", value: customer.owner.phone ?? "غير مسجل", icon: Phone },
    { label: "تاريخ التسجيل", value: formatDate(customer.createdAt), icon: Calendar },
    { label: "آخر تحديث", value: formatDateTime(customer.updatedAt), icon: Clock },
    { label: "توثيق البريد", value: customer.owner.emailVerifiedAt ? "موثق" : "غير موثق", icon: CheckCircle2 },
  ];

  return (
    <section aria-label="بيانات العميل الأساسية" className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/7 px-3 py-2.5">
        <div>
          <h2 className="text-sm font-black text-[#fff7e8]">بيانات العميل الأساسية</h2>
          <p className="mt-0.5 text-xs font-bold text-white/35">بيانات المالك والحساب في مكان واحد.</p>
        </div>
        <AdminStatusBadge tone={statusTone[customer.status] || "default"}>
          {statusLabel[customer.status] ?? customer.status}
        </AdminStatusBadge>
      </header>

      <dl className="grid sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex min-w-0 items-center gap-2.5 border-b border-white/6 px-3 py-2.5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:nth-last-child(-n+3)]:border-b-0">
              <Icon aria-hidden="true" size={14} className="shrink-0 text-white/25" />
              <div className="min-w-0">
                <dt className="text-[0.68rem] font-black text-white/32">{item.label}</dt>
                <dd className="mt-0.5 truncate text-xs font-bold text-white/72">{item.value}</dd>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
