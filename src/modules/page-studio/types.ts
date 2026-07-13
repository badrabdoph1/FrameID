import type { ZodSchema } from "zod";

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

export interface SourceAdapter {
  load(pageId: string): Promise<AdapterLoadResult>;
  save(pageId: string, data: Record<string, unknown>, options: SaveOptions): Promise<AdapterSaveResult>;
  getSchema?(pageId: string): ZodSchema<unknown>;
}

export interface AdapterLoadResult {
  data: Record<string, unknown>;
  version: number;
  updatedAt: string;
}

export interface SaveOptions {
  actor: {
    id: string;
    name: string;
    email: string;
  };
  changeDescription?: string;
}

export interface AdapterSaveResult {
  success: boolean;
  version?: number;
  commitId?: string;
  errors?: Array<{ path: string; message: string }>;
}

export interface AdapterFactory {
  create(pageId: string): SourceAdapter;
}

export interface EditorAction {
  type: "update-field" | "toggle-visibility" | "move" | "duplicate" | "delete" | "restore" | "reorder" | "undo" | "redo";
  payload: unknown;
}

export interface EditorMessage {
  type: "selection-change" | "text-edit-request" | "image-edit-request" | "section-action" | "save" | "preview-toggle";
  payload: unknown;
}