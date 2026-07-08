"use client";

import { CheckCircle2, Circle, ExternalLink, Eye, Send } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type ProgressDashboardProps = {
  percent: number;
  items: ChecklistItem[];
  nextStepHref: string;
  nextStepLabel: string;
  stats: Array<{ label: string; value: string | number }>;
  siteUrl?: string;
  onPreview?: () => void;
  onPublish?: () => void;
  isPublished?: boolean;
};

function CircularProgress({ percent }: { percent: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <svg
        width="128"
        height="128"
        viewBox="0 0 128 128"
        className="-rotate-90"
      >
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="rgba(245, 234, 214, 0.1)"
          strokeWidth="8"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#progress-gold)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="progress-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3cf73" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-2xl font-bold text-foreground">
        {percent}%
      </span>
    </div>
  );
}

export function ProgressDashboard({
  percent,
  items,
  nextStepHref,
  nextStepLabel,
  stats,
  siteUrl,
  onPreview,
  onPublish,
  isPublished,
}: ProgressDashboardProps) {
  const doneCount = items.filter((i) => i.done).length;
  const isReady = percent === 100;

  return (
    <div className="space-y-6">
      {/* Progress + CTA */}
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-right">
        <CircularProgress percent={percent} />
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              تقدم الموقع
            </h2>
            <p className="text-sm text-muted-foreground">
              {doneCount} من {items.length} مكتملة
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {!isReady ? (
              <Link
                href={nextStepHref}
                className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-champagne px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-champagne-strong"
              >
                {nextStepLabel}
              </Link>
            ) : isPublished ? (
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-muted-foreground">
                <CheckCircle2 className="size-4" />
                تم النشر
              </span>
            ) : (
              <>
                {siteUrl && onPreview && (
                  <Link
                    href={siteUrl}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    <Eye className="size-4" />
                    معاينة
                  </Link>
                )}
                {onPublish && (
                  <button
                    type="button"
                    onClick={onPublish}
                    className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-champagne px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-champagne-strong"
                  >
                    <Send className="size-4" />
                    نشر الموقع
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-5 py-3.5 text-sm transition hover:bg-muted/30",
                  item.done
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" />
                ) : (
                  <Circle className="size-5 shrink-0 text-border" />
                )}
                <span
                  className={cn(
                    item.done && "line-through opacity-60",
                  )}
                >
                  {item.label}
                </span>
                <ExternalLink className="mr-auto size-3.5 shrink-0 opacity-40" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius-panel)] border border-border bg-surface px-4 py-3"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Site URL + Publish status */}
      {siteUrl && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-muted-foreground shrink-0">
              رابط الموقع:
            </span>
            <Link
              href={siteUrl}
              target="_blank"
              className="truncate text-sm text-champagne underline underline-offset-2 transition hover:text-champagne/80"
              dir="ltr"
            >
              {siteUrl}
            </Link>
          </div>
          <Badge tone={isPublished ? "success" : "neutral"}>
            {isPublished ? "منشور" : "مسودة"}
          </Badge>
        </div>
      )}
    </div>
  );
}
