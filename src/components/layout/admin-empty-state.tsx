import type { ReactNode } from "react"
import { Inbox, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type AdminEmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function AdminEmptyState({ icon: Icon, title, description, action, className }: AdminEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-white/8 px-6 py-16 text-center", className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-white/4">
        {Icon ? <Icon className="size-7 text-white/25" aria-hidden /> : <Inbox className="size-7 text-white/25" aria-hidden />}
      </div>
      <h3 className="text-base font-semibold text-white/60">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-white/30">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
