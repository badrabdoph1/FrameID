import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { getCurrentAdmin } from "@/modules/admin/get-current-admin";
import { saveContent } from "@/lib/content";
import { ContentSchemas } from "@/lib/content";
import type { ContentSchemaKey } from "@/lib/content";

const schemaKeyMap: Record<string, string> = {
  "marketing-homepage": "marketing/homepage",
  "marketing-templates": "marketing/templates",
  "marketing-pricing": "marketing/pricing",
  "auth-login": "marketing/login",
  "auth-signup": "marketing/signup",
  "auth-forgot-password": "marketing/forgot-password",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
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

    const schema = ContentSchemas[schemaKey as ContentSchemaKey];
    if (!schema) {
      return Response.json(
        { success: false, errors: [{ path: "general", message: `No schema for: ${schemaKey}` }] },
        { status: 400 }
      );
    }

    const admin = await getCurrentAdmin();

    const result = await saveContent(schemaKey as ContentSchemaKey, schema, data, {
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