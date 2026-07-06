import React, { type InputHTMLAttributes, type Ref } from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

export function Input({ className, error, id, ref, ...props }: InputProps) {
  return (
    <div>
      <input
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        className={cn(
          "min-h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger focus-visible:ring-danger",
          className
        )}
        {...props}
      />
      {error && id ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
