import type { PageDefinition, PageSectionDefinition, SectionInstance, PageStudioState } from "./types";
import type { SourceAdapter } from "./adapters";
import { getPageDefinition } from "./registry";
import { createJsonFileAdapter } from "./adapters";

class PageStudioService {
  private state: PageStudioState | null = null;
  private adapter: SourceAdapter | null = null;
  private subscribers: Set<() => void> = new Set();
  private maxHistorySize = 50;

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  async initialize(pageId: string): Promise<void> {
    const pageDefinition = getPageDefinition(pageId);
    if (!pageDefinition) {
      throw new Error(`Page definition not found: ${pageId}`);
    }

    this.adapter = this.createAdapter(pageDefinition);
    const loadResult = await this.adapter.load(pageId);

    const sections = this.initializeSections(pageDefinition, loadResult.data);
    const hiddenSections: SectionInstance[] = [];

    this.state = {
      pageId,
      pageDefinition,
      data: loadResult.data,
      version: loadResult.version,
      updatedAt: loadResult.updatedAt,
      sections,
      hiddenSections,
      history: [
        {
          id: this.generateId(),
          timestamp: Date.now(),
          data: loadResult.data,
          sections,
          hiddenSections,
          description: "الحالة الأولية",
        },
      ],
      historyIndex: 0,
      isDirty: false,
      isSaving: false,
      lastSavedVersion: loadResult.version,
    };

    this.notify();
  }

  private createAdapter(pageDefinition: PageDefinition): SourceAdapter {
    if (pageDefinition.sourceType === "json-file") {
      return createJsonFileAdapter(pageDefinition.sourceKey as "marketing/homepage");
    }
    throw new Error(`Unsupported source type: ${pageDefinition.sourceType}`);
  }

  private initializeSections(pageDefinition: PageDefinition, data: Record<string, unknown>): SectionInstance[] {
    return pageDefinition.sections.map((config, index) => {
      const sectionData = this.getNestedValue(data, config.contentPath) ?? config.defaultData ?? {};
      return {
        id: this.generateId(),
        configId: config.id,
        definition: config,
        isVisible: true,
        sortOrder: index,
        data: Array.isArray(sectionData) ? { items: sectionData } : sectionData as Record<string, unknown>,
      };
    });
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    const target = keys.reduce((acc, key) => {
      if (!acc[key] || typeof acc[key] !== "object") {
        acc[key] = {};
      }
      return acc[key] as Record<string, unknown>;
    }, obj);
    target[lastKey] = value;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  getState(): PageStudioState | null {
    return this.state;
  }

  updateSectionData(sectionId: string, path: string, value: unknown): void {
    if (!this.state) return;

    const section = this.state.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const newData = { ...section.data };
    this.setNestedValue(newData, path, value);

    section.data = newData;
    this.syncDataToState();
    this.pushHistory(`تعديل ${path}`);
    this.notify();
  }

  updateSectionVisibility(sectionId: string, isVisible: boolean): void {
    if (!this.state) return;

    const sectionIndex = this.state.sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) return;

    const [section] = this.state.sections.splice(sectionIndex, 1);
    section.isVisible = isVisible;

    if (isVisible) {
      this.state.sections.push(section);
      this.state.sections.sort((a, b) => a.sortOrder - b.sortOrder);
    } else {
      this.state.hiddenSections.push(section);
    }

    this.pushHistory(isVisible ? "إظهار قسم" : "إخفاء قسم");
    this.notify();
  }

  moveSection(sectionId: string, direction: "up" | "down"): void {
    if (!this.state) return;

    const visibleSections = this.state.sections.filter((s) => s.isVisible);
    const sectionIndex = visibleSections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) return;

    const newIndex = direction === "up" ? sectionIndex - 1 : sectionIndex + 1;
    if (newIndex < 0 || newIndex >= visibleSections.length) return;

    const [moved] = visibleSections.splice(sectionIndex, 1);
    visibleSections.splice(newIndex, 0, moved);
    visibleSections.forEach((s, i) => (s.sortOrder = i));

    const hiddenSections = this.state.sections.filter((s) => !s.isVisible);
    this.state.sections = [...visibleSections, ...hiddenSections];

