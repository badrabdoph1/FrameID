"use client"

import { CheckCircle2, Circle, ExternalLink, Eye, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model"

export function DashboardHomeClient({
  photographerName,
  siteTitle,
  siteSlug,
  siteUrl,
  statusLabel,
  percent,
  checklist,
  stats,
  lastModified,
  currentTheme,
  isPublished,
  nextStepHref,
  nextStepLabel,
}: DashboardViewModel) {
  const doneCount = checklist.filter((i) => i.done).length

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 900 }}>
      {/* Welcome */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: 16,
          border: "1px solid rgba(245, 234, 214, 0.1)",
          background: "linear-gradient(135deg, rgba(243, 207, 115, 0.08), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span style={{ color: "#f3cf73", fontSize: "0.75rem", fontWeight: 950 }}>
              {statusLabel}
            </span>
            <h1 style={{ color: "#fff7e8", fontSize: "1.4rem", fontWeight: 950, margin: "4px 0 2px" }}>
              مرحباً، {photographerName}
            </h1>
            <p style={{ color: "rgba(245, 234, 214, 0.65)", fontSize: "0.85rem", margin: 0 }}>
              أكمل الخطوات التالية لنشر موقعك.
            </p>
          </div>
          <Link
            href={`/p/${siteSlug}`}
            target="_blank"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(245, 234, 214, 0.12)",
              color: "rgba(245, 234, 214, 0.8)",
              fontSize: "0.8rem",
              fontWeight: 900,
              textDecoration: "none",
              transition: "background 0.15s",
            }}
          >
            <Eye size={15} />
            معاينة
          </Link>
        </div>
      </div>

      {/* Progress Section */}
      <div
        style={{
          padding: "20px",
          borderRadius: 16,
          border: "1px solid rgba(245, 234, 214, 0.08)",
          background: "rgba(255, 255, 255, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Circular Progress */}
          <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(245, 234, 214, 0.08)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - percent / 100)}`}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f3cf73" />
                  <stop offset="100%" stopColor="#d4af37" />
                </linearGradient>
              </defs>
            </svg>
            <span style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", fontWeight: 950, color: "#fff7e8",
            }}>
              {percent}%
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ color: "#fff7e8", fontSize: "1rem", fontWeight: 950, margin: 0 }}>
              تقدم الموقع
            </h2>
            <p style={{ color: "rgba(245, 234, 214, 0.55)", fontSize: "0.82rem", margin: "4px 0 12px" }}>
              {doneCount} من {checklist.length} مكتملة &middot; آخر تعديل {lastModified}
            </p>
            <Link
              href={nextStepHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #f3cf73, #d4af37)",
                color: "#17120a",
                fontSize: "0.88rem",
                fontWeight: 950,
                textDecoration: "none",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              {percent === 100 && isPublished ? "✓ تم النشر" : `أكمل: ${nextStepLabel}`}
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(245, 234, 214, 0.08)",
          background: "rgba(255, 255, 255, 0.03)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(245, 234, 214, 0.06)" }}>
          <h3 style={{ color: "#fff7e8", fontSize: "0.9rem", fontWeight: 950, margin: 0 }}>
            قائمة المهام
          </h3>
        </div>
        <div>
          {checklist.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              target={item.id === "review" ? "_blank" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 18px",
                borderBottom: "1px solid rgba(245, 234, 214, 0.04)",
                textDecoration: "none",
                color: item.done ? "rgba(245, 234, 214, 0.5)" : "rgba(245, 234, 214, 0.85)",
                fontSize: "0.85rem",
                fontWeight: item.done ? 850 : 900,
                transition: "background 0.1s",
              }}
            >
              {item.done ? (
                <CheckCircle2 size={18} style={{ color: "#4ade80", flexShrink: 0 }} />
              ) : (
                <Circle size={18} style={{ color: "rgba(245, 234, 214, 0.15)", flexShrink: 0 }} />
              )}
              <span style={{ textDecoration: item.done ? "line-through" : "none" }}>
                {item.label}
              </span>
              <ExternalLink size={12} style={{ marginRight: "auto", color: "rgba(245, 234, 214, 0.2)", flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid rgba(245, 234, 214, 0.08)",
              background: "rgba(255, 255, 255, 0.03)",
            }}
          >
            <p style={{ color: "rgba(245, 234, 214, 0.5)", fontSize: "0.72rem", fontWeight: 950, margin: 0 }}>
              {stat.label}
            </p>
            <p style={{
              color: stat.tone === "success" ? "#4ade80" : stat.tone === "warning" ? "#f3cf73" : "#fff7e8",
              fontSize: "1.3rem",
              fontWeight: 950,
              margin: "4px 0 0",
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Site URL + Quick Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 18px",
          borderRadius: 14,
          border: "1px solid rgba(245, 234, 214, 0.08)",
          background: "rgba(255, 255, 255, 0.03)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <span style={{ color: "rgba(245, 234, 214, 0.5)", fontSize: "0.78rem", fontWeight: 950, flexShrink: 0 }}>
            رابطك:
          </span>
          <Link
            href={siteUrl}
            target="_blank"
            dir="ltr"
            style={{
              color: "#f3cf73",
              fontSize: "0.82rem",
              fontWeight: 900,
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {siteUrl}
          </Link>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/dashboard/publish"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              border: "1px solid rgba(245, 234, 214, 0.12)",
              color: "rgba(245, 234, 214, 0.8)",
              fontSize: "0.78rem",
              fontWeight: 900,
              textDecoration: "none",
              transition: "background 0.15s",
            }}
          >
            <Send size={14} />
            نشر
          </Link>
        </div>
      </div>
    </div>
  )
}
