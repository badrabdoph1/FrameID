"use client";

import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SaveStatusProps {
  status: "idle" | "saving" | "success" | "error";
  message: string;
}

export function SaveStatus({ status, message }: SaveStatusProps) {
  if (status === "idle") return null;

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm ${
        status === "saving"
          ? "text-white/60"
          : status === "success"
            ? "bg-success/10 text-success border border-success/20"
            : "bg-danger/10 text-danger border border-danger/20"
      }`}
    >
      {status === "saving" && <Loader2 className="size-4 animate-spin" />}
      {status === "success" && <CheckCircle2 className="size-4" />}
      {status === "error" && <AlertCircle className="size-4 shrink-0" />}
      {message}
    </div>
  );
}
