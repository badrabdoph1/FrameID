"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Eye, Monitor, Smartphone, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { selectTemplateAction } from "@/app/(dashboard)/dashboard/design/actions";
import type { TemplateSummary } from "@/modules/themes/theme-registry";
import { BuilderPageHeader } from "@/components/dashboard/builder-primitives";

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
      <section className="rounded-[var(--radius-panel)] border border-border bg-surface/70 p-5 sm:p-7">
        <BuilderPageHeader
          eyebrow="سوق القوالب"
          title="اختر الشكل الذي يشبه أسلوب تصويرك"
          description="عاين القالب كواجهة Desktop وMobile قبل التفعيل. تغيير القالب لا يحذف صورك أو بياناتك."
        />
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
  const palette =
    template.themeCode === "noir-gold"
      ? ["#0b0d12", "#f3cf73", "#fff7e8"]
      : ["#fff4f5", "#d88a9a", "#34252a"];

  return (
    <Card className={isCurrent ? "border-champagne/40" : undefined}>
      <div
        className="relative overflow-hidden rounded-t-[var(--radius-card)] border-b border-border bg-muted"
        style={{ minHeight: 210 }}
      >
        {isCurrent ? (
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-bold text-black">
            <CheckCircle2 className="size-3.5" aria-hidden />
            مفعل الآن
          </div>
        ) : null}
        <div className="absolute inset-4 rounded-2xl border border-white/10 p-3 shadow-2xl" style={{ background: palette[0] }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              <span className="size-2 rounded-full bg-white/30" />
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/10" />
            </div>
            <Monitor className="size-4 text-white/45" aria-hidden />
          </div>
          <div className="grid grid-cols-[1.4fr_0.8fr] gap-3">
            <div>
              <div className="mb-3 h-5 w-28 rounded-full" style={{ background: palette[1] }} />
              <div className="mb-2 h-3 w-full rounded-full bg-white/35" />
              <div className="mb-4 h-3 w-4/5 rounded-full bg-white/20" />
              <div className="grid grid-cols-3 gap-2">
                <span className="aspect-square rounded-lg bg-white/15" />
                <span className="aspect-square rounded-lg bg-white/25" />
                <span className="aspect-square rounded-lg bg-white/15" />
              </div>
            </div>
            <div className="relative mx-auto h-32 w-16 rounded-2xl border border-white/20 bg-black/25 p-1">
              <Smartphone className="absolute -top-6 left-1/2 size-4 -translate-x-1/2 text-white/45" aria-hidden />
              <div className="size-full rounded-xl" style={{ background: palette[2] }}>
                <div className="mx-auto mt-2 h-2 w-8 rounded-full" style={{ background: palette[1] }} />
                <div className="mx-2 mt-3 aspect-square rounded-lg bg-black/20" />
                <div className="mx-2 mt-2 h-2 rounded-full bg-black/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
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
        <div className="flex flex-wrap gap-2">
          {palette.map((color) => (
            <span
              key={color}
              className="size-6 rounded-full border border-border"
              style={{ background: color }}
              title={color}
            />
          ))}
          <Badge tone="neutral">متجاوب</Badge>
          <Badge tone="neutral">معاينة موبايل</Badge>
        </div>
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
