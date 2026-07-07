"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils/cn";

type DropdownContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const DropdownContext = createContext<DropdownContextType>({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className,
  asChild,
}: {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const { open, setOpen } = useContext(DropdownContext);

  if (asChild) {
    return (
      <span onClick={() => setOpen(!open)} className={className}>
        {children}
      </span>
    );
  }

  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align = "end",
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "end";
}) {
  const { open, setOpen } = useContext(DropdownContext);
  const ref = useRef<HTMLDivElement>(null);

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (!ref.current?.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    },
    [setOpen],
  );

  if (!open) return null;

  return (
    <div
      ref={ref}
      onBlur={handleBlur}
      className={cn(
        "absolute z-50 mt-1 min-w-[12rem] overflow-hidden rounded-[var(--radius-panel)] border border-white/10 bg-[#0f0f0f] p-1 shadow-xl animate-fade-in",
        align === "end" ? "left-0" : "right-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  destructive,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const { setOpen } = useContext(DropdownContext);

  return (
    <button
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white",
        destructive && "text-danger hover:bg-danger/10 hover:text-danger",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 border-t border-white/10" />;
}

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-xs font-medium text-white/40",
        className,
      )}
    >
      {children}
    </div>
  );
}
