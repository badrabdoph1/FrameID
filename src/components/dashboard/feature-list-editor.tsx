"use client";

import { useCallback } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export type FeatureListEditorProps = {
  features: string[];
  onChange: (features: string[]) => void;
  maxFeatures?: number;
  placeholder?: string;
  addLabel?: string;
  disabled?: boolean;
};

export function FeatureListEditor({
  features,
  onChange,
  maxFeatures = 20,
  placeholder = "أضف ميزة...",
  addLabel = "إضافة ميزة",
  disabled,
}: FeatureListEditorProps) {
  const updateFeature = useCallback(
    (index: number, value: string) => {
      const next = [...features];
      next[index] = value;
      onChange(next);
    },
    [features, onChange],
  );

  const removeFeature = useCallback(
    (index: number) => {
      onChange(features.filter((_, i) => i !== index));
    },
    [features, onChange],
  );

  const addFeature = useCallback(() => {
    if (features.length >= maxFeatures) return;
    onChange([...features, ""]);
  }, [features, maxFeatures, onChange]);

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const next = [...features];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onChange(next);
    },
    [features, onChange],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index === features.length - 1) return;
      const next = [...features];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onChange(next);
    },
    [features, onChange],
  );

  const isAtMax = features.length >= maxFeatures;

  return (
    <div className="space-y-2" role="group" aria-label="قائمة الميزات">
      {features.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          لا توجد ميزات مضافة بعد
        </p>
      )}

      <div className="space-y-1.5">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5"
            role="listitem"
          >
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0 || disabled}
                className={cn(
                  "flex size-5 items-center justify-center rounded text-muted-foreground transition hover:bg-border hover:text-foreground",
                  (index === 0 || disabled) && "pointer-events-none opacity-30",
                )}
                aria-label="تحريك لأعلى"
              >
                <ChevronUp className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === features.length - 1 || disabled}
                className={cn(
                  "flex size-5 items-center justify-center rounded text-muted-foreground transition hover:bg-border hover:text-foreground",
                  (index === features.length - 1 || disabled) &&
                    "pointer-events-none opacity-30",
                )}
                aria-label="تحريك لأسفل"
              >
                <ChevronDown className="size-3" />
              </button>
            </div>

            <span className="flex size-6 shrink-0 items-center justify-center text-[11px] text-muted-foreground">
              {index + 1}
            </span>

            <Input
              value={feature}
              onChange={(e) => updateFeature(index, e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-9 text-sm"
              aria-label={`الميزة ${index + 1}`}
            />

            <button
              type="button"
              onClick={() => removeFeature(index)}
              disabled={disabled}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-danger/10 hover:text-danger",
                disabled && "pointer-events-none opacity-50",
              )}
              aria-label={`حذف الميزة ${index + 1}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {!isAtMax && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addFeature}
          disabled={disabled}
          className="text-champagne hover:text-champagne/80"
        >
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
