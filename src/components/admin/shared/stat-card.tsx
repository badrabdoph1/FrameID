import Link from "next/link"
import { ArrowLeft, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export type StatCardProps = {
  label: string
  value: string | number
  trend?: {
    value: string
    positive: boolean
  }
  href?: string
  icon?: LucideIcon
  iconColor?: string
  accent?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  trend,
  href,
  icon: Icon,
  iconColor,
  accent,
  className,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "group rounded-xl border p-4 transition",
        accent
          ? "border-amber-500/20 bg-amber-500/4"
          : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5",
        href && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-white/50">{label}</span>
        {Icon && (
          <div className={cn("shrink-0", iconColor || "text-white/30")}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className={cn("mt-1.5 text-2xl font-bold", accent ? "text-[#f3cf73]" : "text-white")}>
        {value}
      </p>
      {trend && (
        <p className={cn("mt-1 text-xs font-extrabold", trend.positive ? "text-emerald-400" : "text-red-400")}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
      {href && (
        <div className="mt-3 flex items-center gap-1 text-xs font-extrabold text-amber-500/60 opacity-0 transition-opacity group-hover:opacity-100">
          <span>عرض الكل</span>
          <ArrowLeft size={12} />
        </div>
      )}
    </div>
  )

  if (href) return <Link href={href} className="no-underline">{content}</Link>
  return content
}
