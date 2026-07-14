import { prisma } from "@/lib/prisma";
import { parsePlatformPageDocument } from "@/modules/platform-pages/page-document";
import type {
  PlatformPageKind,
  PlatformPageRecord,
  PlatformPageRepository,
  SavePlatformPageInput,
  SavePlatformPageResult,
} from "@/modules/platform-pages/page-service";

type DatabasePage = {
  id: string;
  key: string;
  route: string;
  kind: string;
  document: unknown;
  version: number;
  schemaVersion: number;
  updatedAt: Date;
};

type DatabaseRevision = {
  id: string;
  version: number;
  actorName: string | null;
  createdAt: Date;
  changeSummary: string | null;
};

type DatabaseRevisionRecord = {
  id: string;
  version: number;
  document: unknown;
  page: { key: string };
};

type PlatformPageDelegate = {
  findUnique(args: { where: { key: string } }): Promise<DatabasePage | null>;
  create(args: { data: Record<string, unknown> }): Promise<DatabasePage>;
  updateMany(args: {
    where: { key: string; version: number };
    data: Record<string, unknown>;
  }): Promise<{ count: number }>;
};

type PlatformPageRevisionDelegate = {
  create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  findMany(args: Record<string, unknown>): Promise<DatabaseRevision[]>;
  findFirst(args: Record<string, unknown>): Promise<DatabaseRevisionRecord | null>;
};

type PlatformPageTransaction = {
  platformPage: PlatformPageDelegate;
  platformPageRevision: PlatformPageRevisionDelegate;
};

export type PlatformPagePrismaClient = PlatformPageTransaction & {
  $transaction(
    callback: (transaction: PlatformPageTransaction) => Promise<SavePlatformPageResult>,
  ): Promise<SavePlatformPageResult>;
};

export function createPrismaPlatformPageRepository(
  client: PlatformPagePrismaClient = prisma as unknown as PlatformPagePrismaClient,
): PlatformPageRepository {
  return {
    async findByKey(pageKey) {
      const page = await client.platformPage.findUnique({ where: { key: pageKey } });
      return page ? mapPage(page) : null;
    },

    async saveWithRevision(input) {
      try {
        return await client.$transaction((transaction) => saveInsideTransaction(transaction, input));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          const current = await client.platformPage.findUnique({ where: { key: input.pageKey } });
          return { status: "conflict", currentVersion: current?.version ?? 0 };
        }
        throw error;
      }
    },

    async listRevisions(pageKey, limit = 30) {
      const revisions = await client.platformPageRevision.findMany({
        where: { page: { key: pageKey } },
        orderBy: { version: "desc" },
        take: limit,
      });

      return revisions.map((revision) => ({
        id: revision.id,
        version: revision.version,
        actorName: revision.actorName,
        createdAt: revision.createdAt,
        changeSummary: revision.changeSummary,
      }));
    },

    async findRevision(pageKey, revisionId) {
      const revision = await client.platformPageRevision.findFirst({
        where: { id: revisionId, page: { key: pageKey } },
        include: { page: { select: { key: true } } },
      });

      return revision
        ? {
            id: revision.id,
            pageKey: revision.page.key,
            version: revision.version,
            document: parsePlatformPageDocument(revision.document),
          }
        : null;
    },
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function saveInsideTransaction(
  transaction: PlatformPageTransaction,
  input: SavePlatformPageInput,
): Promise<SavePlatformPageResult> {
  const existing = await transaction.platformPage.findUnique({ where: { key: input.pageKey } });
  let page: DatabasePage;

  if (!existing) {
    if (input.expectedVersion !== 0) {
      return { status: "conflict", currentVersion: 0 };
    }

    page = await transaction.platformPage.create({
      data: {
        key: input.pageKey,
        route: input.route,
        kind: input.kind,
        document: input.document,
        version: 1,
        schemaVersion: input.document.schemaVersion,
        updatedById: input.actor.id ?? null,
        updatedByName: input.actor.name ?? null,
        updatedByEmail: input.actor.email ?? null,
      },
    });
  } else {
    const update = await transaction.platformPage.updateMany({
      where: { key: input.pageKey, version: input.expectedVersion },
      data: {
        route: input.route,
        kind: input.kind,
        document: input.document,
        schemaVersion: input.document.schemaVersion,
        version: { increment: 1 },
        updatedById: input.actor.id ?? null,
        updatedByName: input.actor.name ?? null,
        updatedByEmail: input.actor.email ?? null,
      },
    });

    if (update.count !== 1) {
      const current = await transaction.platformPage.findUnique({ where: { key: input.pageKey } });
      return { status: "conflict", currentVersion: current?.version ?? 0 };
    }

    const updated = await transaction.platformPage.findUnique({ where: { key: input.pageKey } });
    if (!updated) {
      throw new Error("تعذر قراءة الصفحة بعد حفظها");
    }
    page = updated;
  }

  const revision = await transaction.platformPageRevision.create({
    data: {
      pageId: page.id,
      version: page.version,
      document: input.document,
      schemaVersion: input.document.schemaVersion,
      actorId: input.actor.id ?? null,
      actorName: input.actor.name ?? null,
      actorEmail: input.actor.email ?? null,
      changeSummary: input.changeSummary ?? null,
      restoredFromRevisionId: input.restoredFromRevisionId ?? null,
    },
  });

  return {
    status: "saved",
    page: mapPage(page),
    revisionId: revision.id,
  };
}

function mapPage(page: DatabasePage): PlatformPageRecord {
  return {
    id: page.id,
    key: page.key,
    route: page.route,
    kind: parsePageKind(page.kind),
    document: parsePlatformPageDocument(page.document),
    version: page.version,
    schemaVersion: page.schemaVersion,
    updatedAt: page.updatedAt,
  };
}

function parsePageKind(kind: string): PlatformPageKind {
  if (kind === "EDITORIAL" || kind === "LEGAL" || kind === "AUTH" || kind === "FUNCTIONAL") {
    return kind;
  }

  throw new Error(`نوع صفحة غير مدعوم: ${kind}`);
}
