"use client";

import type { CSSProperties, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

type NoticeTone = "success" | "error" | "warning" | "info";

const toneStyles: Record<NoticeTone, { color: string; background: string; border: string; icon: ReactNode }> = {
  success: {
    color: "#4ade80",
    background: "rgba(74, 222, 128, 0.07)",
    border: "rgba(74, 222, 128, 0.22)",
    icon: <CheckCircle2 size={16} />,
  },
  error: {
    color: "#f87171",
    background: "rgba(248, 113, 113, 0.08)",
    border: "rgba(248, 113, 113, 0.24)",
    icon: <XCircle size={16} />,
  },
  warning: {
    color: "#f3cf73",
    background: "rgba(243, 207, 115, 0.08)",
    border: "rgba(243, 207, 115, 0.22)",
    icon: <AlertTriangle size={16} />,
  },
  info: {
    color: "rgba(245, 234, 214, 0.72)",
    background: "rgba(255, 255, 255, 0.04)",
    border: "rgba(245, 234, 214, 0.1)",
    icon: <Info size={16} />,
  },
};

export function BuilderPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow ? (
          <p
            style={{
              margin: "0 0 6px",
              color: "#f3cf73",
              fontSize: "0.72rem",
              fontWeight: 950,
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          style={{
            color: "#fff7e8",
            fontSize: "clamp(1.35rem, 4vw, 2rem)",
            lineHeight: 1.2,
            fontWeight: 950,
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            color: "rgba(245, 234, 214, 0.6)",
            fontSize: "0.88rem",
            lineHeight: 1.7,
            margin: "8px 0 0",
            maxWidth: 660,
          }}
        >
          {description}
        </p>
      </div>
      {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
    </section>
  );
}

export function BuilderSectionCard({
  title,
  description,
  icon,
  children,
  status,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  status?: ReactNode;
}) {
  return (
    <section style={cardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          borderBottom: "1px solid rgba(245, 234, 214, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
          {icon ? <div style={iconBoxStyle}>{icon}</div> : null}
          <div>
            <h2 style={{ color: "#fff7e8", fontSize: "0.95rem", fontWeight: 950, margin: 0 }}>
              {title}
            </h2>
            {description ? (
              <p style={{ color: "rgba(245, 234, 214, 0.5)", fontSize: "0.78rem", lineHeight: 1.6, margin: "4px 0 0" }}>
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {status ? <div style={{ flexShrink: 0 }}>{status}</div> : null}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

export function BuilderNotice({
  tone,
  title,
  description,
  errorId,
}: {
  tone: NoticeTone;
  title: string;
  description?: string;
  errorId?: string;
}) {
  const style = toneStyles[tone];
  const role = tone === "error" || tone === "warning" ? "alert" : "status";

  return (
    <div
      role={role}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        borderRadius: 14,
        border: `1px solid ${style.border}`,
        background: style.background,
        color: style.color,
        padding: "12px 14px",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>{style.icon}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 950 }}>{title}</p>
        {description ? (
          <p style={{ margin: "4px 0 0", color: "rgba(245, 234, 214, 0.58)", fontSize: "0.78rem", lineHeight: 1.6 }}>
            {description}
          </p>
        ) : null}
        {errorId ? (
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            <code style={{ color: "rgba(245, 234, 214, 0.42)", fontSize: "0.72rem" }}>
              Error ID: {errorId}
            </code>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(errorId)}
                style={noticeButtonStyle}
              >
                انسخ الخطأ
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={noticeButtonStyle}
              >
                جرب تاني
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AutoSavePill({
  state,
}: {
  state: "idle" | "saving" | "saved" | "error";
}) {
  const label =
    state === "saving"
      ? "بيحفظ…"
      : state === "saved"
        ? "اتحفظ"
        : state === "error"
          ? "مقدرناش نحفظ"
          : "حفظ تلقائي";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        color: state === "error" ? "#f87171" : state === "saved" ? "#4ade80" : "rgba(245, 234, 214, 0.5)",
        fontSize: "0.72rem",
        fontWeight: 900,
      }}
    >
      {state === "saving" ? <Loader2 size={12} className="animate-spin" /> : null}
      {label}
    </span>
  );
}

export function CompletionRing({ percent }: { percent: number }) {
  const safePercent = Math.max(0, Math.min(100, percent));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ position: "relative", width: 112, height: 112, flexShrink: 0 }}>
      <svg width="112" height="112" viewBox="0 0 112 112" style={{ transform: "rotate(-90deg)" }} aria-hidden>
        <circle cx="56" cy="56" r={radius} fill="none" stroke="rgba(245, 234, 214, 0.08)" strokeWidth="9" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="#f3cf73"
          strokeLinecap="round"
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - safePercent / 100)}
        />
      </svg>
      <strong
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          color: "#fff7e8",
          fontSize: "1.55rem",
          fontWeight: 950,
        }}
      >
        {safePercent}%
      </strong>
    </div>
  );
}

const cardStyle = {
  overflow: "hidden",
  borderRadius: 16,
  border: "1px solid rgba(245, 234, 214, 0.08)",
  background: "rgba(255, 255, 255, 0.03)",
} satisfies CSSProperties;

const iconBoxStyle = {
  display: "grid",
  placeItems: "center",
  width: 34,
  height: 34,
  borderRadius: 10,
  background: "rgba(243, 207, 115, 0.1)",
  color: "#f3cf73",
  flexShrink: 0,
} satisfies CSSProperties;

const noticeButtonStyle = {
  minHeight: 30,
  borderRadius: 8,
  border: "1px solid rgba(245, 234, 214, 0.12)",
  background: "rgba(0, 0, 0, 0.16)",
  color: "rgba(245, 234, 214, 0.78)",
  padding: "0 10px",
  fontSize: "0.72rem",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
} satisfies CSSProperties;
