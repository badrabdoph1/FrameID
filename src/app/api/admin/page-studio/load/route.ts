import { NextRequest } from "next/server";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getContent, getManifest } from "@/lib/content";
import type { ContentSchemaKey } from "@/lib/content";

const schemaKeyMap: Record<string, string> = {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    await requireAdminPermission("page-studio", "view");

    const { pageId } = await params;
    const schemaKey = schemaKeyMap[pageId];

    if (!schemaKey) {
      return Response.json(
        { success: false, error: `Unknown page: ${pageId}` },
        { status: 400 }
      );
    }

    const content = getContent(schemaKey as ContentSchemaKey);
    const manifest = getManifest();
    const entry = manifest[schemaKey];

    return Response.json({
      success: true,
      data: content,
      version: entry?.version ?? 0,
      updatedAt: entry?.updatedAt ?? "",
    });
  } catch (error) {
    console.error("Page Studio load error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}