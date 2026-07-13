"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { X, Save } from "lucide-react";

interface InlineTextEditorProps {
  path: string;
  value: string;
  onSave: (path: string, value: string) => void;
  onClose: () => void;
}

export function InlineTextEditor({ path, value, onSave, onClose }: InlineTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(value);
  const [isMultiline] = useState(value.length > 80 || value.includes("\n"));

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    onSave(path, text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={cn(
        "w-full max-w-2xl bg-[#0b0d12] rounded-xl border border-white/10 shadow-2xl overflow-hidden",
        isMultiline ? "max-h-[70vh]" : "max-h-[40vh]"
      )}>
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="font-semibold text-white">تحرير النص</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 font-mono">{path}</span>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition">
              <X className="size-4 text-white/60" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isMultiline) {
                e.preventDefault();
                handleSave();
              }
            }}
            className={cn(
              "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 font-mono text-sm",
              isMultiline ? "min-h-[200px] max-h-[50vh]" : "min-h-[60px]"
            )}
            placeholder="اكتب النص هنا..."
            spellCheck={false}
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition">
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-black bg-amber-300 rounded-lg hover:bg-amber-400 transition"
          >
            <Save className="size-4" />
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}