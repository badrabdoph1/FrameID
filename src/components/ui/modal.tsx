"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export type ModalProps = HTMLAttributes<HTMLDivElement> & {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

const sizeMap: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[95vw] h-[90vh]",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  className,
  children,
  footer,
  ref,
  ...props
}: ModalProps) {
  const dialogId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${dialogId}-title` : undefined}
    >
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-col rounded-[var(--radius-panel)] border border-white/10 bg-[#0f0f0f] shadow-2xl animate-fade-in",
          sizeMap[size],
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            {title && (
              <h2
                id={`${dialogId}-title`}
                className="text-lg font-semibold text-white"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-white/60">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-[var(--radius-control)] text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
