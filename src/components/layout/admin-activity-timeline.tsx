import { cn } from "@/lib/utils/cn"
import { AdminStatusBadge } from "@/components/layout/admin-status-badge"

export type TimelineEvent = {
  id: string
  action: string
  description: string
  timestamp: string
  actor?: string
  type?: "default" | "success" | "warning" | "danger" | "info"
}

type AdminActivityTimelineProps = {
  events: TimelineEvent[]
  className?: string
}

export function AdminActivityTimeline({ events, className }: AdminActivityTimelineProps) {
  if (events.length === 0) {
    return <div className="py-8 text-center text-sm text-white/30">لا توجد أحداث مسجلة</div>
  }

  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, idx) => {
        const dotColor = event.type === "success" ? "bg-emerald-400"
          : event.type === "warning" ? "bg-amber-400"
          : event.type === "danger" ? "bg-red-400"
          : event.type === "info" ? "bg-sky-400"
          : "bg-white/30"
        return (
          <div key={event.id} className="relative flex gap-4 pb-6">
            {idx < events.length - 1 && <div className="absolute right-[11px] top-5 bottom-0 w-px bg-white/6" />}
            <div className="flex flex-col items-center">
              <div className={cn("size-[6px] rounded-full ring-4 ring-[#070707]", dotColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white/80">{event.action}</p>
                <AdminStatusBadge tone={event.type || "default"} dot={false}>
                  {new Date(event.timestamp).toLocaleDateString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </AdminStatusBadge>
              </div>
              <p className="mt-0.5 text-sm text-white/40">{event.description}</p>
              {event.actor && <p className="mt-0.5 text-xs text-white/25">بواسطة: {event.actor}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
