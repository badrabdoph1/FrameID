import { NextRequest } from "next/server";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getCurrentAdmin } from "@/modules/admin/get-current-admin";
import { saveContent } from "@/lib/content";
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    await requireAdminPermission("page-studio", "edit");

    const { pageId } = await params;
    const { data } = await request.json();

    const schemaKey = schemaKeyMap[pageId];
    if (!schemaKey) {
      return Response.json(
        { success: false, errors: [{ path: "general", message: `Unknown page: ${pageId}` }] },
        { status: 400 }
      );
    }

    const admin = await getCurrentAdmin();

    const result = await saveContent(schemaKey as ContentSchemaKey, data, {
      actor: admin
        ? { id: admin.id, name: admin.name, email: admin.email }
        : undefined,
    });

    return Response.json(result);
  } catch (error) {
    console.error("Page Studio save error:", error);
    return Response.json(
      { success: false, errors: [{ path: "general", message: "Internal server error" }] },
      { status: 500 }
    );
  }
}