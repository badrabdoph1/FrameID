"use client";

import { useCallback, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  CirclePlus,
  Copy,
  Eye,
  EyeOff,
  Package,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  PackageEditor,
  type PackageData,
} from "@/components/dashboard/package-editor";
import { NewPackageForm } from "@/components/dashboard/new-package-form";
import {
  BuilderNotice,
  BuilderPageHeader,
} from "@/components/dashboard/builder-primitives";

import {
  addExtraAction,
  deleteExtraAction,
  deletePackageAction,
  duplicateExtraAction,
  duplicatePackageAction,
  reorderExtraAction,
  reorderPackageAction,
  updateExtraAction,
  updatePackageAction,
} from "@/app/(dashboard)/dashboard/services/actions";

/* ─── Types ────────────────────────────────────── */

type ExtraData = {
  id: string;
  name: string;
  priceAmount: number;
  currency: string;
  iconKey: string | null;
  isActive: boolean;
  sortOrder: number;
};

type ServicesClientProps = {
  packages: (PackageData & { sortOrder: number })[];
  extras: ExtraData[];
  created?: string;
  error?: string;
};

/* ─── Helpers ──────────────────────────────────── */

/* ─── Extra Card ───────────────────────────────── */

function ExtraCard({
  extra,
  onUpdate,
  onDelete,
  onDuplicate,
  onReorderUp,
  onReorderDown,
  isFirst,
  isLast,
  disabled,
}: {
  extra: ExtraData;
  onUpdate: (data: ExtraData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onReorderUp: (id: string) => Promise<void>;
  onReorderDown: (id: string) => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = useCallback(
    async (partial: Partial<ExtraData>) => {
      await onUpdate({ ...extra, ...partial });
    },
    [extra, onUpdate],
  );

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await onDelete(extra.id);
    } finally {
      setDeleting(false);
    }
  }, [extra.id, onDelete]);

  const iconDisplay = extra.iconKey ? (
    <span
      style={{
        display: "inline-flex",
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        background: "rgba(243, 207, 115, 0.1)",
        color: "#f3cf73",
        fontSize: "0.75rem",
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {extra.iconKey.charAt(0).toUpperCase()}
    </span>
  ) : (
    <BriefcaseBusiness
      size={18}
      style={{ color: "rgba(245, 234, 214, 0.35)", flexShrink: 0 }}
    />
  );

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(245, 234, 214, 0.08)",
        background: extra.isActive
          ? "rgba(255, 255, 255, 0.03)"
          : "rgba(255, 255, 255, 0.015)",
        opacity: extra.isActive ? 1 : 0.5,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "14px 16px",
          flexWrap: "wrap",
        }}
      >
        {/* Reorder */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            paddingTop: 2,
          }}
        >
          <button
            type="button"
            onClick={() => onReorderUp(extra.id)}
            disabled={isFirst || disabled}
            aria-label="تحريك لأعلى"
            style={{
              display: "flex",
              width: 22,
              height: 18,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              border: "none",
              background: "transparent",
              color: isFirst ? "rgba(245,234,214,0.2)" : "rgba(245,234,214,0.4)",
              cursor: isFirst ? "not-allowed" : "pointer",
              fontSize: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isFirst) e.currentTarget.style.color = "#f3cf73";
            }}
            onMouseLeave={(e) => {
              if (!isFirst)
                e.currentTarget.style.color = "rgba(245,234,214,0.4)";
            }}
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onReorderDown(extra.id)}
            disabled={isLast || disabled}
            aria-label="تحريك لأسفل"
            style={{
              display: "flex",
              width: 22,
              height: 18,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
              border: "none",
              background: "transparent",
              color: isLast ? "rgba(245,234,214,0.2)" : "rgba(245,234,214,0.4)",
              cursor: isLast ? "not-allowed" : "pointer",
              fontSize: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isLast) e.currentTarget.style.color = "#f3cf73";
            }}
            onMouseLeave={(e) => {
              if (!isLast)
                e.currentTarget.style.color = "rgba(245,234,214,0.4)";
            }}
          >
            <ArrowDown size={14} />
          </button>
        </div>

        {/* Icon */}
        {iconDisplay}

        {/* Fields */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            minWidth: 0,
          }}
        >
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "rgba(245, 234, 214, 0.5)",
              }}
            >
              الاسم
            </Label>
            <input
              value={extra.name}
              onChange={(e) => update({ name: e.target.value })}
              disabled={disabled}
              style={{
                minHeight: 36,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid rgba(245, 234, 214, 0.06)",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#fff7e8",
                fontSize: "0.82rem",
                outline: "none",
                width: "100%",
              }}
              placeholder="اسم الخدمة"
            />
          </div>

          {/* Price */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "rgba(245, 234, 214, 0.5)",
              }}
            >
              السعر
            </Label>
            <input
              type="number"
              min={0}
              value={extra.priceAmount || ""}
              onChange={(e) =>
                update({ priceAmount: Number.parseInt(e.target.value) || 0 })
              }
              disabled={disabled}
              style={{
                minHeight: 36,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid rgba(245, 234, 214, 0.06)",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#fff7e8",
                fontSize: "0.82rem",
                outline: "none",
                width: "100%",
              }}
              placeholder="0"
            />
          </div>

          {/* Currency */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "rgba(245, 234, 214, 0.5)",
              }}
            >
              العملة
            </Label>
            <input
              value={extra.currency}
              onChange={(e) => update({ currency: e.target.value })}
              disabled={disabled}
              style={{
                minHeight: 36,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid rgba(245, 234, 214, 0.06)",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#fff7e8",
                fontSize: "0.82rem",
                outline: "none",
                width: "100%",
                fontFamily: "monospace",
              }}
              placeholder="EGP"
            />
          </div>

          {/* Icon Key */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Label
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "rgba(245, 234, 214, 0.5)",
              }}
            >
              الرمز
            </Label>
            <input
              value={extra.iconKey ?? ""}
              onChange={(e) =>
                update({ iconKey: e.target.value || null })
              }
              disabled={disabled}
              style={{
                minHeight: 36,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid rgba(245, 234, 214, 0.06)",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#fff7e8",
                fontSize: "0.82rem",
                outline: "none",
                width: "100%",
              }}
              placeholder="album, reel, prints"
            />
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => onDuplicate(extra.id)}
            disabled={disabled}
            aria-label="تكرار الخدمة"
            style={{
              display: "flex",
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "rgba(245, 234, 214, 0.35)",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(245, 234, 214, 0.06)";
              e.currentTarget.style.color = "#f3cf73";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(245, 234, 214, 0.35)";
            }}
          >
            <Copy size={14} />
          </button>

          {confirmDelete ? (
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={disabled || deleting}
                style={{ height: 32, paddingInline: 8, fontSize: "0.72rem" }}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDelete}
                disabled={disabled || deleting}
                style={{
                  height: 32,
                  paddingInline: 8,
                  fontSize: "0.72rem",
                  background: "#ef4444",
                  color: "#fff",
                }}
              >
                {deleting ? "..." : "تأكيد"}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={disabled}
              aria-label={`حذف ${extra.name}`}
              style={{
                display: "flex",
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "rgba(245, 234, 214, 0.35)",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(245, 234, 214, 0.35)";
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Footer toggles */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
          borderTop: "1px solid rgba(245, 234, 214, 0.04)",
        }}
      >
        <Switch
          checked={extra.isActive}
          onCheckedChange={(checked) => update({ isActive: checked })}
          disabled={disabled}
          label="ظاهر"
        />
        {extra.isActive ? (
          <Eye size={13} style={{ color: "rgba(74, 222, 128, 0.6)" }} />
        ) : (
          <EyeOff size={13} style={{ color: "rgba(245, 234, 214, 0.25)" }} />
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────── */

export function ServicesClient({
  packages: initialPackages,
  extras: initialExtras,
  created,
  error,
}: ServicesClientProps) {
  const [packages, setPackages] = useState(initialPackages);
  const [extras, setExtras] = useState(initialExtras);

  /* ── Package handlers ── */

  const handlePackageUpdate = useCallback(
    async (pkg: PackageData) => {
      const fd = new FormData();
      fd.append("id", pkg.id);
      fd.append("name", pkg.name);
      fd.append("subtitle", pkg.subtitle ?? "");
      fd.append("priceAmount", String(pkg.priceAmount));
      fd.append("currency", pkg.currency);
      fd.append("features", JSON.stringify(pkg.features));
      fd.append("isHighlighted", pkg.isHighlighted ? "on" : "off");
      fd.append("isActive", pkg.isActive ? "on" : "off");
      await updatePackageAction(fd);
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, ...pkg } : p)),
      );
    },
    [],
  );

  const handlePackageDelete = useCallback(async (id: string) => {
    const fd = new FormData();
    fd.append("id", id);
    await deletePackageAction(fd);
    setPackages((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handlePackageDuplicate = useCallback(async (id: string) => {
    const fd = new FormData();
    fd.append("id", id);
    await duplicatePackageAction(fd);
  }, []);

  const handlePackageReorder = useCallback(
    (direction: "up" | "down") => async (id: string) => {
      const fd = new FormData();
      fd.append("id", id);
      fd.append("direction", direction);
      await reorderPackageAction(fd);
      setPackages((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx === -1) return prev;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
        return next;
      });
    },
    [],
  );

  /* ── Extra handlers ── */

  const handleExtraUpdate = useCallback(async (data: ExtraData) => {
    const fd = new FormData();
    fd.append("id", data.id);
    fd.append("name", data.name);
    fd.append("priceAmount", String(data.priceAmount));
    fd.append("currency", data.currency);
    fd.append("iconKey", data.iconKey ?? "");
    fd.append("isActive", data.isActive ? "on" : "off");
    await updateExtraAction(fd);
    setExtras((prev) =>
      prev.map((e) => (e.id === data.id ? { ...e, ...data } : e)),
    );
  }, []);

  const handleExtraDelete = useCallback(async (id: string) => {
    const fd = new FormData();
    fd.append("id", id);
    await deleteExtraAction(fd);
    setExtras((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleExtraDuplicate = useCallback(async (id: string) => {
    const fd = new FormData();
    fd.append("id", id);
    await duplicateExtraAction(fd);
  }, []);

  const handleExtraReorder = useCallback(
    (direction: "up" | "down") => async (id: string) => {
      const fd = new FormData();
      fd.append("id", id);
      fd.append("direction", direction);
      await reorderExtraAction(fd);
      setExtras((prev) => {
        const idx = prev.findIndex((e) => e.id === id);
        if (idx === -1) return prev;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
        return next;
      });
    },
    [],
  );

  /* ── Render ── */

  return (
    <main className="space-y-5">
      <BuilderPageHeader
        eyebrow="الباقات والخدمات"
        title="حوّل أسعارك إلى عروض واضحة"
        description="أضف الباقات الأساسية والخدمات الإضافية كسطور سهلة القراءة بدلاً من نص طويل يربك العميل."
      />

      {/* Banners */}
      {created ? (
        <BuilderNotice
          tone="success"
          title="تم تحديث الخدمات"
          description="ظهرت التغييرات على موقعك العام."
        />
      ) : null}

      {error ? (
        <BuilderNotice
          tone="error"
          title="لم يتم حفظ الخدمة"
          description="راجع الاسم والسعر ثم حاول مرة أخرى."
          errorId={error}
        />
      ) : null}

      {/* ─── Packages Section ─── */}

      <section className="space-y-4">
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#fff7e8",
            fontSize: "1.05rem",
            fontWeight: 800,
            margin: 0,
          }}
        >
          <Package size={18} style={{ color: "#f3cf73" }} />
          الباقات
        </h2>

        {/* Add Package Form */}
        <Card>
          <CardHeader>
            <CardTitle
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.9rem",
              }}
            >
              <CirclePlus size={16} style={{ color: "#f3cf73" }} />
              إضافة باقة جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NewPackageForm />
          </CardContent>
        </Card>

        {/* Package List */}
        {packages.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "32px 16px",
              color: "rgba(245, 234, 214, 0.4)",
              fontSize: "0.85rem",
              borderRadius: 16,
              border: "1px dashed rgba(245, 234, 214, 0.08)",
            }}
          >
            لا توجد باقات بعد. أضف باقتك الأولى أعلاه.
          </p>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg, idx) => (
              <div key={pkg.id} style={{ position: "relative" }}>
                {/* Reorder buttons */}
                <div
                  style={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                    zIndex: 10,
                    display: "flex",
                    gap: 2,
                    opacity: 0.6,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handlePackageReorder("up")(pkg.id)}
                    disabled={idx === 0}
                    aria-label="تحريك لأعلى"
                    style={{
                      display: "flex",
                      width: 26,
                      height: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      border: "none",
                      background: "rgba(0,0,0,0.4)",
                      color:
                        idx === 0
                          ? "rgba(245,234,214,0.2)"
                          : "rgba(245,234,214,0.6)",
                      cursor: idx === 0 ? "not-allowed" : "pointer",
                      backdropFilter: "blur(4px)",
                    }}
                    onMouseEnter={(e) => {
                      if (idx !== 0) e.currentTarget.style.color = "#f3cf73";
                    }}
                    onMouseLeave={(e) => {
                      if (idx !== 0)
                        e.currentTarget.style.color =
                          "rgba(245,234,214,0.6)";
                    }}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePackageReorder("down")(pkg.id)}
                    disabled={idx === packages.length - 1}
                    aria-label="تحريك لأسفل"
                    style={{
                      display: "flex",
                      width: 26,
                      height: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      border: "none",
                      background: "rgba(0,0,0,0.4)",
                      color:
                        idx === packages.length - 1
                          ? "rgba(245,234,214,0.2)"
                          : "rgba(245,234,214,0.6)",
                      cursor:
                        idx === packages.length - 1
                          ? "not-allowed"
                          : "pointer",
                      backdropFilter: "blur(4px)",
                    }}
                    onMouseEnter={(e) => {
                      if (idx !== packages.length - 1)
                        e.currentTarget.style.color = "#f3cf73";
                    }}
                    onMouseLeave={(e) => {
                      if (idx !== packages.length - 1)
                        e.currentTarget.style.color =
                          "rgba(245,234,214,0.6)";
                    }}
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
                <PackageEditor
                  pkg={pkg}
                  onUpdate={handlePackageUpdate}
                  onDelete={handlePackageDelete}
                  onDuplicate={handlePackageDuplicate}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Extra Services Section ─── */}

      <section className="space-y-4">
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#fff7e8",
            fontSize: "1.05rem",
            fontWeight: 800,
            margin: 0,
          }}
        >
          <BriefcaseBusiness size={18} style={{ color: "#f3cf73" }} />
          الخدمات الإضافية
        </h2>

        {/* Add Extra Form */}
        <Card>
          <CardHeader>
            <CardTitle
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.9rem",
              }}
            >
              <CirclePlus size={16} style={{ color: "#f3cf73" }} />
              إضافة خدمة إضافية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addExtraAction} className="grid gap-4">
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="extra-name">اسم الخدمة</Label>
                  <Input id="extra-name" name="name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="extra-price">السعر بالجنيه</Label>
                  <Input
                    id="extra-price"
                    name="priceAmount"
                    inputMode="numeric"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="extra-icon">نوع الخدمة أو الأيقونة</Label>
                  <Input
                    id="extra-icon"
                    name="iconKey"
                    placeholder="مثلاً: ألبوم، فيديو، مطبوعات"
                  />
                </div>
              </div>
              <Button type="submit" variant="luxury">
                <BriefcaseBusiness className="size-4" aria-hidden />
                إضافة الخدمة
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Extra List */}
        {extras.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "32px 16px",
              color: "rgba(245, 234, 214, 0.4)",
              fontSize: "0.85rem",
              borderRadius: 16,
              border: "1px dashed rgba(245, 234, 214, 0.08)",
            }}
          >
            لا توجد خدمات إضافية بعد. أضف خدمتك الأولى أعلاه.
          </p>
        ) : (
          <div className="space-y-3">
            {extras.map((extra, idx) => (
              <ExtraCard
                key={extra.id}
                extra={extra}
                onUpdate={handleExtraUpdate}
                onDelete={handleExtraDelete}
                onDuplicate={handleExtraDuplicate}
                onReorderUp={handleExtraReorder("up")}
                onReorderDown={handleExtraReorder("down")}
                isFirst={idx === 0}
                isLast={idx === extras.length - 1}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
