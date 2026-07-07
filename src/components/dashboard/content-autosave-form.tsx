"use client";

import { useRef, useState, useTransition } from "react";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import type { AutosaveState } from "@/app/(dashboard)/dashboard/content/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

type ContentAutosaveFormProps = {
  title: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    defaultValue: string;
    placeholder?: string;
  }>;
  action: (formData: FormData) => Promise<AutosaveState>;
};

export function ContentAutosaveForm({
  title,
  description,
  fields,
  action,
}: ContentAutosaveFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<AutosaveState>({
    ok: true,
    message: "جاهز للحفظ التلقائي",
  });
  const [isPending, startTransition] = useTransition();

  function autosave() {
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    startTransition(async () => {
      setState(await action(formData));
    });
  }

  async function submitAction(formData: FormData) {
    setState(await action(formData));
  }

  return (
    <form
      ref={formRef}
      action={submitAction}
      className="rounded-[var(--radius-panel)] border border-border bg-surface p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 text-xs",
            state.ok ? "text-muted-foreground" : "text-danger",
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : state.ok ? (
            <CheckCircle2 className="size-3.5" aria-hidden />
          ) : (
            <AlertTriangle className="size-3.5" aria-hidden />
          )}
          {state.message}
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              defaultValue={field.defaultValue}
              placeholder={field.placeholder}
              onBlur={autosave}
            />
          </div>
        ))}
      </div>

      <Button className="mt-5" type="submit">
        حفظ الآن
      </Button>
    </form>
  );
}
