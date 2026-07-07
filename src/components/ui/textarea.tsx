import { type Ref } from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
};

export function Textarea({ className, error, id, ref, ...props }: TextareaProps) {
  return (
    <div>
      <textarea
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        className={cn(
          "min-h-[120px] w-full resize-y rounded-[var(--radius-control)] border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger focus-visible:ring-danger",
          className,
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
