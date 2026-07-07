import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const alertStyles = {
  success: "border-success/20 bg-success/10 text-success",
  error: "border-danger/20 bg-danger/10 text-danger",
  warning: "border-warning/20 bg-warning/10 text-warning",
  info: "border-signal/20 bg-signal/10 text-signal",
};

const alertIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export type AlertProps = {
  variant?: keyof typeof alertStyles;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
};

export function Alert({
  variant = "info",
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const Icon = alertIcons[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-panel)] border p-4",
        alertStyles[variant],
        className,
      )}
      role="alert"
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="flex-1">
        {title && <p className="mb-1 font-medium">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-[var(--radius-control)] p-1 transition hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
