import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export type AdminMetricTone = "neutral" | "success" | "warning" | "danger" | "gold";

const toneClasses: Record<AdminMetricTone, string> = {
  neutral: "text-[#fff7e8]",
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-red-300",
  gold: "text-[#f3cf73]",
};

export function AdminMetricsGrid({ children }: { children: ReactNode }) {
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</section>;
}

export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  tone?: AdminMetricTone;
  href?: string;
}) {
  const content = (
    <>
      {Icon ? <Icon className={cn("size-5", toneClasses[tone])} /> : null}
      <p className="mt-3 text-xs font-black text-white/42">{label}</p>
      <p className={cn("mt-1 truncate text-2xl font-black", toneClasses[tone])}>
        {typeof value === "number" ? value.toLocaleString("ar-EG") : value}
      </p>
    </>
  );

  const className = "rounded-2xl border border-white/10 bg-white/[0.04] p-4";

  if (!href) return <article className={className}>{content}</article>;

  return (
    <Link
      href={href}
      className={cn(
        className,
        "no-underline transition hover:-translate-y-0.5 hover:border-amber-300/24 hover:bg-amber-300/8",
      )}
    >
      {content}
    </Link>
  );
}

export function AdminWorkspacePanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <header className="flex items-start justify-between gap-3 border-b border-white/8 p-4">
        <div className="min-w-0">
          <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
          {description ? <p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p> : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-white/62 no-underline transition hover:bg-white/[0.08] hover:text-white"
          >
            {action.label}
          </Link>
        ) : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/12 bg-black/15 px-6 py-10 text-center">
      {Icon ? <Icon className="mb-3 size-9 text-white/20" /> : null}
      <h3 className="text-base font-black text-white/75">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm font-bold leading-6 text-white/42">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function AdminStatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: AdminMetricTone;
}) {
  const classes = {
    neutral: "bg-white/8 text-white/50",
    success: "bg-emerald-400/10 text-emerald-300",
    warning: "bg-amber-400/10 text-amber-300",
    danger: "bg-red-400/10 text-red-300",
    gold: "bg-[#f3cf73] text-[#17120a]",
  }[tone];

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-black", classes)}>{label}</span>;
}

export function AdminBanner({ tone, children }: { tone: "success" | "danger"; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-black",
        tone === "danger"
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      )}
    >
      {children}
    </div>
  );
}
