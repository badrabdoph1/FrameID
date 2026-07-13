import type { ReactNode } from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export function AdminMetric({ label, value, accent, danger, href, className }: { label: string; value: string | number; accent?: boolean; danger?: boolean; href?: string; className?: string }) {
  const base = cn("rounded-2xl border border-white/10 bg-white/[0.035] p-4", className)
  const content = (
    <>
      <p className={cn(danger ? "text-xl font-black text-red-300" : accent ? "text-xl font-black text-amber-200" : "text-xl font-black text-[#fff7e8]")}>{value}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </>
  )
  if (href) return <a href={href} className={cn(base, "no-underline transition hover:border-amber-500/20 hover:bg-amber-500/8")}>{content}</a>
  return <div className={base}>{content}</div>
}

export function AdminPanel({ title, icon: Icon, children, className }: { title: string; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-white/10 bg-white/[0.035] p-4", className)}>
      {title && (
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-[#fff7e8]">
          {Icon && <Icon className="size-4 text-amber-300" />}
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

export function AdminInfo({ label, value, dir }: { label: string; value: string | number | null | undefined; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/16 p-3">
      <p className="text-[0.68rem] font-black text-white/32">{label}</p>
      <p dir={dir} className="mt-1 truncate text-sm font-bold text-white/68">{value ?? "—"}</p>
    </div>
  )
}

export function AdminEmpty({ text, icon: Icon }: { text: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/12 p-8 text-center">
      {Icon && <Icon className="mb-2 size-8 text-white/15" />}
      <p className="text-sm font-bold text-white/35">{text}</p>
    </div>
  )
}

export function AdminBanner({ tone, text }: { tone: "success" | "danger" | "warning"; text: string }) {
  const toneClass = tone === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : tone === "danger" ? "border-red-500/20 bg-red-500/10 text-red-300"
    : "border-amber-500/20 bg-amber-500/10 text-amber-300"
  return <div className={cn("rounded-2xl border px-4 py-3 text-sm font-black", toneClass)}>{text}</div>
}

export function AdminCompactItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/16 p-3">
      <strong className="block truncate text-sm font-black text-white/80">{title}</strong>
      <span className="mt-1 block truncate text-xs font-bold text-white/36">{subtitle}</span>
    </div>
  )
}

export function dateLabel(value: Date | string | null | undefined): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
}

export function dateTime(value: Date | string | null | undefined): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function daysLeft(value: Date | string | null | undefined): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  const diff = date.getTime() - Date.now()
  const days = Math.ceil(diff / 86_400_000)
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`
  if (days === 0) return "ينتهي اليوم"
  return `${days} يوم متبقي`
}

export function money(amount: number, currency: string = "EGP"): string {
  return `${amount.toLocaleString("ar-EG")} ${currency}`
}

export function formatMoney(amount: number, currency: string = "EGP"): string {
  return `${amount.toLocaleString("ar-EG")} ${currency}`
}
