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

function StringItem({
  value,
  index,
  onChange,
  onRemove,
}: {
  value: string;
  index: number;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  const [val, setVal] = useState(value);
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

function ObjectItem({
  value,
  index,
  onChange,
  onRemove,
}: {
  value: Record<string, unknown>;
  index: number;
  onChange: (v: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const keys = Object.keys(value);
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const k of keys) {
      initial[k] = String(value[k] ?? "");
    }
    return initial;
  });

  const handleBlur = () => {
    const updated: Record<string, unknown> = { ...value };
    for (const k of keys) {
      updated[k] = vals[k];
    }
    onChange(updated);
  };

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-white/30">العنصر {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-white/30 hover:text-danger transition p-1">
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[11px] text-white/40 min-w-16">{key}</span>
            <input
              value={vals[key] ?? ""}
              onChange={(e) => setVals((prev) => ({ ...prev, [key]: e.target.value }))}
              onBlur={handleBlur}
              className="flex h-7 w-full rounded-md border border-white/10 bg-white/[0.04] px-2 text-sm text-white outline-none transition focus:border-champagne/50"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericItem({
  value,
  index,
  onChange,
  onRemove,
}: {
  value: unknown;
  index: number;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  const [val, setVal] = useState(String(value));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-white/30">{index}.</span>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onChange(val)}
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
          {items.map((item, index) => {
            if (typeof item === "string") {
              return (
                <StringItem
                  key={index}
                  value={item}
                  index={index}
                  onChange={(v) => handleItemChange(index, v)}
                  onRemove={() => handleRemove(index)}
                />
              );
            }
            if (isPlainObject(item)) {
              return (
                <ObjectItem
                  key={index}
                  value={item}
                  index={index}
                  onChange={(v) => handleItemChange(index, v)}
                  onRemove={() => handleRemove(index)}
                />
              );
            }
            return (
              <GenericItem
                key={index}
                value={item}
                index={index}
                onChange={(v) => handleItemChange(index, v)}
                onRemove={() => handleRemove(index)}
              />
            );
          })}
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
