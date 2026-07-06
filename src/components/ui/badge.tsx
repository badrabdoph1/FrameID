import React, { type HTMLAttributes, type Ref } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        success: "border-success/20 bg-success-soft text-success",
        warning: "border-warning/20 bg-warning-soft text-warning",
        danger: "border-danger/20 bg-danger-soft text-danger",
        luxury: "border-champagne/25 bg-champagne-soft text-champagne-strong"
      }
    },
    defaultVariants: {
      tone: "neutral"
    }
  }
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    ref?: Ref<HTMLSpanElement>;
  };

export function Badge({ className, tone, ref, ...props }: BadgeProps) {
  return (
    <span ref={ref} className={cn(badgeVariants({ tone, className }))} {...props} />
  );
}
