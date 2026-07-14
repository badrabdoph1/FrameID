import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type ContentRevisionEntry = {
  id: string;
  type: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
  commitId?: string | null;
  gitStatus: "committed" | "not-configured" | "failed";
  gitError?: string | null;
};

function mapPrismaRevision(r: {
  id: string; type: string; actorId: string | null; actorName: string | null;
  actorEmail: string | null; before: unknown; after: unknown;
  commitId: string | null; gitStatus: string; gitError: string | null;
  createdAt: Date;
}): ContentRevisionEntry {
  return {
    id: r.id,
    type: r.type,
    actorId: r.actorId,
    actorName: r.actorName,
    actorEmail: r.actorEmail,
    before: r.before,
    after: r.after,
    createdAt: r.createdAt.toISOString(),
    commitId: r.commitId,
    gitStatus: (r.gitStatus === "committed" || r.gitStatus === "not-configured" || r.gitStatus === "failed")
      ? r.gitStatus : "not-configured",
    gitError: r.gitError,
  };
}

export async function appendContentRevision(entry: ContentRevisionEntry): Promise<void> {
  const jsonNull = Prisma.JsonNull;
  await prisma.contentRevision.create({
    data: {
      id: entry.id,
      type: entry.type,
      actorId: entry.actorId ?? null,
      actorName: entry.actorName ?? null,
      actorEmail: entry.actorEmail ?? null,
      before: entry.before !== null && entry.before !== undefined ? (entry.before as Prisma.InputJsonValue) : jsonNull,
      after: entry.after !== null && entry.after !== undefined ? (entry.after as Prisma.InputJsonValue) : jsonNull,
      commitId: entry.commitId ?? null,
      gitStatus: entry.gitStatus,
      gitError: entry.gitError ?? null,
      createdAt: new Date(entry.createdAt),
    },
  });
}

export async function getContentRevisionHistory(limit = 100): Promise<ContentRevisionEntry[]> {
  const rows = await prisma.contentRevision.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapPrismaRevision);
}

export async function getContentRevisionById(id: string): Promise<ContentRevisionEntry | null> {
  const row = await prisma.contentRevision.findUnique({ where: { id } });
  return row ? mapPrismaRevision(row) : null;
}
