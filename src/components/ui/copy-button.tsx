"use client";

import React, { useState, useCallback } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  return (
    <button
      type="button"
      onClick={copy}
      className="mr-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title="نسخ المرجع"
    >
      {copied ? "تم النسخ" : "نسخ"}
    </button>
  );
}
