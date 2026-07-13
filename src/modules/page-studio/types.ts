import type { ZodSchema } from "zod";
import type { SourceAdapter as _SourceAdapter, AdapterLoadResult as _AdapterLoadResult, AdapterSaveResult as _AdapterSaveResult, SaveOptions as _SaveOptions, AdapterFactory as _AdapterFactory } from "./adapters/types";

export interface EditableFieldConfig {
  path: string;
  label: string;
  type: "text" | "textarea" | "image" | "richtext" | "url" | "number" | "boolean";
  required?: boolean;
  placeholder?: string;
  validation?: (value: unknown) => string | null;
}

export interface PageSectionDefinition {
  id: string;
  title: string;
  description?: string;
  contentPath: string;
  defaultData: Record<string, unknown>;
  editorConfig: {
    editableFields: EditableFieldConfig[];
    sortable: boolean;
    duplicable: boolean;
    deletable: boolean;
    hideable: boolean;
  };
}

export interface PageDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  route: string;
  sourceType: "json-file" | "database";
  sourceKey: string;
  schema: ZodSchema<unknown>;
  sections: PageSectionDefinition[];
  previewUrl: string;
  permissions: {
    view: string;
    edit: string;
  };
}

export interface SectionInstance {
  id: string;
  configId: string;
  definition: PageSectionDefinition;
  isVisible: boolean;
  sortOrder: number;
  data: Record<string, unknown>;
}

export interface PageStudioState {
  pageId: string;
  pageDefinition: PageDefinition;
  data: Record<string, unknown>;
  version: number;
  updatedAt: string;
  sections: SectionInstance[];
  hiddenSections: SectionInstance[];
  history: HistoryEntry[];
  historyIndex: number;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedVersion: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  data: Record<string, unknown>;
  sections: SectionInstance[];
  hiddenSections: SectionInstance[];
  description: string;
}

export interface EditorAction {
  type: "update-field" | "toggle-visibility" | "move" | "duplicate" | "delete" | "restore" | "reorder" | "undo" | "redo";
  payload: unknown;
}

export interface EditorMessage {
  type: "selection-change" | "text-edit-request" | "image-edit-request" | "section-action" | "save" | "preview-toggle";
  payload: unknown;
}