    this.pushHistory("تحريك قسم");
    this.notify();
  }

  duplicateSection(sectionId: string): void {
    if (!this.state) return;

    const section = this.state.sections.find((s) => s.id === sectionId);
    if (!section || !section.definition.editorConfig.duplicable) return;

    const newSection: SectionInstance = {
      id: this.generateId(),
      configId: section.configId,
      definition: section.definition,
      isVisible: true,
      sortOrder: this.state.sections.length,
      data: JSON.parse(JSON.stringify(section.data)),
    };

    this.state.sections.push(newSection);
    this.pushHistory("نسخ قسم");
    this.notify();
  }

  deleteSection(sectionId: string): void {
    if (!this.state) return;

    const sectionIndex = this.state.sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) return;

    const [section] = this.state.sections.splice(sectionIndex, 1);
    section.isVisible = false;
    this.state.hiddenSections.push(section);

    this.pushHistory("حذف قسم");
    this.notify();
  }

  restoreHiddenSection(hiddenSectionId: string): void {
    if (!this.state) return;

    const hiddenIndex = this.state.hiddenSections.findIndex((s) => s.id === hiddenSectionId);
    if (hiddenIndex === -1) return;

    const [section] = this.state.hiddenSections.splice(hiddenIndex, 1);
    section.isVisible = true;
    section.sortOrder = this.state.sections.length;
    this.state.sections.push(section);

    this.pushHistory("استعادة قسم");
    this.notify();
  }

  permanentlyDeleteHiddenSection(hiddenSectionId: string): void {
    if (!this.state) return;

    const index = this.state.hiddenSections.findIndex((s) => s.id === hiddenSectionId);
    if (index === -1) return;

    this.state.hiddenSections.splice(index, 1);
    this.pushHistory("حذف نهائي لقسم");
    this.notify();
  }

  reorderSections(sectionIds: string[]): void {
    if (!this.state) return;

    const reordered = sectionIds
      .map((id) => this.state!.sections.find((s) => s.id === id))
      .filter((s): s is SectionInstance => s !== undefined);

    this.state.sections = reordered;
    this.pushHistory("إعادة ترتيب الأقسام");
    this.notify();
  }

  private syncDataToState(): void {
    if (!this.state) return;

    for (const section of this.state.sections) {
      this.setNestedValue(this.state.data, section.definition.contentPath, section.data);
    }
    for (const section of this.state.hiddenSections) {
      this.setNestedValue(this.state.data, section.definition.contentPath, section.data);
    }
  }

  private pushHistory(description: string): void {
    if (!this.state) return;

    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    this.state.history.push({
      id: this.generateId(),
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(this.state.data)),
      sections: JSON.parse(JSON.stringify(this.state.sections)),
      hiddenSections: JSON.parse(JSON.stringify(this.state.hiddenSections)),
      description,
    });

    if (this.state.history.length > this.maxHistorySize) {
      this.state.history.shift();
    } else {
      this.state.historyIndex = this.state.history.length - 1;
    }

    this.state.isDirty = true;
  }

  canUndo(): boolean {
    return this.state ? this.state.historyIndex > 0 : false;
  }

  canRedo(): boolean {
    return this.state ? this.state.historyIndex < this.state.history.length - 1 : false;
  }

  undo(): void {
    if (!this.state || !this.canUndo()) return;

    this.state.historyIndex--;
    const entry = this.state.history[this.state.historyIndex];
    this.state.data = JSON.parse(JSON.stringify(entry.data));
    this.state.sections = JSON.parse(JSON.stringify(entry.sections));
    this.state.hiddenSections = JSON.parse(JSON.stringify(entry.hiddenSections));
    this.state.isDirty = true;
    this.notify();
  }

  redo(): void {
    if (!this.state || !this.canRedo()) return;

    this.state.historyIndex++;
    const entry = this.state.history[this.state.historyIndex];
    this.state.data = JSON.parse(JSON.stringify(entry.data));
    this.state.sections = JSON.parse(JSON.stringify(entry.sections));
    this.state.hiddenSections = JSON.parse(JSON.stringify(entry.hiddenSections));
    this.state.isDirty = true;
    this.notify();
  }

  async save(actor: { id: string; name: string; email: string }): Promise<import("./adapters").AdapterSaveResult> {
    if (!this.state || !this.adapter) {
      return { success: false, version: 0, errors: [{ path: "general", message: "Service not initialized" }] };
    }

    this.state.isSaving = true;
    this.notify();

    try {
      const result = await this.adapter.save(this.state.pageId, this.state.data, { actor });

      if (result.success) {
        this.state.version = result.version;
        this.state.lastSavedVersion = result.version;
        this.state.isDirty = false;
        this.state.isSaving = false;
        this.notify();
      }

      return result;
    } catch (error) {
      this.state.isSaving = false;
      this.notify();
      return {
        success: false,
        version: 0,
        errors: [{ path: "general", message: error instanceof Error ? error.message : "Unknown error" }],
      };
    }
  }

  async refresh(): Promise<void> {
    if (!this.state || !this.adapter) return;

    const loadResult = await this.adapter.load(this.state.pageId);
    const sections = this.initializeSections(this.state.pageDefinition, loadResult.data);

    this.state.data = loadResult.data;
    this.state.version = loadResult.version;
    this.state.updatedAt = loadResult.updatedAt;
    this.state.sections = sections;
    this.state.hiddenSections = [];
    this.state.history = [
      {
        id: this.generateId(),
        timestamp: Date.now(),
        data: loadResult.data,
        sections,
        hiddenSections: [],
        description: "تم التحديث من المصدر",
      },
    ];
    this.state.historyIndex = 0;
    this.state.isDirty = false;
    this.state.lastSavedVersion = loadResult.version;
    this.notify();
  }

  discardChanges(): void {
    if (!this.state) return;

    const entry = this.state.history[this.state.historyIndex];
    this.state.data = JSON.parse(JSON.stringify(entry.data));
    this.state.sections = JSON.parse(JSON.stringify(entry.sections));
    this.state.hiddenSections = JSON.parse(JSON.stringify(entry.hiddenSections));
    this.state.isDirty = false;
    this.notify();
  }
}

export const pageStudioService = new PageStudioService();