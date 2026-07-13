"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  ChevronLeft,
  Settings,
  Copy,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PagePreview } from "./page-preview";
import { EditorToolbar } from "./editor-toolbar";
import { SectionPanel } from "./section-panel";
import { HiddenSectionsPanel } from "./hidden-sections-panel";
import { InlineTextEditor } from "./inline-text-editor";
import { ImageReplaceDialog } from "./image-replace-dialog";
import { usePageStudio } from "./use-page-studio";

interface PageStudioEditorProps {
  pageId: string;
}

export function PageStudioEditor({ pageId }: PageStudioEditorProps) {
  const router = useRouter();
  const {
    state,
    isLoading,
    error,
    updateField,
    toggleSectionVisibility,
    moveSection,
    duplicateSection,
    deleteSection,
    restoreSection,
    permanentlyDeleteSection,
    reorderSections,
    undo,
    redo,
    canUndo,
    canRedo,
    save,
    refresh,
    discardChanges,
    selectedSectionId,
    selectedTextPath,
    selectedImagePath,
    setSelectedSection,
    setSelectedText,
    setSelectedImage,
    previewMode,
    setPreviewMode,
    pageDefinition,
    visibleSections,
    hiddenSections,
    showHiddenPanel,
    setShowHiddenPanel,
    saveStatus,
    saveMessage,
    toast,
  } = usePageStudio(pageId);

  const handleSave = useCallback(async () => {
    await save();
  }, [save]);

  const handleDiscard = useCallback(() => {
    discardChanges();
  }, [discardChanges]);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleSectionAction = useCallback((action: string) => {
    if (!selectedSectionId) return;

    switch (action) {
      case "settings":
        // TODO: Open section settings modal
        break;
      case "duplicate":
        duplicateSection(selectedSectionId);
        break;
      case "delete":
        deleteSection(selectedSectionId);
        break;
    }
  }, [selectedSectionId, duplicateSection, deleteSection]);

  const getNestedValue = useCallback((obj: Record<string, unknown>, path: string): unknown => {
    return path.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 text-amber-300 animate-spin" />
      </div>
    );
  }

  if (error || !state || !pageDefinition) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="size-12 text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-white">فشل تحميل المحرر</h2>
        <p className="mt-2 text-sm text-white/50">{error || "تعريف الصفحة غير موجود"}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400"
        >
          <ChevronLeft className="size-4" />
          رجوع
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <EditorToolbar
        pageDef={pageDefinition}
        state={state}
        previewMode={previewMode}
        onPreviewToggle={() => setPreviewMode((p) => !p)}
        onSave={handleSave}
        onUndo={undo}
        onRedo={redo}
        onDiscard={handleDiscard}
        onRefresh={handleRefresh}
        canUndo={canUndo}
        canRedo={canRedo}
        isSaving={saveStatus === "saving"}
        isDirty={state.isDirty}
        saveStatus={saveStatus}
        saveMessage={saveMessage}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Page Preview */}
        <div className="relative flex-1 min-w-0 bg-white">
          <PagePreview
            pageUrl={pageDefinition.previewUrl}
            selectedSectionId={selectedSectionId}
            selectedTextPath={selectedTextPath}
            selectedImagePath={selectedImagePath}
            onSectionClick={(sectionId) => setSelectedSection(sectionId)}
            onTextClick={(path, _rect, _value) => setSelectedText(path)}
            onImageClick={(path, _rect, _src) => setSelectedImage(path)}
            previewMode={previewMode}
          />

          {/* Inline Text Editor */}
          {selectedTextPath && (
            <InlineTextEditor
              path={selectedTextPath}
              value={String(getNestedValue(state.data, selectedTextPath) ?? "")}
              onSave={(path, value) => updateField(selectedSectionId ?? "", path, value)}
              onClose={() => setSelectedText(null)}
            />
          )}

          {/* Image Replace Dialog */}
          {selectedImagePath && (
            <ImageReplaceDialog
              path={selectedImagePath}
              currentSrc={String(getNestedValue(state.data, selectedImagePath) ?? "")}
              onReplace={(newUrl) => updateField(selectedSectionId ?? "", selectedImagePath, newUrl)}
              onClose={() => setSelectedImage(null)}
            />
          )}

          {/* Selected Section Highlight */}
          {selectedSectionId && !previewMode && (
            <SectionHighlight
              sectionId={selectedSectionId}
              definition={state.sections.find((s) => s.id === selectedSectionId)?.definition}
              onAction={handleSectionAction}
            />
          )}
        </div>

        {/* Side Panels */}
        <div className="hidden lg:flex lg:w-80 flex-col border-l border-white/10 bg-[#0b0d12] overflow-hidden">
          {/* Sections Panel */}
          <SectionPanel
            sections={visibleSections}
            hiddenSections={hiddenSections}
            onSectionClick={setSelectedSection}
            onToggleVisibility={toggleSectionVisibility}
            onMove={moveSection}
            onDuplicate={duplicateSection}
            onDelete={deleteSection}
            onRestore={restoreSection}
            onPermanentDelete={permanentlyDeleteSection}
            onReorder={reorderSections}
            showHiddenPanel={showHiddenPanel}
            onToggleHiddenPanel={() => setShowHiddenPanel((p) => !p)}
          />

          {/* Hidden Sections Panel */}
          {showHiddenPanel && hiddenSections.length > 0 && (
            <HiddenSectionsPanel
              sections={hiddenSections}
              onRestore={restoreSection}
              onPermanentDelete={permanentlyDeleteSection}
              onClose={() => setShowHiddenPanel(false)}
            />
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheets */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {showHiddenPanel && hiddenSections.length > 0 && (
          <HiddenSectionsPanel
            sections={hiddenSections}
            onRestore={restoreSection}
            onPermanentDelete={permanentlyDeleteSection}
            onClose={() => setShowHiddenPanel(false)}
            isMobile
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 animate-slide-up flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold",
            toast.type === "success" && "bg-green-600 text-white",
            toast.type === "error" && "bg-red-600 text-white",
            toast.type === "info" && "bg-blue-600 text-white"
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function SectionHighlight({
  sectionId,
  definition,
  onAction,
}: {
  sectionId: string;
  definition?: import("@/modules/page-studio/types").PageSectionDefinition;
  onAction: (action: string) => void;
}) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div
        className="relative pointer-events-auto"
        data-section-id={sectionId}
      >
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-lg bg-amber-300 px-2 py-1 text-xs font-bold text-black">
          {definition?.title || sectionId}
          <button
            onClick={(e) => { e.stopPropagation(); onAction("settings"); }}
            className="ml-1 p-0.5 hover:bg-amber-400 rounded"
            aria-label="إعدادات القسم"
          >
            <Settings className="size-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAction("duplicate"); }}
            className="p-0.5 hover:bg-amber-400 rounded"
            aria-label="نسخ القسم"
          >
            <Copy className="size-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAction("delete"); }}
            className="p-0.5 hover:bg-red-500 hover:text-white rounded"
            aria-label="حذف القسم"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
        <div className="absolute inset-0 border-2 border-amber-300/50 bg-amber-300/10 pointer-events-none" />
      </div>
    </div>
  );
}