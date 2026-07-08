"use client";

import React from "react";
import Link from "next/link";
import { Eye, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { selectTemplateAction } from "@/app/(dashboard)/dashboard/design/actions";
import type { TemplateSummary } from "@/modules/themes/theme-registry";

type TemplatesClientProps = {
  templates: TemplateSummary[];
  currentThemeName: string | null;
  currentThemeCode: string | null;
};

export function TemplatesClient({
  templates,
  currentThemeName,
  currentThemeCode
}: TemplatesClientProps) {
  return (
    <main className="space-y-6">
      <section
        style={{
          background:
            "linear-gradient(135deg, var(--color-surface), var(--color-muted))"
        }}
        className="rounded-[var(--radius-panel)] border border-border p-5 sm:p-7"
      >
        <Badge tone="luxury">سوق القوالب</Badge>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
          اختر القالب المناسب لموقعك.
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          كل قالب يقدم تجربة بصرية مختلفة. فعّل القالب الذي يناسب هوية عملك.
        </p>
        <div
          style={{
            background:
              currentThemeCode
                ? "linear-gradient(135deg, #f3cf73, #e5b84c)"
                : undefined
          }}
          className={
            "mt-5 rounded-2xl border p-4 " +
            (currentThemeCode
              ? "border-[#e5b84c]/40 text-[#1a1a1a]"
              : "border-border/80 bg-background/70")
          }
        >
          <p className="text-xs opacity-70">القالب المفعل الآن</p>
          <p className="mt-1 text-lg font-semibold">
            {currentThemeName ?? "لم يتم تحديد قالب"}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">جميع القوالب</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            عاين القالب على بيانات تجريبية قبل التفعيل.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.code}
              template={template}
              isCurrent={template.themeCode === currentThemeCode}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function TemplateCard({
  template,
  isCurrent
}: {
  template: TemplateSummary;
  isCurrent: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle>{template.name}</CardTitle>
            {isCurrent ? (
              <Badge
                tone="success"
                style={{
                  fontSize: "0.7rem",
                  paddingInline: "0.5rem"
                }}
              >
                القالب الحالي
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-muted-foreground">
          {template.description}
        </p>
        <p className="text-xs text-muted-foreground" dir="ltr">
          {template.code}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/templates/${template.code}/preview`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold transition hover:bg-muted"
          >
            <Eye className="size-4" aria-hidden />
            معاينة حية
          </Link>
          <form action={selectTemplateAction} className="flex-1">
            <input name="templateCode" type="hidden" value={template.code} />
            <Button
              type="submit"
              variant={isCurrent ? "secondary" : "luxury"}
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
