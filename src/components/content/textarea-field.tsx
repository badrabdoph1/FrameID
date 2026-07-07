"use client";

import { useState } from "react";

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

export function TextareaField({ label, value, onChange, style }: TextareaFieldProps) {
  const [local, setLocal] = useState(value);

  return (
    <div className="flex gap-3 py-1.5" style={style}>
      <label className="text-sm text-white/60 min-w-24 shrink-0 pt-2">{label}</label>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local)}
        rows={3}
        className="flex w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50 focus:bg-white/[0.06] resize-y"
      />
    </div>
  );
}
