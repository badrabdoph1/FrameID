import {
  parsePlatformPageDocument,
  type PlatformPageDocument,
} from "@/modules/platform-pages/page-document";
import { validatePlatformPagePolicy } from "@/modules/platform-pages/page-policy";

export type PlatformPageKind = "EDITORIAL" | "LEGAL" | "AUTH" | "FUNCTIONAL";

export type PlatformPageRecord = {
  id: string;
  key: string;
  route: string;
  kind: PlatformPageKind;
  document: PlatformPageDocument;
  version: number;
  schemaVersion: number;
  updatedAt: Date;
};

export type PlatformPageRevisionSummary = {
  id: string;
  version: number;
  actorName: string | null;
  createdAt: Date;
  changeSummary: string | null;
};

export type PlatformPageRevisionRecord = {
  id: string;
  pageKey: string;
  version: number;
  document: PlatformPageDocument;
};

export type PageActor = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

export type SavePlatformPageInput = {
  pageKey: string;
  route: string;
  kind: PlatformPageKind;
  expectedVersion: number;
  document: PlatformPageDocument;
  actor: PageActor;
  changeSummary?: string;
  restoredFromRevisionId?: string;
};

export type SavePlatformPageResult =
  | {
      status: "saved";
      page: PlatformPageRecord;
      revisionId: string;
    }
  | {
      status: "conflict";
      currentVersion: number;
    };

export type RestorePlatformPageInput = Omit<SavePlatformPageInput, "document" | "changeSummary" | "restoredFromRevisionId"> & {
  revisionId: string;
};

export interface PlatformPageRepository {
  findByKey(pageKey: string): Promise<PlatformPageRecord | null>;
  saveWithRevision(input: SavePlatformPageInput): Promise<SavePlatformPageResult>;
  listRevisions(pageKey: string, limit?: number): Promise<PlatformPageRevisionSummary[]>;
  findRevision(pageKey: string, revisionId: string): Promise<PlatformPageRevisionRecord | null>;
}

export class PlatformPageConflictError extends Error {
  readonly currentVersion: number;

  constructor(currentVersion: number) {
    super("تم حفظ نسخة أحدث من الصفحة بواسطة مستخدم آخر");
    this.name = "PlatformPageConflictError";
    this.currentVersion = currentVersion;
  }
}

export function createPlatformPageDocumentLoader(repository: PlatformPageRepository) {
  return {
    async load(pageKey: string, legacyDocument: PlatformPageDocument) {
      const storedPage = await repository.findByKey(pageKey);
      return storedPage?.document ?? legacyDocument;
    },
  };
}

export function createPlatformPageService(repository: PlatformPageRepository) {
  async function save(input: SavePlatformPageInput) {
    const document = parsePlatformPageDocument(input.document);

    if (document.sections.length === 0) {
      throw new Error("الصفحة يجب أن تحتوي على قسم واحد على الأقل");
    }

    if (document.pageKey !== input.pageKey) {
      throw new Error("مفتاح الصفحة لا يطابق محتواها");
    }

    validatePlatformPagePolicy(input.pageKey, document);

    const result = await repository.saveWithRevision({ ...input, document });

    if (result.status === "conflict") {
      throw new PlatformPageConflictError(result.currentVersion);
    }

    return result;
  }

  return {
    findByKey(pageKey: string) {
      return repository.findByKey(pageKey);
    },

    listRevisions(pageKey: string, limit = 30) {
      return repository.listRevisions(pageKey, limit);
    },

    save,

    async restore(input: RestorePlatformPageInput) {
      const revision = await repository.findRevision(input.pageKey, input.revisionId);
      if (!revision) {
        throw new Error("النسخة المطلوبة غير موجودة لهذه الصفحة");
      }

      return save({
        pageKey: input.pageKey,
        route: input.route,
        kind: input.kind,
        expectedVersion: input.expectedVersion,
        document: revision.document,
        actor: input.actor,
        restoredFromRevisionId: revision.id,
        changeSummary: `استعادة النسخة ${revision.version}`,
      });
    },
  };
}
