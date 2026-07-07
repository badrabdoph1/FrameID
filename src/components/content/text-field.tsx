"use client";

import { useState } from "react";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  style?: React.CSSProperties;
}

export function TextField({ label, value, onChange, type = "text", style }: TextFieldProps) {
  const [local, setLocal] = useState(value);

  return (
    <div className="flex items-center gap-3 py-1.5" style={style}>
      <label className="text-sm text-white/60 min-w-24 shrink-0">{label}</label>
      <input
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local)}
        className="flex h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50 focus:bg-white/[0.06]"
      />
    </div>
  );
}
