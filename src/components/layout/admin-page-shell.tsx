import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { AdminToolbar } from "@/components/layout/admin-toolbar";

export type PageAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export type PageTab = {
  id: string;
  label: string;
  count?: number;
};

export type AdminPageShellProps = {
  title: string;
  description?: string;
  badge?: string;
  badgeTone?: "default" | "success" | "warning" | "danger" | "info";
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: PageAction[];
  tabs?: PageTab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminPageShell({
  title,
  description,
  badge,
  badgeTone,
  backHref,
  backLabel,
  actions,
  tabs,
  activeTab,
  children,
  toolbar,
  className,
}: AdminPageShellProps) {
  return (
    <div className={cn("animate-fade-in space-y-6", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white/70"
        >
          <ArrowRight className="size-3.5" />
          {backLabel || "رجوع"}
        </Link>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {badge && (
              <AdminStatusBadge tone={badgeTone || "default"}>
                {badge}
              </AdminStatusBadge>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-white/40">
              {description}
            </p>
          )}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              const classes = cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                action.variant === "primary" && "bg-champagne text-ink hover:bg-champagne/90",
                action.variant === "secondary" && "border border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:text-white",
                action.variant === "danger" && "bg-red-500/10 text-red-400 hover:bg-red-500/20",
                (!action.variant || action.variant === "ghost") && "text-white/50 hover:text-white/70",
                action.disabled && "pointer-events-none opacity-40",
              );
              if (action.href) {
                return (
                  <Link key={action.label} href={action.href} className={classes}>
                    {Icon && <Icon className="size-4" />}
                    {action.label}
                  </Link>
                );
              }
              return (
                <button key={action.label} onClick={action.onClick} disabled={action.disabled} className={classes}>
                  {Icon && <Icon className="size-4" />}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex gap-1 border-b border-white/[0.06]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "relative px-4 py-2.5 text-sm transition",
                activeTab === tab.id
                  ? "text-champagne"
                  : "text-white/40 hover:text-white/70",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "mr-2 rounded-full px-2 py-0.5 text-[11px]",
                  activeTab === tab.id ? "bg-champagne/15 text-champagne" : "bg-white/[0.06] text-white/40",
                )}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-champagne" />
              )}
            </button>
          ))}
        </div>
      )}

      {toolbar && <AdminToolbar>{toolbar}</AdminToolbar>}

      <div>{children}</div>
    </div>
  );
}
