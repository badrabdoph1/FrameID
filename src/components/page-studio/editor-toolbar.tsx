"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Save,
  RotateCcw,
  RotateCw,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Undo2,
  Redo2,
} from "lucide-react";

interface EditorToolbarProps {
  pageDef: import("@/modules/page-studio/types").PageDefinition;
  state: import("@/modules/page-studio/service").PageStudioState | null;
  previewMode: boolean;
  onPreviewToggle: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDiscard: () => void;
  onRefresh: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  isDirty: boolean;
  saveStatus: "idle" | "saving" | "success" | "error";
  saveMessage: string;
}

export function EditorToolbar({
  pageDef,
  state,
  previewMode,
  onPreviewToggle,
  onSave,
  onUndo,
  onRedo,
  onDiscard,
  onRefresh,
  canUndo,
  canRedo,
  isSaving,
  isDirty,
  saveStatus,
  saveMessage,
}: EditorToolbarProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0b0d12]/95 backdrop-blur-sm px-4 py-3">
      {/* Left: Page Info & Navigation */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-bold rounded bg-amber-300/20 text-amber-300">
            Page Studio
          </span>
          <h2 className="font-semibold text-white truncate max-w-[200px]">{pageDef.label}</h2>
        </div>

        <div className="hidden sm:flex items-center gap-1 border-l border-white/10 pl-4 ml-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              "p-2 rounded-lg transition text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed",
              canUndo && "hover:bg-green-400/10 hover:text-green-400"
            )}
            aria-label="تراجع (Ctrl+Z)"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              "p-2 rounded-lg transition text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed",
              canRedo && "hover:bg-green-400/10 hover:text-green-400"
            )}
            aria-label="إعادة (Ctrl+Y)"
          >
            <Redo2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Center: Save Status & Actions */}
      <div className="flex items-center gap-3 flex-1 justify-center">
        {/* Save Status Indicator */}
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <Loader2 className="size-4 text-amber-300 animate-spin" />
          )}
          {saveStatus === "success" && (
            <CheckCircle className="size-4 text-green-400" />
          )}
          {saveStatus === "error" && (
            <AlertTriangle className="size-4 text-red-400" />
          )}

          <span className={cn(
            "text-xs font-medium",
            saveStatus === "saving" && "text-amber-300",
            saveStatus === "success" && "text-green-400",
            saveStatus === "error" && "text-red-400",
            saveStatus === "idle" && isDirty && "text-amber-300",
            saveStatus === "idle" && !isDirty && "text-white/40"
          )}>
            {saveMessage || (isDirty ? "يوجد تغييرات غير محفوظة" : "جميع التغييرات محفوظة")}
          </span>
        </div>

        {/* Version Info */}
        {state && (
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-white/40 bg-white/5 rounded">
            <span className="text-white/30">v</span>
            {state.version}
          </span>
        )}
      </div>

      {/* Right: Main Actions */}
      <div className="flex items-center gap-2">
        {/* Preview Mode Toggle */}
        <button
          onClick={onPreviewToggle}
          className={cn(
            "p-2 rounded-lg transition flex items-center gap-1.5",
            previewMode
              ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
          aria-label={previewMode ? "وضع التحرير" : "وضع المعاينة"}
        >
          {previewMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          <span className="hidden sm:inline">{previewMode ? "معاينة" : "تحرير"}</span>
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition"
          aria-label="تحديث من المصدر"
        >
          <RefreshCw className="size-4" />
        </button>

        {/* Discard Changes */}
        {isDirty && (
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 text-xs font-medium text-white/70 bg-white/5 rounded-lg hover:bg-white/10 transition"
          >
            تجاهل التغييرات
          </button>
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition",
            isSaving
              ? "bg-amber-300/50 text-amber-300 cursor-wait"
              : isDirty
              ? "bg-amber-300 text-black hover:bg-amber-400"
              : "bg-white/10 text-white/50 cursor-not-allowed"
          )}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </div>
  );
}