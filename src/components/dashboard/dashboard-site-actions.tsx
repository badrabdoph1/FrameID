"use client";

import Link from "next/link";
import React, { useState } from "react";
import { CheckCircle2, Copy, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type DashboardSiteActionsProps = {
  siteUrl: string;
};

export function DashboardSiteActions({ siteUrl }: DashboardSiteActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copySiteUrl() {
    await navigator.clipboard.writeText(siteUrl);
    setCopied(true);
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Button type="button" variant="secondary" onClick={copySiteUrl}>
        {copied ? (
          <CheckCircle2 className="size-4 text-success" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
        {copied ? "تم النسخ" : "نسخ الرابط"}
      </Button>
      <Link
        href="/dashboard/content"
        className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-soft transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <WandSparkles className="size-4" aria-hidden />
        تعديل الموقع
      </Link>
    </div>
  );
}
