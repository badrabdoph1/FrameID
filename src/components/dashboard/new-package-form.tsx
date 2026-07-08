"use client";

import { useState } from "react";
import { CirclePlus, Star } from "lucide-react";

import { addPackageAction } from "@/app/(dashboard)/dashboard/services/actions";
import { FeatureListEditor } from "@/components/dashboard/feature-list-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewPackageForm() {
  const [features, setFeatures] = useState<string[]>([""]);

  return (
    <form action={addPackageAction} className="grid gap-4">
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="pkg-name">اسم الباقة</Label>
          <Input id="pkg-name" name="name" required placeholder="مثلاً: باقة الزفاف" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pkg-subtitle">وصف قصير</Label>
          <Input id="pkg-subtitle" name="subtitle" placeholder="مناسبة ليوم كامل" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pkg-price">السعر</Label>
          <Input id="pkg-price" name="priceAmount" inputMode="numeric" required placeholder="12000" />
        </div>
      </div>

      <input
        type="hidden"
        name="features"
        value={features.map((item) => item.trim()).filter(Boolean).join("\n")}
      />

      <div className="space-y-2">
        <Label className="block">مميزات الباقة</Label>
        <FeatureListEditor
          features={features}
          onChange={setFeatures}
          maxFeatures={12}
          placeholder="مثلاً: تصوير ٦ ساعات"
        />
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "0.82rem",
          color: "rgba(245, 234, 214, 0.7)",
          cursor: "pointer",
        }}
      >
        <input type="checkbox" name="isHighlighted" />
        <Star className="size-3.5 text-champagne" aria-hidden />
        تمييز الباقة دي
      </label>

      <Button type="submit" variant="luxury">
        <CirclePlus className="size-4" aria-hidden />
        ضيف الباقة
      </Button>
    </form>
  );
}
