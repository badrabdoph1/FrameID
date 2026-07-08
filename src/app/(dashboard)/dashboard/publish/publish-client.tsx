"use client";

import { useState } from "react";
import {
  Copy,
  CheckCircle2,
  ExternalLink,
  Eye,
  Search,
  Globe2,
  RefreshCw,
} from "lucide-react";

import { updatePublishSeoAction } from "@/app/(dashboard)/dashboard/publish/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

type PublishClientProps = {
  siteTitle: string;
  siteUrl: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  robotsIndex: boolean;
  canonicalUrl: string | null;
  updated?: string;
  error?: string;
};

export function PublishClient({
  siteTitle,
  siteUrl,
  seoTitle,
  seoDescription,
  ogImageUrl,
  robotsIndex: initialRobots,
  canonicalUrl,
  updated,
  error,
}: PublishClientProps) {
  const [copied, setCopied] = useState(false);
  const [robots, setRobots] = useState(initialRobots);
  const [ogUrl, setOgUrl] = useState(ogImageUrl ?? "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      //
    }
  };

  const displayTitle = seoTitle || siteTitle;
  const displayDescription =
    seoDescription ||
    (seoTitle
      ? `${seoTitle} — موقع تصوير فوتوغرافي احترافي.`
      : `${siteTitle} — موقع تصوير فوتوغرافي احترافي.`);

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
          النشر والمشاركة
        </h1>
        <p
          style={{
            color: "rgba(245, 234, 214, 0.65)",
            fontSize: "0.85rem",
            margin: "4px 0 0",
          }}
        >
          شارك موقعك مع العالم.
        </p>
      </section>

      {updated ? (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid rgba(74, 222, 128, 0.2)",
            background: "rgba(74, 222, 128, 0.06)",
            color: "#4ade80",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          تم تحديث إعدادات النشر.
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid rgba(239, 68, 68, 0.2)",
            background: "rgba(239, 68, 68, 0.06)",
            color: "#ef4444",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          راجع البيانات المطلوبة ثم حاول مرة أخرى.
        </div>
      ) : null}

      {/* ─── 1. الرابط ─── */}
      <div
        style={{
          padding: "20px",
          borderRadius: 16,
          border: "1px solid rgba(245, 234, 214, 0.08)",
          background: "rgba(255, 255, 255, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <Globe2 size={16} style={{ color: "#f3cf73", flexShrink: 0 }} />
          <h2
            style={{
              color: "#fff7e8",
              fontSize: "0.95rem",
              fontWeight: 950,
              margin: 0,
            }}
          >
            الرابط
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(245, 234, 214, 0.08)",
            background: "rgba(0,0,0,0.2)",
            flexWrap: "wrap",
          }}
        >
          <span
            dir="ltr"
            style={{
              flex: 1,
              minWidth: 0,
              color: "#f3cf73",
              fontSize: "0.85rem",
              fontWeight: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {siteUrl}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleCopy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(245, 234, 214, 0.12)",
                background: "transparent",
                color: copied ? "#4ade80" : "rgba(245, 234, 214, 0.7)",
                fontSize: "0.78rem",
                fontWeight: 900,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              {copied ? "تم النسخ" : "نسخ"}
            </button>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(245, 234, 214, 0.12)",
                background: "transparent",
                color: "rgba(245, 234, 214, 0.7)",
                fontSize: "0.78rem",
                fontWeight: 900,
                textDecoration: "none",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              <ExternalLink size={13} />
              فتح
            </a>
          </div>
        </div>
      </div>

      {/* ─── 2. SEO الأساسي ─── */}
      <form action={updatePublishSeoAction}>
        <div
          style={{
            padding: "20px",
            borderRadius: 16,
            border: "1px solid rgba(245, 234, 214, 0.08)",
            background: "rgba(255, 255, 255, 0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Search size={16} style={{ color: "#f3cf73", flexShrink: 0 }} />
            <h2
              style={{
                color: "#fff7e8",
                fontSize: "0.95rem",
                fontWeight: 950,
                margin: 0,
              }}
            >
              SEO الأساسي
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Label htmlFor="seo-title">عنوان الموقع في محركات البحث</Label>
              <Input
                id="seo-title"
                name="title"
                defaultValue={seoTitle ?? siteTitle}
                required
                placeholder={siteTitle}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Label htmlFor="seo-description">وصف الموقع في محركات البحث</Label>
              <textarea
                id="seo-description"
                name="description"
                rows={3}
                defaultValue={seoDescription ?? ""}
                placeholder="وصف مختصر يظهر في نتائج البحث..."
                style={{
                  width: "100%",
                  minHeight: 44,
                  borderRadius: "var(--radius-control, 8px)",
                  border: "1px solid var(--border, rgba(245, 234, 214, 0.12))",
                  background: "var(--surface, rgba(255,255,255,0.04))",
                  color: "var(--foreground, #fff7e8)",
                  padding: "10px 12px",
                  fontSize: "0.85rem",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Label htmlFor="og-image">رابط صورة المعاينة (OG Image)</Label>
              <Input
                id="og-image"
                name="ogImageUrl"
                dir="ltr"
                value={ogUrl}
                onChange={(e) => setOgUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Label htmlFor="canonical-url">الرابط الأساسي (Canonical URL)</Label>
              <Input
                id="canonical-url"
                name="canonicalUrl"
                dir="ltr"
                defaultValue={canonicalUrl ?? ""}
                placeholder={siteUrl}
              />
            </div>
          </div>

          <input type="hidden" name="robotsIndex" value={robots ? "on" : "off"} />

          <div style={{ marginTop: 16 }}>
            <Button type="submit" variant="luxury">
              حفظ إعدادات SEO
            </Button>
          </div>
        </div>
      </form>

      {/* ─── 3. Google Preview ─── */}
      <div
        style={{
          padding: "20px",
          borderRadius: 16,
          border: "1px solid rgba(245, 234, 214, 0.08)",
          background: "rgba(255, 255, 255, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <Eye size={16} style={{ color: "#f3cf73", flexShrink: 0 }} />
          <h2
            style={{
              color: "#fff7e8",
              fontSize: "0.95rem",
              fontWeight: 950,
              margin: 0,
            }}
          >
            Google Preview
          </h2>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid rgba(245, 234, 214, 0.06)",
            background: "#1a1a1a",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "rgba(245, 234, 214, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                  fill="#8ab4f8"
                />
              </svg>
            </div>
            <span
              style={{
                color: "rgba(245, 234, 214, 0.4)",
                fontSize: "0.72rem",
                fontWeight: 600,
              }}
            >
              {new URL(siteUrl).hostname}
            </span>
          </div>

          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#8ab4f8",
              fontSize: "0.95rem",
              fontWeight: 600,
              textDecoration: "none",
              display: "block",
              marginBottom: 2,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayTitle}
          </a>

          <span
            style={{
              color: "#b5e5a0",
              fontSize: "0.75rem",
              fontWeight: 500,
              display: "block",
              marginBottom: 4,
            }}
          >
            {siteUrl.length > 60 ? siteUrl.slice(0, 60) + "..." : siteUrl}
          </span>

          <p
            style={{
              color: "rgba(245, 234, 214, 0.55)",
              fontSize: "0.8rem",
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {displayDescription.length > 160
              ? displayDescription.slice(0, 157) + "..."
              : displayDescription}
          </p>
        </div>
      </div>

      {/* ─── 4. WhatsApp Preview ─── */}
      <div
        style={{
          padding: "20px",
          borderRadius: 16,
          border: "1px solid rgba(245, 234, 214, 0.08)",
          background: "rgba(255, 255, 255, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <Eye size={16} style={{ color: "#f3cf73", flexShrink: 0 }} />
          <h2
            style={{
              color: "#fff7e8",
              fontSize: "0.95rem",
              fontWeight: 950,
              margin: 0,
            }}
          >
            WhatsApp Preview
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              maxWidth: 320,
              borderRadius: 12,
              border: "1px solid rgba(245, 234, 214, 0.06)",
              background: "#1f2c33",
              overflow: "hidden",
            }}
          >
            {ogUrl ? (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1200 / 630",
                  background: "rgba(255,255,255,0.05)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={ogUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : null}

            <div style={{ padding: "10px 14px 12px" }}>
              <span
                style={{
                  color: "rgba(245, 234, 214, 0.35)",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  display: "block",
                  marginBottom: 2,
                }}
              >
                {new URL(siteUrl).hostname}
              </span>
              <p
                style={{
                  color: "#e9edef",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  margin: "2px 0",
                  lineHeight: 1.3,
                }}
              >
                {displayTitle}
              </p>
              <p
                style={{
                  color: "rgba(245, 234, 214, 0.5)",
                  fontSize: "0.78rem",
                  margin: "2px 0 0",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {displayDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. حالة الأرشفة ─── */}
      <form action={updatePublishSeoAction}>
        <div
          style={{
            padding: "20px",
            borderRadius: 16,
            border: "1px solid rgba(245, 234, 214, 0.08)",
            background: "rgba(255, 255, 255, 0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <Globe2 size={16} style={{ color: "#f3cf73", flexShrink: 0 }} />
            <h2
              style={{
                color: "#fff7e8",
                fontSize: "0.95rem",
                fontWeight: 950,
                margin: 0,
              }}
            >
              حالة الأرشفة
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(245, 234, 214, 0.06)",
              background: "rgba(0,0,0,0.15)",
            }}
          >
            <div>
              {robots ? (
                <Badge tone="success">مفعلة — مسموح للأرشفة</Badge>
              ) : (
                <Badge tone="warning">معطلة — ممنوع الأرشفة</Badge>
              )}
            </div>

            <Switch
              checked={robots}
              onCheckedChange={(v) => setRobots(v)}
              label="السماح لمحركات البحث"
            />
          </div>

          <input type="hidden" name="robotsIndex" value={robots ? "on" : "off"} />
          <input type="hidden" name="title" value={seoTitle ?? siteTitle} />
          <input type="hidden" name="description" value={seoDescription ?? ""} />
          <input type="hidden" name="ogImageUrl" value={ogUrl} />
          <input type="hidden" name="canonicalUrl" value={canonicalUrl ?? ""} />

          <div style={{ marginTop: 12 }}>
            <Button type="submit" variant="secondary" size="sm">
              حفظ حالة الأرشفة
            </Button>
          </div>
        </div>
      </form>

      {/* ─── 6. إعادة توليد ─── */}
      <div
        style={{
          padding: "20px",
          borderRadius: 16,
          border: "1px solid rgba(245, 234, 214, 0.08)",
          background: "rgba(255, 255, 255, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <RefreshCw size={16} style={{ color: "#f3cf73", flexShrink: 0 }} />
          <h2
            style={{
              color: "#fff7e8",
              fontSize: "0.95rem",
              fontWeight: 950,
              margin: 0,
            }}
          >
            إعادة توليد
          </h2>
        </div>

        <p
          style={{
            color: "rgba(245, 234, 214, 0.55)",
            fontSize: "0.82rem",
            margin: "0 0 12px",
            lineHeight: 1.5,
          }}
        >
          بعد تعديل المحتوى أو الصور، يمكنك إعادة توليد معاينة الموقع لمشاركتها على
          واتساب وفيسبوك.
        </p>

        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            window.location.reload();
          }}
        >
          <RefreshCw size={14} />
          إعادة توليد المعاينة
        </Button>
      </div>
    </div>
  );
}
