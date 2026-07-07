"use client";

import { type Ref, useId } from "react";
import { cn } from "@/lib/utils/cn";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
  label,
  className,
  ref,
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <label
          htmlFor={switchId}
          className="cursor-pointer text-sm text-white/70"
        >
          {label}
        </label>
      )}
      <button
        ref={ref}
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
          checked ? "bg-champagne" : "bg-white/20",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-[4px]",
          )}
        />
      </button>
    </div>
  );
}
