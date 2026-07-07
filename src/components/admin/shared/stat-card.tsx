import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type StatCardProps = {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
  href?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function StatCard({
  label,
  value,
  trend,
  href,
  icon,
  className,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "group rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]",
        href && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-white/50">{label}</p>
        {icon && <div className="text-white/30">{icon}</div>}
      </div>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs",
            trend.positive ? "text-success" : "text-danger",
          )}
        >
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
      {href && (
        <div className="mt-3 flex items-center gap-1 text-xs text-champagne opacity-0 transition-opacity group-hover:opacity-100">
          <span>عرض الكل</span>
          <ArrowLeft className="size-3 rtl:rotate-180" />
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
