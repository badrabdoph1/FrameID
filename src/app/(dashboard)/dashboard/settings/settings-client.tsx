"use client";

import {
  User,
  Globe2,
  Link2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

import { SlugEditor } from "@/components/dashboard/slug-editor";

type SettingsClientProps = {
  userName: string;
  userEmail: string;
  userRole: string;
  siteTitle: string;
  siteSlug: string;
  siteStatus: string;
  siteUrl: string;
  slugChangeUsed: boolean;
};

function sectionBox(children: React.ReactNode) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: "1px solid rgba(245, 234, 214, 0.08)",
        background: "rgba(255, 255, 255, 0.03)",
      }}
    >
      {children}
    </div>
  );
}

function sectionTitle(icon: React.ReactNode, label: string) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
      }}
    >
      <div style={{ color: "#f3cf73", flexShrink: 0 }}>{icon}</div>
      <h2
        style={{
          color: "#fff7e8",
          fontSize: "0.95rem",
          fontWeight: 950,
          margin: 0,
        }}
      >
        {label}
      </h2>
    </div>
  );
}

function readOnlyRow(label: string, value: string) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid rgba(245, 234, 214, 0.06)",
        background: "rgba(0,0,0,0.15)",
      }}
    >
      <span
        style={{
          color: "rgba(245, 234, 214, 0.5)",
          fontSize: "0.8rem",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "#fff7e8",
          fontSize: "0.85rem",
          fontWeight: 700,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "60%",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "مسودة", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.1)" },
  PUBLISHED: { label: "منشور", color: "#4ade80", bg: "rgba(74, 222, 128, 0.1)" },
  EXPIRED: { label: "منتهي", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
  SUSPENDED: { label: "معلق", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
};

const roleLabel: Record<string, string> = {
  ADMIN: "مدير",
  USER: "مستخدم",
  SUPER_ADMIN: "مدير عام",
};

export function SettingsClient({
  userName,
  userEmail,
  userRole,
  siteTitle,
  siteSlug,
  siteStatus,
  siteUrl,
  slugChangeUsed,
}: SettingsClientProps) {
  const badge = statusBadge[siteStatus] ?? {
    label: siteStatus,
    color: "rgba(245, 234, 214, 0.5)",
    bg: "rgba(245, 234, 214, 0.05)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      <section>
        <h1
          style={{
            color: "#fff7e8",
            fontSize: "1.4rem",
            fontWeight: 950,
            margin: 0,
          }}
        >
          الإعدادات
        </h1>
        <p
          style={{
            color: "rgba(245, 234, 214, 0.65)",
            fontSize: "0.85rem",
            margin: "4px 0 0",
          }}
        >
          معلومات حسابك وموقعك.
        </p>
      </section>

      {/* ─── 1. الحساب ─── */}
      {sectionBox(
        <>
          {sectionTitle(<User size={16} />, "الحساب")}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {readOnlyRow("الاسم", userName)}
            {readOnlyRow("البريد", userEmail)}
            {readOnlyRow("الدور", roleLabel[userRole] ?? userRole)}
          </div>
        </>
      )}

      {/* ─── 2. الموقع ─── */}
      {sectionBox(
        <>
          {sectionTitle(<Globe2 size={16} />, "الموقع")}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {readOnlyRow("العنوان", siteTitle)}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(245, 234, 214, 0.06)",
                background: "rgba(0,0,0,0.15)",
              }}
            >
              <span
                style={{
                  color: "rgba(245, 234, 214, 0.5)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                الرابط
              </span>
              <span
                dir="ltr"
                style={{
                  color: "#f3cf73",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "60%",
                }}
              >
                {siteUrl}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(245, 234, 214, 0.06)",
                background: "rgba(0,0,0,0.15)",
              }}
            >
              <span
                style={{
                  color: "rgba(245, 234, 214, 0.5)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                الحالة
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: badge.color,
                  background: badge.bg,
                }}
              >
                {siteStatus === "PUBLISHED" ? (
                  <CheckCircle2 size={12} />
                ) : siteStatus === "DRAFT" ? (
                  <Clock size={12} />
                ) : (
                  <XCircle size={12} />
                )}
                {badge.label}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ─── 3. الرابط ─── */}
      {sectionBox(
        <>
          {sectionTitle(<Link2 size={16} />, "الرابط")}
          <p
            style={{
              color: "rgba(245, 234, 214, 0.55)",
              fontSize: "0.82rem",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            تقدر تغير الرابط مرة واحدة بس. اختار رابط يعبر عن شغلك.
          </p>
          <SlugEditor
            currentSlug={siteSlug}
            disabled={slugChangeUsed}
          />
        </>
      )}

      {/* ─── 4. حذف الحساب ─── */}
      {sectionBox(
        <>
          {sectionTitle(<Trash2 size={16} />, "حذف الحساب")}
          <p
            style={{
              color: "rgba(245, 234, 214, 0.55)",
              fontSize: "0.82rem",
              margin: "0 0 12px",
              lineHeight: 1.5,
            }}
          >
            هتحذف موقعك وكل محتوياته للأبد. مش هتقدر ترجع تاني.
          </p>
          <button
            disabled
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(239, 68, 68, 0.25)",
              background: "rgba(239, 68, 68, 0.08)",
              color: "rgba(239, 68, 68, 0.5)",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: "not-allowed",
              fontFamily: "inherit",
            }}
          >
            <Trash2 size={14} />
            قريباً
          </button>
        </>
      )}
    </div>
  );
}
