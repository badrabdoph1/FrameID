"use client";

import { useState } from "react";
import {
  Copy,
  DollarSign,
  Star,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { FeatureListEditor } from "@/components/dashboard/feature-list-editor";

export type PackageData = {
  id: string;
  name: string;
  subtitle?: string;
  priceAmount: number;
  currency: string;
  features: string[];
  isHighlighted: boolean;
  isActive: boolean;
};

export type PackageEditorProps = {
  pkg: PackageData;
  onUpdate: (pkg: PackageData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  disabled?: boolean;
};

export function PackageEditor({
  pkg,
  onUpdate,
  onDelete,
  onDuplicate,
  disabled,
}: PackageEditorProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function update(partial: Partial<PackageData>) {
    setSaving(true);
    try {
      await onUpdate({ ...pkg, ...partial });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(pkg.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card
      className={cn(
        "relative transition-opacity",
        !pkg.isActive && "opacity-50",
      )}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              {pkg.isHighlighted && (
                <Star className="size-4 fill-champagne text-champagne" />
              )}
              <h3 className="text-base font-semibold text-foreground truncate">
                {pkg.name || "باقة جديدة"}
              </h3>
              {!pkg.isActive && (
                <Badge tone="neutral">مخفي</Badge>
              )}
            </div>
            {pkg.subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {pkg.subtitle}
              </p>
            )}
            <p
              aria-live="polite"
              className={cn(
                "text-xs font-medium transition-opacity",
                saving ? "text-champagne opacity-100" : "text-muted-foreground opacity-0",
              )}
            >
              جاري الحفظ...
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDuplicate(pkg.id)}
              disabled={disabled}
              className="flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-border hover:text-foreground"
              aria-label="تكرار الباقة"
            >
              <Copy className="size-3.5" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={disabled || deleting}
                  className="h-8 px-2 text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDelete}
                  disabled={disabled || deleting}
                  className="h-8 px-2 text-xs bg-danger text-white hover:bg-danger/90"
                >
                  {deleting ? "..." : "تأكيد"}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={disabled}
                className="flex size-8 items-center justify-center rounded text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
                aria-label={`حذف ${pkg.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor={`name-${pkg.id}`}>اسم الباقة</Label>
            <Input
              id={`name-${pkg.id}`}
              value={pkg.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="مثلاً: الباقة الذهبية"
              disabled={disabled}
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <Label htmlFor={`subtitle-${pkg.id}`}>وصف قصير</Label>
            <Input
              id={`subtitle-${pkg.id}`}
              value={pkg.subtitle ?? ""}
              onChange={(e) =>
                update({ subtitle: e.target.value || undefined })
              }
              placeholder="مثلاً: مثالية لجلسات الزفاف"
              disabled={disabled}
            />
          </div>

          {/* Price Amount */}
          <div className="space-y-1.5">
            <Label htmlFor={`price-${pkg.id}`}>السعر</Label>
            <div className="relative">
              <Input
                id={`price-${pkg.id}`}
                type="number"
                min={0}
                step="0.01"
                value={pkg.priceAmount || ""}
                onChange={(e) =>
                  update({ priceAmount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                disabled={disabled}
                className="pl-8"
              />
              <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label htmlFor={`currency-${pkg.id}`}>العملة</Label>
            <Input
              id={`currency-${pkg.id}`}
              value={pkg.currency}
              onChange={(e) => update({ currency: e.target.value })}
              placeholder="SAR"
              disabled={disabled}
              className="font-mono"
            />
          </div>
        </div>

        {/* Features */}
        <div className="mt-4">
          <Label className="mb-2 block text-sm font-medium text-foreground">
            الميزات
          </Label>
          <FeatureListEditor
            features={pkg.features}
            onChange={(features) => update({ features })}
            maxFeatures={15}
            placeholder="أضف ميزة..."
            disabled={disabled}
          />
        </div>

        {/* Toggles */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4">
          <Switch
            checked={pkg.isHighlighted}
            onCheckedChange={(checked) => update({ isHighlighted: checked })}
            disabled={disabled}
            label="مميزة"
          />
          {pkg.isHighlighted && (
            <Star className="size-3.5 fill-champagne text-champagne" aria-hidden />
          )}

          <Switch
            checked={pkg.isActive}
            onCheckedChange={(checked) => update({ isActive: checked })}
            disabled={disabled}
            label="ظاهر"
          />
        </div>
      </CardContent>
    </Card>
  );
}
