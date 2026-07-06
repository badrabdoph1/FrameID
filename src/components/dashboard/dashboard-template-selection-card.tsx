import React from "react";
import Link from "next/link";
import { Eye, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TemplateSummary } from "@/modules/themes/theme-registry";

type DashboardTemplateSelectionCardProps = {
  template: TemplateSummary;
  isCurrent: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export function DashboardTemplateSelectionCard({
  template,
  isCurrent,
  action
}: DashboardTemplateSelectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle>{template.name}</CardTitle>
          {isCurrent ? <Badge tone="success">القالب الحالي</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-muted-foreground">
          {template.description}
        </p>
        <p className="text-xs text-muted-foreground" dir="ltr">
          {template.code}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/templates/${template.code}/preview`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold transition hover:bg-muted"
          >
            <Eye className="size-4" aria-hidden />
            معاينة حية
          </Link>
          <form action={action}>
            <input name="templateCode" type="hidden" value={template.code} />
            <Button
              type="submit"
              variant="luxury"
              className="w-full"
              disabled={isCurrent}
            >
              <WandSparkles className="size-4" aria-hidden />
              {isCurrent ? "القالب مفعل" : "تفعيل القالب"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
