"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface ArrayEditorProps {
  label: string;
  value: unknown[];
  onChange: (value: unknown[]) => void;
  style?: React.CSSProperties;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function ArrayItemEditor({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: unknown;
  index: number;
  onChange: (v: unknown) => void;
  onRemove: () => void;
}) {
  if (typeof item === "string") {
    const [val, setVal] = useState(item);
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-white/30 min-w-[20px]">{index + 1}.</span>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => onChange(val)}
          className="flex h-8 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50 focus:bg-white/[0.06]"
        />
        <button type="button" onClick={onRemove} className="shrink-0 text-white/30 hover:text-danger transition p-1">
          <Trash2 className="size-3.5" />
        </button>
      </div>
    );
  }

  if (isPlainObject(item)) {
    const keys = Object.keys(item);
    return (
      <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-white/30">العنصر {index + 1}</span>
          <button type="button" onClick={onRemove} className="text-white/30 hover:text-danger transition p-1">
            <Trash2 className="size-3.5" />
          </button>
        </div>
        <div className="space-y-1">
          {keys.map((key) => {
            const [val, setVal] = useState(String(item[key] ?? ""));
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[11px] text-white/40 min-w-16">{key}</span>
                <input
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  onBlur={() => {
                    const updated = { ...item, [key]: val };
                    onChange(updated);
                  }}
                  className="flex h-7 w-full rounded-md border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none transition focus:border-champagne/50"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-white/30">{index}.</span>
      <input
        defaultValue={String(item)}
        onBlur={(e) => onChange(e.target.value)}
        className="flex h-8 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-champagne/50"
      />
      <button type="button" onClick={onRemove} className="shrink-0 text-white/30 hover:text-danger transition p-1">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export function ArrayEditor({ label, value, onChange, style }: ArrayEditorProps) {
  const [expanded, setExpanded] = useState(false);

  const items = value ?? [];

  const handleItemChange = (index: number, newValue: unknown) => {
    const next = [...items];
    next[index] = newValue;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleAdd = () => {
    let newItem: unknown;
    if (items.length > 0 && isPlainObject(items[0])) {
      newItem = {};
    } else {
      newItem = "";
    }
    onChange([...items, newItem]);
  };

  return (
    <div className="py-2" style={style}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition"
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
          ◀
        </span>
        {label}
        <span className="text-[11px] text-white/30">({items.length})</span>
      </button>
      {expanded && (
        <div className="mr-4 mt-2 space-y-2 border-r border-white/10 pr-4">
          {items.map((item, index) => (
            <ArrayItemEditor
              key={index}
              item={item}
              index={index}
              onChange={(v) => handleItemChange(index, v)}
              onRemove={() => handleRemove(index)}
            />
          ))}
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 text-xs text-champagne hover:text-champagne/80 transition"
          >
            <Plus className="size-3" />
            إضافة عنصر
          </button>
        </div>
      )}
    </div>
  );
}
