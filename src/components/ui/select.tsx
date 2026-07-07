"use client";

import { type Ref, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  ref?: Ref<HTMLSelectElement>;
};

export function Select({
  options,
  value: controlledValue,
  defaultValue,
  onValueChange,
  placeholder = "اختر...",
  error,
  disabled,
  className,
  ref,
}: SelectProps) {
  const generatedId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  return (
    <div className="relative">
      <select
        ref={ref}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onValueChange?.(v);
          if (!isControlled) setInternalValue(v);
        }}
        disabled={disabled}
        className={cn(
          "min-h-11 w-full appearance-none rounded-[var(--radius-control)] border border-white/10 bg-white/5 px-3 pl-10 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger",
          className,
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0f0f0f]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
