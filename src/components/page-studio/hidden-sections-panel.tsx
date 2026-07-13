"use client";

import { cn } from "@/lib/utils/cn";
import { RotateCcw, Trash2, X, ChevronDown } from "lucide-react";

interface HiddenSectionsPanelProps {
  sections: import("@/modules/page-studio/service").SectionInstance[];
  onRestore: (hiddenSectionId: string) => void;
  onPermanentDelete: (hiddenSectionId: string) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export function HiddenSectionsPanel({
  sections,
  onRestore,
  onPermanentDelete,
  onClose,
  isMobile = false,
}: HiddenSectionsPanelProps) {
  if (sections.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-[#0b0d12] border-t border-white/10 shadow-2xl",
        isMobile ? "max-h-[60vh] animate-slide-up" : "h-[40vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0b0d12]/95 backdrop-blur z-10">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <RotateCcw className="size-4 text-amber-300" />
          الأقسام المخفية ({sections.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-white/10 transition text-white/60 hover:text-white"
          aria-label="إغلاق"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Sections List */}
      <div className="overflow-y-auto p-3 max-h-[calc(100%-60px)]">
        {sections.map((section) => (
          <div
            key={section.id}
            className="group relative bg-white/5 border border-white/10 rounded-xl p-4 mb-3 transition hover:border-amber-300/30"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{section.definition.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-300/20 text-amber-300">
                    مخفي
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/40 truncate">{section.definition.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-white/30">
                  <span>ترتيب: {section.sortOrder}</span>
                  <span>•</span>
                  <span>بيانات: {Object.keys(section.data).length} حقل</span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onRestore(section.id)}
                  className="p-2 rounded-lg bg-green-400/20 text-green-400 hover:bg-green-400/30 transition"
                  aria-label="استعادة القسم"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  onClick={() => onPermanentDelete(section.id)}
                  className="p-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition"
                  aria-label="حذف نهائي"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {/* Expandable Details */}
            <details className="mt-3">
              <summary className="flex items-center gap-2 text-xs text-white/50 cursor-pointer hover:text-white/70">
                <ChevronDown className="size-3" />
                عرض البيانات
              </summary>
              <pre className="mt-2 p-3 bg-white/5 rounded-lg text-xs text-white/60 overflow-x-auto max-h-40">
                {JSON.stringify(section.data, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>

      {isMobile && (
        <div className="px-4 pb-4 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-sm font-medium text-white/70 bg-white/5 rounded-lg hover:bg-white/10 transition"
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
}