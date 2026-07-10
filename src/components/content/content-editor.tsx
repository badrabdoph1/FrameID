"use client";

import { useState, useCallback } from "react";
import type { ContentSchemaKey } from "@/lib/content";
import { saveContentAction } from "@/app/(admin)/admin/content/actions";
import { SaveStatus } from "@/components/content/save-status";
import { ContentForm } from "@/components/content/content-form";

interface ContentEditorProps {
  type: ContentSchemaKey;
  content: Record<string, unknown>;
}

export function ContentEditor({ type, content }: ContentEditorProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSave = useCallback(async (data: Record<string, unknown>) => {
    setStatus("saving");
    setMessage("");
    const result = await saveContentAction(type, data);
    if (result.success) {
      setStatus("success");
      const gitNote = result.gitStatus === "committed"
        ? ` · Commit ${result.commitId?.slice(0, 7)}`
        : result.gitStatus === "not-configured"
          ? " · GitHub sync not configured"
          : ` · GitHub sync failed${result.gitError ? `: ${result.gitError}` : ""}`;
      setMessage(`تم الحفظ بنجاح (النسخة ${result.version})${gitNote}`);
    } else {
      setStatus("error");
      setMessage(result.errors.map((e) => `${e.path}: ${e.message}`).join("، "));
    }
    setTimeout(() => setStatus("idle"), 5000);
  }, [type]);

  const cleanContent = { ...content };
  delete (cleanContent as Record<string, unknown>)._version;
  delete (cleanContent as Record<string, unknown>)._updatedAt;

  return (
    <div className="space-y-4">
      <ContentForm data={cleanContent} onSave={handleSave} />
      <SaveStatus status={status} message={message} />
    </div>
  );
}
