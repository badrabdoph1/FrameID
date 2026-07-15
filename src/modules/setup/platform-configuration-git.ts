import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { prisma } from "@/lib/prisma";
import { commitContentFilesToGitHub } from "@/lib/content/git-sync";
import { appendContentRevision } from "@/lib/content/revisions";

const RELATIVE_PATH = "content/platform/admin-config.json";
const ABSOLUTE_PATH = join(process.cwd(), RELATIVE_PATH);

export async function syncPlatformConfigurationToGitHub(input: {
  actor: { id: string; name?: string | null; email?: string | null };
  reason: string;
}) {
  const before = existsSync(ABSOLUTE_PATH) ? JSON.parse(readFileSync(ABSOLUTE_PATH, "utf8")) as unknown : null;
  const [themes, templates, plans, paymentSettings, featureFlags, platformMessages, platformPages] = await Promise.all([
    prisma.theme.findMany({ where: { deletedAt: null }, orderBy: { code: "asc" }, select: { code: true, name: true, status: true, version: true, category: true, defaultConfig: true, contentSchema: true } }),
    prisma.template.findMany({ where: { deletedAt: null }, orderBy: { showroomOrder: "asc" }, select: { code: true, name: true, status: true, version: true, showroomOrder: true, previewData: true, settings: true, theme: { select: { code: true } } } }),
    prisma.plan.findMany({ orderBy: { code: "asc" }, select: { code: true, name: true, priceAmount: true, currency: true, billingInterval: true, features: true, isActive: true } }),
    prisma.paymentSettings.findMany({ orderBy: { sortOrder: "asc" }, select: { paymentMethod: true, isActive: true, label: true, description: true, config: true, sortOrder: true, accounts: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, select: { label: true, displayName: true, accountName: true, accountNumber: true, accountIdentifier: true, iban: true, swift: true, phoneNumber: true, bankName: true, instructions: true, notes: true, isActive: true, sortOrder: true } } } }),
    prisma.featureFlag.findMany({ where: { scope: "PLATFORM", tenantId: null, siteId: null }, orderBy: { key: "asc" }, select: { key: true, enabled: true, value: true } }),
    prisma.notificationLog.findMany({ where: { tenantId: null, category: "ACTIVATION_MESSAGE_TEMPLATE", deletedAt: null }, orderBy: { title: "asc" }, select: { category: true, type: true, title: true, body: true } }),
    prisma.platformPage.findMany({ orderBy: { key: "asc" }, select: { key: true, route: true, kind: true, document: true, version: true, schemaVersion: true } }),
  ]);
  const after = {
    version: 1,
    updatedAt: new Date().toISOString(),
    themes,
    templates: templates.map((item) => ({ ...item, themeCode: item.theme.code, theme: undefined })),
    plans,
    paymentSettings,
    featureFlags,
    platformMessages,
    platformPages,
  };
  mkdirSync(dirname(ABSOLUTE_PATH), { recursive: true });
  writeFileSync(ABSOLUTE_PATH, JSON.stringify(after, null, 2), "utf8");
  const committed = await commitContentFilesToGitHub({
    files: [{ path: RELATIVE_PATH, absolutePath: ABSOLUTE_PATH }],
    message: `حفظ إعدادات المنصة: ${input.reason}`,
  });
  if (!committed.commitSha) throw new Error(committed.error ?? "فشل حفظ إعدادات المنصة في GitHub");

  await appendContentRevision({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: `platform/${input.reason}`,
    actorId: input.actor.id,
    actorName: input.actor.name ?? null,
    actorEmail: input.actor.email ?? null,
    before,
    after,
    createdAt: after.updatedAt,
    commitId: committed.commitSha,
    gitStatus: "committed",
  });
  return { commitId: committed.commitSha };
}

export async function restorePlatformConfigurationToGitHub(input: {
  value: unknown;
  actor: { id: string; name?: string | null; email?: string | null };
  sourceRevisionId: string;
}) {
  if (!input.value || typeof input.value !== "object" || Array.isArray(input.value)) throw new Error("الإصدار السابق لإعدادات المنصة غير صالح");
  mkdirSync(dirname(ABSOLUTE_PATH), { recursive: true });
  writeFileSync(ABSOLUTE_PATH, JSON.stringify(input.value, null, 2), "utf8");
  const committed = await commitContentFilesToGitHub({
    files: [{ path: RELATIVE_PATH, absolutePath: ABSOLUTE_PATH }],
    message: `استعادة إصدار إعدادات المنصة: ${input.sourceRevisionId}`,
  });
  if (!committed.commitSha) throw new Error(committed.error ?? "فشل استعادة إعدادات المنصة في GitHub");
  await appendContentRevision({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "platform/restore",
    actorId: input.actor.id,
    actorName: input.actor.name ?? null,
    actorEmail: input.actor.email ?? null,
    before: null,
    after: input.value,
    createdAt: new Date().toISOString(),
    commitId: committed.commitSha,
    gitStatus: "committed",
  });
  return { commitId: committed.commitSha };
}
