import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

export type CenterPageShellProps = {
  badge?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CenterPageShell({
  badge,
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
}: CenterPageShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {badge && <Badge tone="luxury">{badge}</Badge>}
          <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-white/50">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        )}
      </div>

      <div>{children}</div>
    </div>
  );
}
