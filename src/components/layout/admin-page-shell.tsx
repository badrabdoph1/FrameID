import type { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import { ArrowLeft, type LucideIcon } from "lucide-react"
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb"

export type PageAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: "primary" | "secondary" | "danger" | "ghost"
  icon?: LucideIcon
  disabled?: boolean
}

export type PageTab = {
  id: string
  label: string
  count?: number
}

interface AdminPageShellProps {
  title: string
  description?: string
  badge?: string
  breadcrumbs?: BreadcrumbItem[]
  backHref?: string
  backLabel?: string
  actions?: PageAction[]
  tabs?: PageTab[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}

export function AdminPageShell({
  title,
  description,
  badge,
  breadcrumbs,
  backHref,
  backLabel,
  actions,
  children,
  className,
}: AdminPageShellProps) {
  return (
    <div className={cn("grid gap-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {breadcrumbs && <Breadcrumb items={breadcrumbs} className="mb-3" />}
          {badge && (
            <span className="mb-1.5 inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 text-[0.65rem] font-extrabold text-[#f3cf73]">
              {badge}
            </span>
          )}
          {backHref && (
            <Link href={backHref} className="mb-2 inline-flex items-center gap-1 text-xs font-extrabold text-amber-500/70 no-underline transition hover:text-amber-400">
              <ArrowLeft size={14} />
              {backLabel || "رجوع"}
            </Link>
          )}
          <h1 className="text-xl font-bold text-[#fff7e8] sm:text-2xl lg:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm font-extrabold text-white/60">{description}</p>}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions.map((action) => {
              const Icon = action.icon
              const baseClass = "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold no-underline transition whitespace-nowrap min-h-[42px]"
              if (action.href) {
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={cn(
                      baseClass,
                      action.variant === "primary"
                        ? "border border-amber-500/60 bg-gradient-to-br from-[#f3cf73] to-[#f3cf73]/80 text-[#17120a] shadow-lg hover:-translate-y-0.5 hover:shadow-amber-500/30"
                        : action.variant === "danger"
                          ? "border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {Icon && <Icon size={16} />}
                    {action.label}
                  </Link>
                )
              }
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    baseClass,
                    action.variant === "primary"
                      ? "border border-amber-500/60 bg-gradient-to-br from-[#f3cf73] to-[#f3cf73]/80 text-[#17120a] shadow-lg hover:-translate-y-0.5 hover:shadow-amber-500/30"
                      : action.variant === "danger"
                        ? "border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {Icon && <Icon size={16} />}
                  {action.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div className="grid gap-5">{children}</div>
    </div>
  )
}
