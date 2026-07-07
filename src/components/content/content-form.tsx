"use client";

import { useState, useCallback } from "react";
import { TextField } from "@/components/content/text-field";
import { TextareaField } from "@/components/content/textarea-field";
import { ArrayEditor } from "@/components/content/array-editor";

interface ContentFormProps {
  data: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
}

const META_KEYS = new Set(["_version", "_updatedAt", "$schema"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function getFieldType(value: unknown): "string" | "number" | "boolean" | "array" | "object" | "text" {
  if (typeof value === "string" && value.length > 80) return "text";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (isRecord(value)) return "object";
  return "string";
}

function FieldEditor({
  name,
  value,
  onChange,
  depth = 0,
}: {
  name: string;
  value: unknown;
  onChange: (v: unknown) => void;
  depth?: number;
}) {
  const type = getFieldType(value);
  const indent = depth * 12;

  if (type === "string") {
    return (
      <TextField
        label={name}
        value={value as string}
        onChange={(v) => onChange(v)}
        style={{ marginRight: indent }}
      />
    );
  }

  if (type === "text") {
    return (
      <TextareaField
        label={name}
        value={value as string}
        onChange={(v) => onChange(v)}
        style={{ marginRight: indent }}
      />
    );
  }

  if (type === "number") {
    return (
      <TextField
        label={name}
        value={String(value)}
        type="number"
        onChange={(v) => onChange(Number(v))}
        style={{ marginRight: indent }}
      />
    );
  }

  if (type === "boolean") {
    const [checked, setChecked] = useState(value as boolean);
    return (
      <div className="flex items-center gap-3 py-2" style={{ marginRight: indent }}>
        <label className="text-sm text-white/60 min-w-24">{name}</label>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => {
            const next = !checked;
            setChecked(next);
            onChange(next);
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            checked ? "bg-champagne" : "bg-white/20"
          }`}
        >
          <span
            className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-white/40">{checked ? "نعم" : "لا"}</span>
      </div>
    );
  }

  if (type === "array") {
    return (
      <ArrayEditor
        label={name}
        value={value as unknown[]}
        onChange={(v) => onChange(v)}
        style={{ marginRight: indent }}
      />
    );
  }

  if (type === "object") {
    return (
      <ObjectEditor
        label={name}
        value={value as Record<string, unknown>}
        onChange={(v) => onChange(v)}
        depth={depth + 1}
      />
    );
  }

  return null;
}

function ObjectEditor({
  label,
  value,
  onChange,
  depth = 0,
}: {
  label: string;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  const handleFieldChange = useCallback(
    (key: string, fieldValue: unknown) => {
      onChange({ ...value, [key]: fieldValue });
    },
    [value, onChange]
  );

  const keys = Object.keys(value);

  return (
    <div className="py-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition"
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
          ◀
        </span>
        {label}
      </button>
      {expanded && (
        <div className="mr-4 mt-2 space-y-1 border-r border-white/10 pr-4">
          {keys.map((key) => (
            <FieldEditor
              key={key}
              name={key}
              value={value[key]}
              onChange={(v) => handleFieldChange(key, v)}
              depth={depth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContentForm({ data, onSave }: ContentFormProps) {
  const [formData, setFormData] = useState(() => ({ ...data }));

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const keys = Object.keys(formData as Record<string, unknown>).filter(
    (k) => !META_KEYS.has(k)
  );

  return (
    <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
      <div className="space-y-2">
        {keys.map((key) => (
          <FieldEditor
            key={key}
            name={key}
            value={(formData as Record<string, unknown>)[key]}
            onChange={(v) => handleFieldChange(key, v)}
          />
        ))}
      </div>
      <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => onSave(formData)}
          className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-champagne px-6 text-sm font-semibold text-ink transition hover:bg-champagne/90"
        >
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
}
