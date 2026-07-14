"use client";

import { useEffect, useRef } from "react";

import type { EditableTextField } from "@/components/marketing/home-page-renderer";
import { cn } from "@/lib/utils/cn";

type InlineEditableTextProps = {
  field: EditableTextField;
  onCommit: (field: EditableTextField, value: string) => void;
};

export function InlineEditableText({ field, onCommit }: InlineEditableTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.textContent !== field.value) {
      ref.current.textContent = field.value;
    }
  }, [field.value]);

  return (
    <span
      ref={ref}
      role="textbox"
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      aria-label="تعديل النص"
      className={cn(
        "-mx-1 rounded-md px-1 outline-none transition",
        "hover:bg-amber-300/12 focus:bg-amber-200/16 focus:ring-2 focus:ring-amber-300/70",
        "empty:before:text-current empty:before:opacity-45 empty:before:content-['اكتب_النص']",
      )}
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => {
        const value = event.currentTarget.textContent?.trim() ?? "";
        if (value && value !== field.value) onCommit(field, value);
        else if (!value) event.currentTarget.textContent = field.value;
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.currentTarget.textContent = field.value;
          event.currentTarget.blur();
          return;
        }

        if (event.key === "Enter" && (!field.multiline || event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    >
      {field.value}
    </span>
  );
}
