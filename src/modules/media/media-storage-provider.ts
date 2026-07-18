export type MediaStorageCapabilityMap = {
  publicUrls: boolean;
  readObjects: boolean;
  listObjects: boolean;
  deleteObjects: boolean;
  objectMetadata: boolean;
};

export type MediaStorageObject = {
  providerId: string;
  storageKey: string;
  url: string;
  sizeBytes: number;
  checksumSha256?: string;
  metadata?: Record<string, unknown>;
};

export type MediaStorageObjectMetadata = {
  providerId: string;
  storageKey: string;
  exists: boolean;
  sizeBytes?: number;
  mimeType?: string;
  checksumSha256?: string;
  updatedAt?: Date;
};

export type MediaObjectStorageProvider = {
  id: string;
  capabilities: MediaStorageCapabilityMap;
  putObject(input: {
    key: string;
    bytes: Uint8Array;
    mimeType: string;
    metadata?: Record<string, string>;
  }): Promise<MediaStorageObject>;
  getObjectMetadata?(input: { key: string }): Promise<MediaStorageObjectMetadata>;
  readObject?(input: { key: string }): Promise<Uint8Array>;
  listObjects?(input?: { prefix?: string; cursor?: string }): Promise<{
    objects: MediaStorageObjectMetadata[];
    cursor?: string;
  }>;
  deleteObject?(input: { key: string }): Promise<{ deleted: boolean }>;
  resolvePublicUrl?(input: { key: string }): Promise<{ url: string }>;
};

export type LegacyMediaStorageAdapter = {
  save(input: {
    storageKey: string;
    bytes: Uint8Array;
    mimeType: string;
  }): Promise<{ url: string }>;
};

export function normalizeStorageCapabilities(
  capabilities: Partial<MediaStorageCapabilityMap>,
): MediaStorageCapabilityMap {
  return {
    publicUrls: capabilities.publicUrls ?? false,
    readObjects: capabilities.readObjects ?? false,
    listObjects: capabilities.listObjects ?? false,
    deleteObjects: capabilities.deleteObjects ?? false,
    objectMetadata: capabilities.objectMetadata ?? false,
  };
}

export function createLegacyMediaStorageAdapter(
  provider: MediaObjectStorageProvider,
): LegacyMediaStorageAdapter {
  return {
    async save(input) {
      const object = await provider.putObject({
        key: input.storageKey,
        bytes: input.bytes,
        mimeType: input.mimeType,
      });

      return { url: object.url };
    },
  };
}
