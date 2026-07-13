"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Eye,
  EyeOff,
  GripVertical,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings,
  PanelLeft,
  X,
} from "lucide-react";
import { SimpleDragDropProvider } from "./drag-drop-provider";

interface SectionItem {
  id: string;
  definition: {
    id: string;
    title: string;
    editorConfig: {
      sortable: boolean;
      duplicable: boolean;
      deletable: boolean;
      hideable: boolean;
    };
  };
  isVisible: boolean;
  sortOrder: number;
}

interface SectionPanelProps {
  sections: SectionItem[];
  hiddenSections: Array<{
    id: string;
    definition: { id: string; title: string };
  }>;
  onSectionClick: (sectionId: string) => void;
  onToggleVisibility: (sectionId: string, isVisible: boolean) => void;
  onMove: (sectionId: string, direction: "up" | "down") => void;
  onDuplicate: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
  onRestore: (hiddenSectionId: string) => void;
  onPermanentDelete: (hiddenSectionId: string) => void;
  onReorder: (sectionIds: string[]) => void;
  showHiddenPanel: boolean;
  onToggleHiddenPanel: () => void;
}

export function SectionPanel({
  sections,
  hiddenSections,
  onSectionClick,
  onToggleVisibility,
  onMove,
  onDuplicate,
  onDelete,
  onRestore,
  onPermanentDelete,
  onReorder,
  showHiddenPanel,
  onToggleHiddenPanel,
}: SectionPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const visibleSections = useMemo(
    () => sections.filter((s) => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  );

  function renderSectionItem({
    item,
    index,
    isFirst,
    isLast,
  }: {
    item: SectionItem;
    index: number;
    isFirst: boolean;
    isLast: boolean;
  }) {
    const isExpanded = expandedSection === item.id;
    const config = item.definition.editorConfig;

    return (
      <li
        key={item.id}
        className={cn(
          "group relative rounded-lg bg-white/[0.02] border border-white/5 transition-all",
          isExpanded && "border-amber-300/30 bg-amber-300/5"
        )}
      >
        {/* Drag Handle */}
        {config.sortable && (
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-amber-300 opacity-0 group-hover:opacity-100 transition"
            aria-label="سحب لإعادة الترتيب"
          >
            <GripVertical className="size-5" />
          </button>
        )}

        <div className="pl-10 pr-4 py-3">
          {/* Main Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSectionClick(item.id)}
              onClickCapture={(e) => e.stopPropagation()}
              className="flex-1 text-start p-2 rounded-lg hover:bg-white/5 transition"
            >
              <span className="font-medium text-white">{item.definition.title}</span>
              <span className="ml-2 text-xs text-white/40 font-mono">#{index + 1}</span>
            </button>

            {/* Visibility Toggle */}
            {config.hideable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(item.id, !item.isVisible);
                }}
                className={cn(
                  "p-1.5 rounded-lg transition",
                  item.isVisible
                    ? "text-amber-300 hover:bg-amber-300/10"
                    : "text-white/30 hover:bg-white/5"
                )}
                aria-label={item.isVisible ? "إخفاء القسم" : "إظهار القسم"}
              >
                {item.isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            )}

            {/* Settings */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSection(isExpanded ? null : item.id);
              }}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
              aria-label="إعدادات القسم"
            >
              <Settings className="size-4" />
            </button>
          </div>

          {/* Expanded Actions */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2">
              {config.duplicable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(item.id);
                  }}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-white/80 bg-white/5 rounded-lg hover:bg-white/10 transition flex items-center justify-center gap-1.5"
                >
                  <Copy className="size-3.5" />
                  نسخ
                </button>
              )}
              {config.deletable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  حذف
                </button>
              )}
              {config.sortable && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(item.id, "up");
                    }}
                    disabled={isFirst}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-white/60 bg-white/5 rounded-lg hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <ChevronUp className="size-3.5" />
                    لأعلى
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(item.id, "down");
                    }}
                    disabled={isLast}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-white/60 bg-white/5 rounded-lg hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <ChevronDown className="size-3.5" />
                    لأسفل
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0d12] border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <PanelLeft className="size-4 text-amber-300" />
          أقسام الصفحة ({visibleSections.length})
        </h3>
        <button
          onClick={onToggleHiddenPanel}
          className={cn(
            "p-1.5 rounded-lg transition",
            showHiddenPanel && "bg-amber-300/20 text-amber-300"
          )}
          aria-label={showHiddenPanel ? "إخفاء الأقسام المحذوفة" : "إظهار الأقسام المحذوفة"}
        >
          <EyeOff className="size-4" />
          <span className="sr-only">الأقسام المخفية ({hiddenSections.length})</span>
        </button>
      </div>

      {/* Sections List with Simple Drag & Drop */}
      <div className="flex-1 overflow-y-auto p-2">
        <SimpleDragDropProvider
          items={visibleSections}
          onReorder={onReorder}
          renderItem={renderSectionItem}
        />
      </div>

      {/* Hidden Sections Trigger */}
      {hiddenSections.length > 0 && (
        <div className="border-t border-white/10 px-4 py-3 bg-[#0b0d12]/80 backdrop-blur sticky bottom-0 z-10">
          <button
            onClick={onToggleHiddenPanel}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white/60 hover:text-white transition"
          >
            <X className="size-4 rotate-45" />
            <span>{hiddenSections.length} قسم مخفي - اضغط للاسترجاع</span>
            <ChevronDown className={cn("size-4 transition-transform", showHiddenPanel && "rotate-180")} />
          </button>
        </div>
      )}
    </div>
  );
}