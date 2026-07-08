"use client";

import type { CSSProperties } from "react";

import { WORKING_DAYS } from "@/modules/dashboard/working-hours";

type WorkingHoursEditorProps = {
  value: Record<string, string> | null;
  onBlur?: () => void;
};

function parseStoredRange(value: string | undefined): {
  enabled: boolean;
  from: string;
  to: string;
  note: string;
} {
  if (!value || value === "مغلق") {
    return { enabled: false, from: "09:00", to: "17:00", note: "" };
  }

  const range = value.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/u);
  if (range) {
    return { enabled: true, from: range[1], to: range[2], note: "" };
  }

  return { enabled: true, from: "09:00", to: "17:00", note: value };
}

export function WorkingHoursEditor({ value, onBlur }: WorkingHoursEditorProps) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p
        style={{
          margin: 0,
          color: "rgba(245, 234, 214, 0.55)",
          fontSize: "0.78rem",
          lineHeight: 1.6,
        }}
      >
        اختر الأيام المفتوحة وساعات العمل. إذا كان اليوم يعتمد على الحجز فقط،
        اكتب ذلك في خانة الملاحظة.
      </p>

      <div style={{ display: "grid", gap: 8 }}>
        {WORKING_DAYS.map(([key, label]) => {
          const row = parseStoredRange(value?.[label]);
          return (
            <div
              key={key}
              style={{
                display: "grid",
                gap: 8,
                gridTemplateColumns: "minmax(92px, 1fr) minmax(0, 2fr)",
                alignItems: "center",
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(245, 234, 214, 0.07)",
                background: "rgba(0, 0, 0, 0.12)",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#fff7e8",
                  fontSize: "0.82rem",
                  fontWeight: 900,
                }}
              >
                <input
                  type="checkbox"
                  name={`hours-${key}-enabled`}
                  defaultChecked={row.enabled}
                  onBlur={onBlur}
                />
                {label}
              </label>

              <div
                style={{
                  display: "grid",
                  gap: 6,
                  gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
                }}
              >
                <input
                  type="time"
                  name={`hours-${key}-from`}
                  defaultValue={row.from}
                  onBlur={onBlur}
                  aria-label={`${label} من`}
                  style={inputStyle}
                />
                <input
                  type="time"
                  name={`hours-${key}-to`}
                  defaultValue={row.to}
                  onBlur={onBlur}
                  aria-label={`${label} إلى`}
                  style={inputStyle}
                />
                <input
                  name={`hours-${key}-note`}
                  defaultValue={row.note}
                  onBlur={onBlur}
                  placeholder="ملاحظة اختيارية"
                  aria-label={`${label} ملاحظة`}
                  style={inputStyle}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle = {
  minHeight: 36,
  minWidth: 0,
  width: "100%",
  borderRadius: 8,
  border: "1px solid rgba(245, 234, 214, 0.08)",
  background: "rgba(255, 255, 255, 0.04)",
  color: "#fff7e8",
  padding: "0 10px",
  fontSize: "0.78rem",
  fontFamily: "inherit",
} satisfies CSSProperties;
