"use server";

import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getContent, saveContent, ContentSchemas } from "@/lib/content";
import { getManifest } from "@/lib/content";
import type { ContentSchemaKey } from "@/lib/content";

interface PageStudioLoadResult {
  data: Record<string, unknown>;
  version: number;
  updatedAt: string;
}

interface PageStudioSaveResult {
  success: boolean;
  version?: number;
  commitId?: string;
  errors?: Array<{ path: string; message: string }>;
}

const SCHEMA_KEY_MAP: Record<string, ContentSchemaKey> = {
  "marketing-homepage": "marketing/homepage",
  "marketing-templates": "marketing/templates",
  "marketing-pricing": "marketing/pricing",
  "marketing-login": "marketing/login",
  "marketing-signup": "marketing/signup",
  "marketing-forgot-password": "marketing/forgot-password",
  "marketing-checkout": "marketing/checkout",
  "marketing-success": "marketing/success",
  "marketing-error": "marketing/error",
};

export async function loadPageStudioData(pageId: string): Promise<PageStudioLoadResult> {
  await requireAdminPermission("page-studio", "view");

  const schemaKey = SCHEMA_KEY_MAP[pageId];
  if (!schemaKey) {
    throw new Error(`Unknown page: ${pageId}`);
  }

  const content = getContent(schemaKey);
  const { _version, _updatedAt, ...data } = content;

  return {
    data: data as Record<string, unknown>,
    version: _version,
    updatedAt: _updatedAt,
  };
}

export async function savePageStudioData(
  pageId: string,
  data: Record<string, unknown>
): Promise<PageStudioSaveResult> {
  await requireAdminPermission("page-studio", "edit");

  const schemaKey = SCHEMA_KEY_MAP[pageId];
  if (!schemaKey) {
    return {
      success: false,
      errors: [{ path: "general", message: `Unknown page: ${pageId}` }],
    };
  }

  const schema = ContentSchemas[schemaKey];
  if (!schema) {
    return {
      success: false,
      errors: [{ path: "general", message: `No schema for: ${schemaKey}` }],
    };
  }

  // Get admin user from session
  const { getCurrentAdmin } = await import("@/modules/admin/get-current-admin");
  const admin = await getCurrentAdmin();

  const result = await saveContent(schemaKey, data, {
    actor: admin
      ? { id: admin.id, name: admin.name, email: admin.email }
      : undefined,
  });

  return result.success
    ? { success: true, version: result.version, commitId: result.commitId }
    : { success: false, errors: result.errors };
}

export async function getPageStudioManifest(pageId: string) {
  await requireAdminPermission("page-studio", "view");

  const schemaKey = SCHEMA_KEY_MAP[pageId];
  if (!schemaKey) {
    throw new Error(`Unknown page: ${pageId}`);
  }

  const manifest = getManifest();
  const entry = manifest[schemaKey];

  return {
    version: entry?.version ?? 0,
    updatedAt: entry?.updatedAt ?? "",
  };
}