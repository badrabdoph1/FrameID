"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { cn } from "@/lib/utils/cn";

type TabsContextType = {
  value: string;
  onValueChange: (v: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

export function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
  className,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  return (
    <TabsContext.Provider
      value={{
        value,
        onValueChange: (v: string) => {
          onValueChange?.(v);
          if (!isControlled) setInternalValue(v);
        },
      }}
    >
      <div className={cn("", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-panel)] bg-white/5 p-1",
        className,
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = ctx.value === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "rounded-[var(--radius-control)] px-4 py-2 text-sm font-medium transition",
        isActive
          ? "bg-white/10 text-white shadow-sm"
          : "text-white/50 hover:text-white/80",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");

  if (ctx.value !== value) return null;

  return (
    <div role="tabpanel" className={cn("mt-4", className)}>
      {children}
    </div>
  );
}
