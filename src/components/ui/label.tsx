import React, { type LabelHTMLAttributes, type Ref } from "react";

import { cn } from "@/lib/utils/cn";

export function Label({
  className,
  ref,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { ref?: Ref<HTMLLabelElement> }) {
  return (
    <label
      ref={ref}
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}
