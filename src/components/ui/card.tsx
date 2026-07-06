import React, { type HTMLAttributes, type Ref } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <section
      ref={ref}
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-card text-card-foreground shadow-soft",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardTitle({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { ref?: Ref<HTMLHeadingElement> }) {
  return (
    <h3
      ref={ref}
      className={cn("text-base font-semibold tracking-normal", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />;
}
