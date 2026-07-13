"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { PAGE_DEFINITIONS } from "@/modules/page-studio/registry";
import type { PageStudioState, SectionInstance } from "@/modules/page-studio/types";

export function usePageStudio(pageId: string) {
  const [state, setState] = useState<PageStudioState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedTextPath, setSelectedTextPath] = useState<string | null>(null);
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const initializedRef = useRef(false);

  // Initialize
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        const pageDef = PAGE_DEFINITIONS.find((p) => p.id === pageId);
        if (!pageDef) throw new Error(`Page not found: ${pageId}`);

        const res = await fetch(`/api/admin/page-studio/load?pageId=${pageId}`);
        if (!res.ok) throw new Error("Failed to load page data");
        const loadResult = await res.json();

        // Convert to state format
        const sections = pageDef.sections.map((config, index) => {
          const sectionData = getNestedValue(loadResult.data, config.contentPath) ?? config.defaultData ?? {};
          return {
            id: `${config.id}-${index}`,
            configId: config.id,
            definition: config,
            isVisible: true,
            sortOrder: index,
            data: (Array.isArray(sectionData) ? { items: sectionData } : sectionData) as Record<string, unknown>,
          };
        });

        const newState: PageStudioState = {
          pageId,
          pageDefinition: pageDef,
          data: loadResult.data,
          version: loadResult.version,
          updatedAt: loadResult.updatedAt,
          sections,
          hiddenSections: [],
          history: [
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              data: loadResult.data,
              sections,
              hiddenSections: [],
              description: "الحالة الأولية",
            },
          ],
          historyIndex: 0,
          isDirty: false,
          isSaving: false,
          lastSavedVersion: loadResult.version,
        };

        setState(newState);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [pageId]);

  // Local state operations
  const getNestedValue = useCallback((obj: Record<string, unknown>, path: string): unknown => {
    return path.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
  }, []);

  const setNestedValue = useCallback((obj: Record<string, unknown>, path: string, value: unknown): void => {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    const target = keys.reduce((acc, key) => {
      if (!acc[key] || typeof acc[key] !== "object") {
        acc[key] = {};
      }
      return acc[key] as Record<string, unknown>;
    }, obj);
    target[lastKey] = value;
  }, []);

  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  // Section operations
  const updateField = useCallback((sectionId: string, path: string, value: unknown) => {
    setState((prev) => {
      if (!prev) return prev;
      const sectionIndex = prev.sections.findIndex((s) => s.id === sectionId);
      if (sectionIndex === -1) return prev;

      const section = prev.sections[sectionIndex];
      const newData = { ...section.data };
      setNestedValue(newData, path, value);

      const updatedSections = [...prev.sections];
      updatedSections[sectionIndex] = { ...section, data: newData };

      // Sync to root data
      const newDataRoot = { ...prev.data };
      setNestedValue(newDataRoot, section.definition.contentPath, newData);

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        id: generateId(),
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(newDataRoot)),
        sections: JSON.parse(JSON.stringify(updatedSections)),
        hiddenSections: JSON.parse(JSON.stringify(prev.hiddenSections)),
        description: `تعديل ${path}`,
      });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...prev,
        data: newDataRoot,
        sections: updatedSections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, [setNestedValue, generateId]);

  const toggleSectionVisibility = useCallback((sectionId: string, isVisible: boolean) => {
    setState((prev) => {
      if (!prev) return prev;
      const sectionIndex = prev.sections.findIndex((s) => s.id === sectionId);
      if (sectionIndex === -1) return prev;

      const section = prev.sections[sectionIndex];
      const updatedSection = { ...section, isVisible };

      let newSections: SectionInstance[];
      let newHiddenSections: SectionInstance[];

      if (isVisible) {
        newSections = [...prev.sections, updatedSection].sort((a, b) => a.sortOrder - b.sortOrder);
        newHiddenSections = prev.hiddenSections.filter((s) => s.id !== sectionId);
      } else {
        newSections = prev.sections.filter((s) => s.id !== sectionId);
        newHiddenSections = [...prev.hiddenSections, updatedSection];
      }

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        id: generateId(),
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(prev.data)),
        sections: JSON.parse(JSON.stringify(newSections)),
        hiddenSections: JSON.parse(JSON.stringify(newHiddenSections)),
        description: isVisible ? "إظهار قسم" : "إخفاء قسم",
      });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...prev,
        sections: newSections,
        hiddenSections: newHiddenSections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, [generateId]);

  const moveSection = useCallback((sectionId: string, direction: "up" | "down") => {
    setState((prev) => {
      if (!prev) return prev;
      const visibleSections = prev.sections.filter((s) => s.isVisible);
      const sectionIndex = visibleSections.findIndex((s) => s.id === sectionId);
      if (sectionIndex === -1) return prev;

      const newIndex = direction === "up" ? sectionIndex - 1 : sectionIndex + 1;
      if (newIndex < 0 || newIndex >= visibleSections.length) return prev;

      const newVisible = [...visibleSections];
      const [moved] = newVisible.splice(sectionIndex, 1);
      newVisible.splice(newIndex, 0, moved);
      newVisible.forEach((s, i) => { s.sortOrder = i; });

      const hiddenSections = prev.sections.filter((s) => !s.isVisible);
      const allSections = [...newVisible, ...hiddenSections];

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        id: generateId(),
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(prev.data)),
        sections: JSON.parse(JSON.stringify(allSections)),
        hiddenSections: JSON.parse(JSON.stringify(hiddenSections)),
        description: "نقل قسم",
      });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...prev,
        sections: allSections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, [generateId]);

  const duplicateSection = useCallback((sectionId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const section = prev.sections.find((s) => s.id === sectionId);
      if (!section || !section.definition.editorConfig.duplicable) return prev;

      const newSection: SectionInstance = {
        id: generateId(),
        configId: section.configId,
        definition: section.definition,
        isVisible: true,
        sortOrder: prev.sections.length,
        data: JSON.parse(JSON.stringify(section.data)),
      };

      const newSections = [...prev.sections, newSection];

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        id: generateId(),
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(prev.data)),
        sections: JSON.parse(JSON.stringify(newSections)),
        hiddenSections: JSON.parse(JSON.stringify(prev.hiddenSections)),
        description: "نسخ قسم",
      });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...prev,
        sections: newSections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, [generateId]);

  const deleteSection = useCallback((sectionId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const sectionIndex = prev.sections.findIndex((s) => s.id === sectionId);
      if (sectionIndex === -1) return prev;

      const section = prev.sections[sectionIndex];
      const deletedSection = { ...section, isVisible: false };
      const newSections = prev.sections.filter((s) => s.id !== sectionId);
      const newHiddenSections = [...prev.hiddenSections, deletedSection];

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        id: generateId(),
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(prev.data)),
        sections: JSON.parse(JSON.stringify(newSections)),
        hiddenSections: JSON.parse(JSON.stringify(newHiddenSections)),
        description: "حذف قسم",
      });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...prev,
        sections: newSections,
        hiddenSections: newHiddenSections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, [generateId]);

  const restoreSection = useCallback((hiddenSectionId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const hiddenIndex = prev.hiddenSections.findIndex((s) => s.id === hiddenSectionId);
      if (hiddenIndex === -1) return prev;

      const section = prev.hiddenSections[hiddenIndex];
      const restoredSection = { ...section, isVisible: true, sortOrder: prev.sections.length };
      const newHiddenSections = prev.hiddenSections.filter((s) => s.id !== hiddenSectionId);
      const newSections = [...prev.sections, restoredSection];

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        id: generateId(),
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(prev.data)),
        sections: JSON.parse(JSON.stringify(newSections)),
        hiddenSections: JSON.parse(JSON.stringify(newHiddenSections)),
        description: "استعادة قسم",
      });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...prev,
        sections: newSections,
        hiddenSections: newHiddenSections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, [generateId]);

  const permanentlyDeleteSection = useCallback((hiddenSectionId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const newHiddenSections = prev.hiddenSections.filter((s) => s.id !== hiddenSectionId);

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        id: generateId(),
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(prev.data)),
        sections: JSON.parse(JSON.stringify(prev.sections)),
        hiddenSections: JSON.parse(JSON.stringify(newHiddenSections)),
        description: "حذف نهائي لقسم",
      });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...prev,
        hiddenSections: newHiddenSections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, [generateId]);

  const reorderSections = useCallback((sectionIds: string[]) => {
    setState((prev) => {
      if (!prev) return prev;
      const visibleSections = prev.sections.filter((s) => s.isVisible);
      const reordered = sectionIds
        .map((id) => visibleSections.find((s) => s.id === id))
        .filter((s): s is SectionInstance => s !== undefined);

      reordered.forEach((s, i) => { s.sortOrder = i; });
      const hiddenSections = prev.sections.filter((s) => !s.isVisible);
      const allSections = [...reordered, ...hiddenSections];

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({
        id: generateId(),
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(prev.data)),
        sections: JSON.parse(JSON.stringify(allSections)),
        hiddenSections: JSON.parse(JSON.stringify(hiddenSections)),
        description: "إعادة ترتيب الأقسام",
      });
      if (newHistory.length > 50) newHistory.shift();

      return {
        ...prev,
        sections: allSections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      };
    });
  }, [generateId]);

  const undo = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.historyIndex <= 0) return prev;
      const entry = prev.history[prev.historyIndex - 1];
      return {
        ...prev,
        historyIndex: prev.historyIndex - 1,
        data: JSON.parse(JSON.stringify(entry.data)),
        sections: JSON.parse(JSON.stringify(entry.sections)),
        hiddenSections: JSON.parse(JSON.stringify(entry.hiddenSections)),
        isDirty: true,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.historyIndex >= prev.history.length - 1) return prev;
      const entry = prev.history[prev.historyIndex + 1];
      return {
        ...prev,
        historyIndex: prev.historyIndex + 1,
        data: JSON.parse(JSON.stringify(entry.data)),
        sections: JSON.parse(JSON.stringify(entry.sections)),
        hiddenSections: JSON.parse(JSON.stringify(entry.hiddenSections)),
        isDirty: true,
      };
    });
  }, []);

  const canUndo = state ? state.historyIndex > 0 : false;
  const canRedo = state ? state.historyIndex < state.history.length - 1 : false;

  // Server actions
  const save = useCallback(async () => {
    if (!state) return { success: false, errors: [{ path: "general", message: "No state" }] };

    setSaveStatus("saving");
    setSaveMessage("جاري الحفظ...");

    try {
      const res = await fetch("/api/admin/page-studio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, data: state.data }),
      });

      const result = await res.json();

      if (result.success) {
        setSaveStatus("success");
        setSaveMessage(`تم الحفظ بنجاح (النسخة ${result.version})`);
        setToast({ type: "success", message: "تم حفظ التغييرات" });
        setState((prev) => prev ? { ...prev, version: result.version, lastSavedVersion: result.version, isDirty: false } : prev);
        setTimeout(() => setSaveStatus("idle"), 5000);
        return { success: true, errors: undefined };
      } else {
        const errorMsg = result.errors?.[0]?.message || "فشل الحفظ";
        setSaveStatus("error");
        setSaveMessage(errorMsg);
        setToast({ type: "error", message: errorMsg });
        setTimeout(() => setSaveStatus("idle"), 5000);
        return { success: false, errors: result.errors };
      }
    } catch {
      setSaveStatus("error");
      setSaveMessage("حدث خطأ أثناء الحفظ");
      setToast({ type: "error", message: "حدث خطأ أثناء الحفظ" });
      setTimeout(() => setSaveStatus("idle"), 5000);
      return { success: false, errors: [{ path: "general", message: "حدث خطأ أثناء الحفظ" }] };
    }
  }, [pageId, state?.data]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/page-studio/load?pageId=${pageId}`);
      if (!res.ok) throw new Error("Failed to load");
      const loadResult = await res.json();

      const pageDef = PAGE_DEFINITIONS.find((p) => p.id === pageId);
      if (!pageDef) throw new Error(`Page not found: ${pageId}`);

      const sections = pageDef.sections.map((config, index) => {
        const sectionData = getNestedValue(loadResult.data, config.contentPath) ?? config.defaultData ?? {};
        return {
          id: `${config.id}-${index}`,
          configId: config.id,
          definition: config,
          isVisible: true,
          sortOrder: index,
          data: Array.isArray(sectionData) ? { items: sectionData } : sectionData as Record<string, unknown>,
        };
      });

      setState({
        pageId,
        pageDefinition: pageDef,
        data: loadResult.data,
        version: loadResult.version,
        updatedAt: loadResult.updatedAt,
        sections,
        hiddenSections: [],
        history: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            data: loadResult.data,
            sections,
            hiddenSections: [],
            description: "تم التحديث من المصدر",
          },
        ],
        historyIndex: 0,
        isDirty: false,
        isSaving: false,
        lastSavedVersion: loadResult.version,
      });

      setToast({ type: "info", message: "تم تحديث البيانات من المصدر" });
    } catch {
      setToast({ type: "error", message: "فشل تحديث البيانات" });
    }
  }, [pageId, getNestedValue]);

  const discardChanges = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const entry = prev.history[prev.historyIndex];
      return {
        ...prev,
        data: JSON.parse(JSON.stringify(entry.data)),
        sections: JSON.parse(JSON.stringify(entry.sections)),
        hiddenSections: JSON.parse(JSON.stringify(entry.hiddenSections)),
        isDirty: false,
      };
    });
    setToast({ type: "info", message: "تم تجاهل التغييرات" });
  }, []);

  const selectSection = useCallback((sectionId: string | null) => {
    setSelectedSectionId(sectionId);
  }, []);

  const selectText = useCallback((path: string | null) => {
    setSelectedTextPath(path);
  }, []);

  const selectImage = useCallback((path: string | null) => {
    setSelectedImagePath(path);
  }, []);

  // Clear toast after delay
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const pageDefinition = useMemo(() => {
    return PAGE_DEFINITIONS.find((p) => p.id === pageId) ?? undefined;
  }, [pageId]);
  const visibleSections = state?.sections.filter((s) => s.isVisible) ?? [];
  const hiddenSections = state?.hiddenSections ?? [];

  return {
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
    setSelectedSection: selectSection,
    setSelectedText: selectText,
    setSelectedImage: selectImage,
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
    setToast,
  };
}
