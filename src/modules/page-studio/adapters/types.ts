export interface SourceAdapter {
  load(pageId: string): Promise<AdapterLoadResult>;
  save(pageId: string, data: Record<string, unknown>, options: SaveOptions): Promise<AdapterSaveResult>;
  getSchema?(pageId: string): unknown;
}

export interface AdapterLoadResult {
  data: Record<string, unknown>;
  version: number;
  updatedAt: string;
}

export interface AdapterSaveResult {
  success: boolean;
  version: number;
  commitId?: string;
  errors?: Array<{ path: string; message: string }>;
}

export interface SaveOptions {
  actor: {
    id: string;
    name: string;
    email: string;
  };
  changeDescription?: string;
}

export interface AdapterFactory {
  create(pageId: string): SourceAdapter;
}