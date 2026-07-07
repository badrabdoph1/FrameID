"use client"

import type { ReactNode } from "react"

export type PageAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: "primary" | "secondary" | "danger" | "ghost"
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

interface ClientPageShellProps {
  title: string
  description?: string
  badge?: string
  actions?: PageAction[]
  children: ReactNode
  className?: string
}

export function ClientPageShell({
  title,
  description,
  badge,
  actions,
  children,
}: ClientPageShellProps) {
  return (
    <div className="admin-page-shell">
      <div className="dashboard-head">
        <div>
          {badge && <span className="eyebrow" style={{ marginBottom: 4, display: "inline-flex" }}>{badge}</span>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions && actions.length > 0 && (
          <div className="dashboard-actions">
            {actions.map((action) => {
              const Icon = action.icon
              if (action.href) {
                return (
                  <a key={action.label} href={action.href} className={action.variant === "primary" ? "btn-gold" : "btn-soft"}>
                    {Icon && <Icon className="size-4" />}
                    {action.label}
                  </a>
                )
              }
              return (
                <button key={action.label} onClick={action.onClick} disabled={action.disabled} className={action.variant === "primary" ? "btn-gold" : "btn-soft"}>
                  {Icon && <Icon className="size-4" />}
                  {action.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gap: 18 }}>{children}</div>
    </div>
  )
}
