"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({
  children,
  pendingText,
  className,
  ...props
}: {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={`min-h-11 ${className ?? ""} ${pending ? "pointer-events-none opacity-60" : ""}`}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function PendingForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form action={action} className={className}>
      {children}
    </form>
  );
}
