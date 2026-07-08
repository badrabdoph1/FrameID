"use client"

import { useEffect, useCallback, type ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type AdminDrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  width?: "sm" | "md" | "lg" | "xl" | "full"
}

export function AdminDrawer({ open, onClose, title, description, children, footer, width = "md" }: AdminDrawerProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [open, handleEscape])

  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", full: "max-w-full" }

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-full flex-col bg-[#0a0a0a] border-l border-white/6 shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full",
        widths[width],
      )}>
        <div className="flex items-start justify-between gap-3 border-b border-white/6 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-white/40">{description}</p>}
          </div>
          <button onClick={onClose} className="flex size-7 shrink-0 items-center justify-center rounded-md text-white/40 transition hover:bg-white/6 hover:text-white/70">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 admin-scrollbar">{children}</div>
        {footer && <div className="border-t border-white/6 px-5 py-4">{footer}</div>}
      </div>
    </>
  )
}
