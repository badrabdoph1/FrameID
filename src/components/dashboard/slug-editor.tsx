"use client";

import { useMemo, useState, useTransition } from "react";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import {
  changeSiteSlugAction,
  checkSiteSlugAction
} from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SlugEditorProps = {
  currentSlug: string;
  disabled: boolean;
  error?: string;
  changed?: boolean;
};

export function SlugEditor({
  currentSlug,
  disabled,
  error,
  changed
}: SlugEditorProps) {
  const [value, setValue] = useState(currentSlug);
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "checking" }
    | { status: "available"; slug: string }
    | { status: "unavailable"; reason: string }
  >({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const helper = useMemo(() => {
    if (changed) {
      return "تم تغيير الرابط بنجاح.";
    }

    if (disabled) {
      return "تم استخدام فرصة تغيير الرابط.";
    }

    if (state.status === "available") {
      return `متاح: ${state.slug}`;
    }

    if (state.status === "unavailable") {
      return state.reason === "taken"
        ? "هذا الرابط مستخدم بالفعل."
        : "هذا الرابط غير صالح.";
    }

    if (error) {
      return "لم نتمكن من تغيير الرابط. جرّب رابطًا آخر.";
    }

    return "يمكن تغيير الرابط مرة واحدة فقط.";
  }, [changed, disabled, error, state]);

  function handleChange(nextValue: string) {
    setValue(nextValue);

    if (!nextValue.trim()) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "checking" });
    startTransition(async () => {
      const result = await checkSiteSlugAction(nextValue);

      if (result.ok) {
        setState({ status: "available", slug: result.normalizedSlug });
      } else {
        setState({ status: "unavailable", reason: result.reason });
      }
    });
  }

  return (
    <form action={changeSiteSlugAction} className="mt-5 border-t border-border pt-5">
      <div className="space-y-2">
        <Label htmlFor="slug">تغيير الرابط</Label>
        <div className="flex gap-2">
          <Input
            id="slug"
            name="slug"
            dir="ltr"
            value={value}
            disabled={disabled || isPending}
            onChange={(event) => handleChange(event.target.value)}
          />
          <Button disabled={disabled || state.status !== "available"}>
            حفظ
          </Button>
        </div>
      </div>
      <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
        {state.status === "checking" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : state.status === "available" || changed ? (
          <CheckCircle2 className="size-4 text-success" aria-hidden />
        ) : state.status === "unavailable" || error ? (
          <XCircle className="size-4 text-danger" aria-hidden />
        ) : null}
        {helper}
      </p>
    </form>
  );
}
