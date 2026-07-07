import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard } from "lucide-react";

interface ContentStudioShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ContentStudioShell({
  title,
  description,
  children,
}: ContentStudioShellProps) {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "القيادة", href: "/admin" },
          { label: "Content Studio", href: "/admin/content" },
          { label: title }
        ]}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="size-4 text-champagne" aria-hidden />
            <Badge tone="luxury">Content Studio</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-white/50">
              {description}
            </p>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
